// Gera áudio (Piper TTS) para cada matéria publicada e injeta a URL do MP3
// resultante em src/content/audio-manifest.json, consumido por
// src/lib/content.ts (getArticleAudioUrl) e renderizado como <audio controls>
// em src/components/newspaper/editionBlocks.tsx.
//
// Ponto de integração: roda em CI logo após `sync-content` (que já grava o
// HTML da matéria, sem chrome de página, sem tags de rastreamento) e antes de
// `next build` (ver .github/workflows/deploy.yml). O site não tem servidor em
// tempo de execução — não existe onde rodar um webhook de CMS de forma
// duradoura — então a estratégia é reprocessar a lista publicada a cada
// disparo do pipeline (push, "Sincronizar site" no admin, ou o cron de
// segurança de 30 min) e pular tudo que já foi gerado (hash do texto
// sanitizado não mudou). Isso dá o mesmo efeito prático de um hook "ao
// publicar", sem exigir infraestrutura própria.
//
// Fail-safe: qualquer falha (binário ausente, Piper/ffmpeg com erro, timeout)
// é registrada em stderr e a matéria correspondente fica sem áudio nesta
// rodada — nunca derruba o build. Rode com --article=<slug> para regenerar
// uma matéria específica sem varrer todas as outras.

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { JSDOM } from "jsdom";
import { runProcess } from "./lib/runProcess.mjs";

const ROOT = process.cwd();
const ARTICLES_FILE = path.join(ROOT, "src", "content", "articles.json");
const MANIFEST_FILE = path.join(ROOT, "src", "content", "audio-manifest.json");
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

  const articles = JSON.parse(await readFile(ARTICLES_FILE, "utf-8"));
  const published = articles.filter(
    (a) => a.status === "published" && new Date(a.publishedAt) <= new Date() && (!onlySlug || a.slug === onlySlug)
  );

  if (published.length === 0) {
    console.warn(onlySlug ? `⚠ Nenhuma matéria publicada com slug "${onlySlug}".` : "⚠ Nenhuma matéria publicada encontrada.");
    return;
  }

  await mkdir(AUDIO_DIR, { recursive: true });
  const manifest = await readManifest();

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const article of published) {
    const plainText = extractPlainText(article.content);
    if (!plainText) {
      console.warn(`⚠ [${article.slug}] matéria sem texto legível após sanitização — pulando.`);
      continue;
    }

    const hash = hashText(plainText);
    const mp3Path = path.join(AUDIO_DIR, `audio-${article.slug}.mp3`);
    const cached = manifest[article.slug];

    if (cached?.hash === hash && existsSync(mp3Path)) {
      skipped++;
      continue;
    }

    try {
      await synthesize(plainText, mp3Path);
      manifest[article.slug] = { hash, file: `${PUBLIC_AUDIO_PREFIX}/audio-${article.slug}.mp3`, updatedAt: new Date().toISOString() };
      generated++;
      console.log(`✓ [${article.slug}] áudio gerado.`);
    } catch (error) {
      failed++;
      console.error(`✗ [${article.slug}] falha ao gerar áudio — publicando sem player: ${error.message}`);
    }
  }

  await writeManifest(manifest);
  console.log(`Áudio: ${generated} gerado(s), ${skipped} sem mudança, ${failed} falha(s).`);
}

function getArgValue(flag) {
  const prefix = `${flag}=`;
  const arg = process.argv.find((a) => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
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
