// Gera áudio (Piper TTS) para cada matéria publicada: um MP3 de preâmbulo
// (nome do jornal, edição, data, categoria, autor, título, subtítulo) e um
// MP3 separado do corpo do texto — ver src/lib/audio.ts (getArticleAudio) e
// src/components/articles/AudioPlayerButton.tsx (toca os dois em sequência).
//
// Por que dois arquivos separados em vez de um único MP3 com tudo junto: (1)
// o destaque de palavra ativa (useAudioWordHighlight.ts) assume que 100% da
// duração do áudio do CORPO mapeia às palavras do corpo — um preâmbulo
// embutido no mesmo arquivo dessincronizaria esse destaque; com dois
// elementos <audio>, o hook nunca vê o preâmbulo. (2) o hash de cache do
// corpo continua sendo só hash(texto do corpo) — se cobrisse preâmbulo+corpo
// combinados, toda matéria já publicada perderia cache no dia deste rollout
// (o preâmbulo nunca existiu antes) e qualquer edição de metadado (renomear
// uma editoria, corrigir nome de autor) forçaria resíntese do corpo inteiro.
//
// Ponto de integração: roda em CI logo após `sync-content` (que já grava o
// HTML da matéria, sem chrome de página, sem tags de rastreamento, e já
// calcula `editionNumber` — ver withEditionNumbers em sync-content.mjs) e
// antes de `next build` (ver .github/workflows/deploy.yml). O site não tem
// servidor em tempo de execução — não existe onde rodar um webhook de CMS de
// forma duradoura — então a estratégia é reprocessar a lista publicada a
// cada disparo do pipeline (push, "Sincronizar site" no admin, ou o cron de
// segurança de 30 min) e pular tudo que já foi gerado (hash do texto não
// mudou). Isso dá o mesmo efeito prático de um hook "ao publicar", sem
// exigir infraestrutura própria.
//
// Fail-safe: qualquer falha (binário ausente, Piper/ffmpeg com erro, timeout)
// é registrada em stderr e a matéria correspondente fica sem esse áudio
// específico nesta rodada — nunca derruba o build, e nunca descarta o cache
// do outro artefato (corpo/preâmbulo) da mesma matéria. Rode com
// --article=<slug> para regenerar uma matéria específica sem varrer todas as
// outras.

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { JSDOM } from "jsdom";
import { runProcess } from "./lib/runProcess.mjs";

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, "src", "content");
const ARTICLES_FILE = path.join(CONTENT_DIR, "articles.json");
const EDITORIAS_FILE = path.join(CONTENT_DIR, "editorias.json");
const AUTHORS_FILE = path.join(CONTENT_DIR, "authors.json");
const MANIFEST_FILE = path.join(CONTENT_DIR, "audio-manifest.json");
const AUDIO_DIR = path.join(ROOT, "public", "assets", "audio");
const PUBLIC_AUDIO_PREFIX = "/assets/audio";

const PIPER_BIN = process.env.PIPER_BIN ?? path.join(ROOT, "piper", "piper");
const PIPER_MODEL = process.env.PIPER_MODEL ?? path.join(ROOT, "piper", "pt_BR-faber-medium.onnx");
const FFMPEG_BIN = process.env.FFMPEG_BIN ?? "ffmpeg";
const PROCESS_TIMEOUT_MS = 120_000;

// Strings que nunca podem virar áudio, mesmo que acabem coladas ao texto por
// engano (ex.: um editor colando o rodapé/assinatura de outro documento
// dentro do editor rich-text). Preferir listar aqui a confiar que o campo
// `content` do Supabase nunca vai conter chrome de página.
const AUTHOR_BLOCKLIST = ["Albertino Bezerra Lima"];

// Saudação tocada no primeiro clique do leitor em qualquer página do site
// (ver src/components/layout/WelcomeChime.tsx) — texto fixo, independente de
// matéria, gerado uma única vez e reaproveitado até o texto mudar (mesmo
// cache por hash de sempre). "__welcome" nunca colide com um slug real de
// matéria (Supabase nunca gera slug começando com "__").
const WELCOME_TEXT = "Bem-vindo ao Portal Pólis, onde a Política faz sentido!";
const WELCOME_MANIFEST_KEY = "__welcome";

// Precisa bater com src/lib/audioPreamble.ts — este script roda via
// `node scripts/x.mjs` puro, sem transpilador de TS, então não dá pra
// importar aquele módulo diretamente (mesmo padrão de duplicação já usado
// para isSupabaseGif em scripts/transcode-gif-media.mjs).
function formatDateSpoken(iso) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}

function buildAudioPreambleText({ editionNumber, publishedAt, editoriaName, authorName, title, subtitle }) {
  const parts = ["Jornal Portal Pólis — Onde a Política faz sentido."];
  parts.push(
    editionNumber
      ? `Edição número ${editionNumber}, ${formatDateSpoken(publishedAt)}.`
      : `${formatDateSpoken(publishedAt)}.`
  );
  if (editoriaName) parts.push(`Editoria: ${editoriaName}.`);
  if (authorName) parts.push(`Por ${authorName}.`);
  parts.push(`${title}.`);
  if (subtitle) parts.push(`${subtitle}.`);
  return parts.join(" ");
}

async function main() {
  const onlySlug = getArgValue("--article");

  if (!existsSync(PIPER_BIN)) {
    console.warn(`⚠ Piper não encontrado em ${PIPER_BIN} — pulando geração de áudio nesta rodada.`);
    return;
  }
  if (!existsSync(PIPER_MODEL)) {
    console.warn(`⚠ Modelo de voz não encontrado em ${PIPER_MODEL} — pulando geração de áudio nesta rodada.`);
    return;
  }

  await mkdir(AUDIO_DIR, { recursive: true });
  const manifest = await readManifest();

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  // Roda mesmo com --article=<slug> (regenerar só uma matéria não deveria
  // pular a saudação se o texto dela também mudou) e mesmo sem nenhuma
  // matéria publicada ainda — ela toca no site inteiro, não numa página de
  // matéria específica.
  const welcomeResult = await synthesizeUnit({
    text: WELCOME_TEXT,
    mp3Path: path.join(AUDIO_DIR, "welcome.mp3"),
    publicFile: `${PUBLIC_AUDIO_PREFIX}/welcome.mp3`,
    cached: manifest[WELCOME_MANIFEST_KEY],
    label: "boas-vindas",
  });
  if (welcomeResult.status === "generated") {
    manifest[WELCOME_MANIFEST_KEY] = welcomeResult.entry;
    generated++;
  } else if (welcomeResult.status === "skipped") {
    skipped++;
  } else {
    failed++;
  }

  const articles = JSON.parse(await readFile(ARTICLES_FILE, "utf-8"));
  const editoriaNameById = await readIdNameMap(EDITORIAS_FILE);
  const authorNameById = await readIdNameMap(AUTHORS_FILE);
  const published = articles.filter(
    (a) => a.status === "published" && new Date(a.publishedAt) <= new Date() && (!onlySlug || a.slug === onlySlug)
  );

  if (published.length === 0) {
    console.warn(onlySlug ? `⚠ Nenhuma matéria publicada com slug "${onlySlug}".` : "⚠ Nenhuma matéria publicada encontrada.");
  }

  for (const article of published) {
    manifest[article.slug] ??= {};
    const entry = manifest[article.slug];

    const preambleText = buildAudioPreambleText({
      editionNumber: article.editionNumber,
      publishedAt: article.publishedAt,
      editoriaName: editoriaNameById.get(article.editoriaId),
      authorName: authorNameById.get(article.authorId),
      title: article.title,
      subtitle: article.subtitle,
    });

    const preambleResult = await synthesizeUnit({
      text: preambleText,
      mp3Path: path.join(AUDIO_DIR, `audio-${article.slug}-preamble.mp3`),
      publicFile: `${PUBLIC_AUDIO_PREFIX}/audio-${article.slug}-preamble.mp3`,
      cached: entry.preamble,
      label: `${article.slug}/preâmbulo`,
    });
    if (preambleResult.status === "generated") {
      entry.preamble = preambleResult.entry;
      generated++;
    } else if (preambleResult.status === "skipped") {
      skipped++;
    } else {
      failed++;
    }

    const plainText = extractPlainText(article.content);
    if (!plainText) {
      console.warn(`⚠ [${article.slug}] matéria sem texto legível após sanitização — pulando corpo.`);
      continue;
    }

    const bodyResult = await synthesizeUnit({
      text: plainText,
      mp3Path: path.join(AUDIO_DIR, `audio-${article.slug}.mp3`),
      publicFile: `${PUBLIC_AUDIO_PREFIX}/audio-${article.slug}.mp3`,
      cached: entry.body,
      label: `${article.slug}/corpo`,
    });
    if (bodyResult.status === "generated") {
      entry.body = bodyResult.entry;
      generated++;
    } else if (bodyResult.status === "skipped") {
      skipped++;
    } else {
      failed++;
    }
  }

  await writeManifest(manifest);
  console.log(`Áudio: ${generated} gerado(s), ${skipped} sem mudança, ${failed} falha(s).`);
}

/** Sintetiza um texto (preâmbulo ou corpo) se o cache não bater, com o mesmo fail-safe de sempre. */
async function synthesizeUnit({ text, mp3Path, publicFile, cached, label }) {
  const hash = hashText(text);
  if (cached?.hash === hash && existsSync(mp3Path)) {
    return { status: "skipped" };
  }

  try {
    await synthesize(text, mp3Path);
    console.log(`✓ [${label}] áudio gerado.`);
    return { status: "generated", entry: { hash, file: publicFile, updatedAt: new Date().toISOString() } };
  } catch (error) {
    console.error(`✗ [${label}] falha ao gerar áudio — mantendo o que já existia: ${error.message}`);
    return { status: "failed" };
  }
}

function getArgValue(flag) {
  const prefix = `${flag}=`;
  const arg = process.argv.find((a) => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
}

async function readIdNameMap(filePath) {
  if (!existsSync(filePath)) return new Map();
  try {
    const rows = JSON.parse(await readFile(filePath, "utf-8"));
    return new Map(rows.map((row) => [row.id, row.name]));
  } catch {
    return new Map();
  }
}

async function readManifest() {
  if (!existsSync(MANIFEST_FILE)) return {};
  try {
    return JSON.parse(await readFile(MANIFEST_FILE, "utf-8"));
  } catch {
    return {};
  }
}

async function writeManifest(manifest) {
  await mkdir(path.dirname(MANIFEST_FILE), { recursive: true });
  await writeFile(MANIFEST_FILE, `${JSON.stringify(manifest, null, 2)}\n`, "utf-8");
}

function hashText(text) {
  return createHash("sha256").update(text).digest("hex");
}

/**
 * HTML da matéria -> texto corrido pronto para TTS.
 * - `textContent` do DOM NÃO ignora o conteúdo de <script>/<style> (são nós
 *   de texto como outro qualquer) — por isso removemos esses elementos
 *   explicitamente antes de ler o texto, para que uma tag de rastreamento
 *   colada por engano no rich-text nunca vire fala.
 * - Remove blocos de autoria bloqueados e caracteres de controle que
 *   quebrariam o stdin do Piper.
 */
function extractPlainText(html) {
  // Insere um espaço antes de cada tag de fechamento de bloco para garantir
  // que parágrafos adjacentes não se colem no textContent. Sem isso,
  // <p>Frase.</p><p>Próxima</p> vira "Frase.Próxima" e o Piper lê o ponto.
  const spacedHtml = (html ?? "").replace(/<\/(p|li|h[1-6]|blockquote|div|td|th|dt|dd)>/gi, " </$1>");
  const dom = new JSDOM(`<!doctype html><body>${spacedHtml}</body>`);
  const { document } = dom.window;
  for (const node of document.querySelectorAll("script, style")) {
    node.remove();
  }
  let text = document.body.textContent ?? "";

  for (const blocked of AUTHOR_BLOCKLIST) {
    text = text.split(blocked).join(" ");
  }

  text = text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ")
    // Remove pontuação de frase/cláusula que ficou flutuante (sem palavra
    // imediatamente antes) após substituição do AUTHOR_BLOCKLIST. Sem isso,
    // um ponto isolado é lido em voz alta como "ponto" pelo Piper.
    .replace(/\s+([.!?;:,])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

  return text;
}

async function synthesize(text, mp3Path) {
  const tmpDir = await fsMkdtemp();
  const wavPath = path.join(tmpDir, "output.wav");

  // --noise_scale  (padrão 0.667): variação de prosódia/entonação. Valores
  //   mais altos produzem fala mais expressiva; acima de ~1.0 pode soar
  //   instável.
  // --noise_w      (padrão 0.8): variação na duração das sílabas. Aumentar
  //   torna o ritmo mais orgânico/humano.
  // --length_scale (padrão 1.0): escala de velocidade. 1.05 = ligeiramente
  //   mais pausada, como um locutor de rádio.
  const piperArgs = [
    "--model", PIPER_MODEL,
    "--output_file", wavPath,
    "--noise_scale", "0.85",
    "--noise_w", "0.95",
    "--length_scale", "1.05",
  ];

  try {
    await runProcess(PIPER_BIN, piperArgs, { stdinText: text, timeoutMs: PROCESS_TIMEOUT_MS });
    await runProcess(FFMPEG_BIN, ["-y", "-i", wavPath, "-codec:a", "libmp3lame", "-qscale:a", "4", mp3Path], {
      timeoutMs: PROCESS_TIMEOUT_MS,
    });
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
}

async function fsMkdtemp() {
  const { mkdtemp } = await import("node:fs/promises");
  return mkdtemp(path.join(os.tmpdir(), "piper-"));
}

main().catch((error) => {
  console.error("✗ generate-audio falhou de forma inesperada:", error.message);
  // Fail-safe: erro aqui nunca deve travar o deploy do restante do site.
  process.exit(0);
});
