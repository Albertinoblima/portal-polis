// Converte GIF animado (featuredImage de matéria, banner de publicidade, e
// <img> inline no corpo da matéria) para vídeo MP4/H.264 mudo + poster
// estático, e reescreve src/content/articles.json e src/content/banners.json
// para apontar pros derivados locais em vez do GIF cru do Supabase Storage.
//
// Por quê: quase todo o conteúdo do site é GIF, servido hoje direto do
// Supabase Storage — isso foi a causa raiz do estouro de "Saída em cache" do
// plano Pro (GIF é um formato de compressão fraca, e o Image Transformations
// gerenciado do Supabase achata animação no primeiro frame, então não ajuda
// aqui). Vídeo equivalente costuma pesar 5-20x menos, e ao virar asset
// estático do próprio GitHub Pages (public/assets/video/), esse tráfego sai
// do Supabase por completo.
//
// Ponto de integração: roda em CI logo após `sync-content` e antes de
// `generate-audio`/`next build` (ver .github/workflows/deploy.yml) — mesmo
// espírito de scripts/generate-audio.mjs: reprocessa a lista publicada a
// cada disparo do pipeline, pulando tudo que já foi convertido (cache em
// src/content/video-manifest.json, persistido entre execuções do runner via
// actions/cache). O site não tem servidor em runtime, então essa é a única
// forma de ter algo equivalente a um hook "ao publicar" sem infraestrutura
// própria.
//
// Fail-safe: qualquer falha (ffmpeg ausente, download com erro, timeout)
// é registrada em stderr e aquele GIF específico fica sem vídeo nesta rodada
// — o featuredImage/imageUrl/content correspondente simplesmente não é
// reescrito, e o site continua servindo o GIF cru (src/lib/supabaseImageLoader.ts
// já faz bypass de transformação pra `.gif`, então isso é seguro). Nunca
// derruba o build.

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, rm, mkdtemp } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { JSDOM } from "jsdom";
import { runProcess } from "./lib/runProcess.mjs";
import { mapWithConcurrency } from "./lib/concurrency.mjs";

const ROOT = process.cwd();
const ARTICLES_FILE = path.join(ROOT, "src", "content", "articles.json");
const BANNERS_FILE = path.join(ROOT, "src", "content", "banners.json");
const MANIFEST_FILE = path.join(ROOT, "src", "content", "video-manifest.json");
const VIDEO_DIR = path.join(ROOT, "public", "assets", "video");
const PUBLIC_VIDEO_PREFIX = "/assets/video";

const FFMPEG_BIN = process.env.FFMPEG_BIN ?? "ffmpeg";
const FFMPEG_TIMEOUT_MS = Number(process.env.TRANSCODE_TIMEOUT_MS ?? 180_000);
const DOWNLOAD_TIMEOUT_MS = 60_000;
const MAX_NEW = Number(process.env.TRANSCODE_MAX_NEW ?? 20);
const CONCURRENCY = Number(process.env.TRANSCODE_CONCURRENCY ?? 3);

// Precisa bater com src/lib/mediaUrl.ts (isSupabaseGif) — este script roda
// via `node scripts/x.mjs` puro, sem transpilador de TS, então não dá pra
// importar aquele módulo diretamente; mesmo padrão de duplicação documentada
// já usado em MAX_MEDIA_UPLOAD_BYTES (src/lib/supabase/queries.ts) vs o
// limite do bucket em supabase/migrations/0009_media_bucket_limits_100mb.sql.
const STORAGE_OBJECT_PATH = "/storage/v1/object/public/";
function isSupabaseGif(src) {
  return typeof src === "string" && src.includes(STORAGE_OBJECT_PATH) && src.toLowerCase().endsWith(".gif");
}

// Filtro comum aos dois comandos ffmpeg abaixo: compõe sobre fundo branco
// antes de descartar o canal alfa (H.264/JPEG não têm alfa — sem isso,
// pixels transparentes de um GIF com transparência virariam preto sólido) e
// limita a largura máxima mantendo proporção (nunca upscale, dimensão par
// exigida por yuv420p).
// Usa scale2ref (não o "scale=rw:rh" mais novo sugerido pelo aviso de
// depreciação do ffmpeg): o runner de CI instala ffmpeg via
// `apt-get install ffmpeg` (Ubuntu 24.04 → ffmpeg 6.1.1), que ainda não tem
// as variáveis `rw`/`rh` no filtro `scale` (só chegaram em versões bem mais
// novas) — testado e confirmado quebrado em CI antes desta escolha. scale2ref
// funciona em ambas as versões, só com aviso de depreciação (inofensivo).
const COMPOSITE_FILTER =
  "[0:v]scale='min(960,iw)':-2:flags=lanczos[fg];[1:v][fg]scale2ref[bg][fg2];[bg][fg2]overlay=shortest=1[out]";

async function main() {
  if (!existsSync(ARTICLES_FILE) || !existsSync(BANNERS_FILE)) {
    console.warn("⚠ articles.json/banners.json não encontrados — rode `npm run sync-content` antes. Pulando.");
    return;
  }

  if (!(await ffmpegAvailable())) {
    console.warn(`⚠ ffmpeg não encontrado em "${FFMPEG_BIN}" — pulando transcodificação de GIF nesta rodada.`);
    return;
  }

  const articles = JSON.parse(await readFile(ARTICLES_FILE, "utf-8"));
  const banners = JSON.parse(await readFile(BANNERS_FILE, "utf-8"));
  const manifest = await readManifest();
  await mkdir(VIDEO_DIR, { recursive: true });

  const allUrls = collectGifUrls(articles, banners);
  const uncached = allUrls.filter((url) => !isCached(manifest, url));
  const pending = uncached.slice(0, MAX_NEW);
  const deferredByCap = uncached.length - pending.length;

  let converted = 0;
  let failed = 0;

  await mapWithConcurrency(pending, CONCURRENCY, async (url) => {
    try {
      manifest[hashUrl(url)] = await transcodeOne(url);
      converted++;
      console.log(`✓ [${url}] convertido para vídeo.`);
    } catch (error) {
      failed++;
      console.error(`✗ [${url}] falha na transcodificação — mantendo GIF original: ${error.message}`);
    }
  });

  await writeManifest(manifest);

  const rewrittenArticles = articles.map((article) => rewriteArticle(article, manifest));
  const rewrittenBanners = banners.map((banner) => rewriteBanner(banner, manifest));
  await writeFile(ARTICLES_FILE, `${JSON.stringify(rewrittenArticles, null, 2)}\n`, "utf-8");
  await writeFile(BANNERS_FILE, `${JSON.stringify(rewrittenBanners, null, 2)}\n`, "utf-8");

  const cached = allUrls.length - uncached.length;
  console.log(
    `Vídeo: ${converted} convertido(s), ${failed} falha(s), ${cached} já em cache, ${deferredByCap} adiado(s) pelo cap desta rodada.`
  );
}

async function ffmpegAvailable() {
  try {
    await runProcess(FFMPEG_BIN, ["-version"], { timeoutMs: 10_000 });
    return true;
  } catch {
    return false;
  }
}

function hashUrl(url) {
  return createHash("sha256").update(url).digest("hex").slice(0, 16);
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

function isCached(manifest, url) {
  const entry = manifest[hashUrl(url)];
  if (!entry) return false;
  const videoPath = path.join(ROOT, "public", entry.video.replace(/^\//, ""));
  const posterPath = path.join(ROOT, "public", entry.poster.replace(/^\//, ""));
  return existsSync(videoPath) && existsSync(posterPath);
}

/** Extrai `src` de todo `<img>` cujo GIF é do Storage público do Supabase, dentro de um HTML de corpo de matéria. */
function extractGifImgSrcs(content) {
  if (!content) return [];
  const dom = new JSDOM(`<!doctype html><body>${content}</body>`);
  return Array.from(dom.window.document.querySelectorAll("img"))
    .map((img) => img.getAttribute("src"))
    .filter(isSupabaseGif);
}

function collectGifUrls(articles, banners) {
  const urls = new Set();
  for (const article of articles) {
    if (isSupabaseGif(article.featuredImage)) urls.add(article.featuredImage);
    for (const src of extractGifImgSrcs(article.content)) urls.add(src);
  }
  for (const banner of banners) {
    if (isSupabaseGif(banner.imageUrl)) urls.add(banner.imageUrl);
  }
  return [...urls];
}

async function transcodeOne(url) {
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), "gif2video-"));
  const gifPath = path.join(tmpDir, "source.gif");
  const hash = hashUrl(url);
  const videoPath = path.join(VIDEO_DIR, `${hash}.mp4`);
  const posterPath = path.join(VIDEO_DIR, `${hash}-poster.jpg`);

  try {
    await downloadFile(url, gifPath);

    await runProcess(
      FFMPEG_BIN,
      [
        "-y",
        "-i", gifPath,
        "-f", "lavfi",
        "-i", "color=c=white",
        "-filter_complex", COMPOSITE_FILTER,
        "-map", "[out]",
        "-an",
        "-c:v", "libx264",
        "-crf", "23",
        "-preset", "veryfast",
        "-r", "24",
        "-movflags", "faststart",
        "-pix_fmt", "yuv420p",
        videoPath,
      ],
      { timeoutMs: FFMPEG_TIMEOUT_MS }
    );

    await runProcess(
      FFMPEG_BIN,
      [
        "-y",
        "-i", gifPath,
        "-f", "lavfi",
        "-i", "color=c=white",
        "-filter_complex", COMPOSITE_FILTER,
        "-map", "[out]",
        "-vframes", "1",
        posterPath,
      ],
      { timeoutMs: FFMPEG_TIMEOUT_MS }
    );

    return {
      sourceUrl: url,
      video: `${PUBLIC_VIDEO_PREFIX}/${hash}.mp4`,
      poster: `${PUBLIC_VIDEO_PREFIX}/${hash}-poster.jpg`,
      updatedAt: new Date().toISOString(),
    };
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
}

async function downloadFile(url, destPath) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`download falhou com status ${response.status}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(destPath, buffer);
  } finally {
    clearTimeout(timeout);
  }
}

function escapeHtmlAttr(text) {
  return text.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

// `preload="none"` + `data-video-src` (em vez de um <source src> direto): a
// Home concatena TODAS as edições publicadas sem paginar (getAllEditions(),
// sem limite), e o PageFlipEngine nunca desmonta página nenhuma — então todo
// vídeo embutido no corpo de toda matéria, de toda edição já publicada, fica
// sempre presente no DOM. Um <source src> direto dispara uma requisição por
// vídeo assim que a página carrega, crescendo pra sempre a cada matéria
// nova, mesmo pras que o leitor nunca rola até ver. useInlineVideoAutoplay.ts
// (que já tinha o IntersectionObserver de play/pause) passa a materializar o
// <source> de verdade só quando o vídeo entra em viewport pela primeira
// vez — mesmo raciocínio do `shouldLoad` em FeaturedMedia.tsx, só que via DOM
// manual porque este HTML é injetado como string estática
// (dangerouslySetInnerHTML), não é um componente React.
function buildVideoSnippet(entry, alt) {
  const altAttr = alt ? ` aria-label="${escapeHtmlAttr(alt)}"` : "";
  return `<video class="w-full h-auto" muted loop playsinline preload="none" poster="${entry.poster}" data-inline-video data-video-src="${entry.video}"${altAttr}></video>`;
}

function rewriteArticle(article, manifest) {
  let featuredImage = article.featuredImage;
  let featuredVideoUrl = article.featuredVideoUrl;
  if (isSupabaseGif(featuredImage)) {
    const entry = manifest[hashUrl(featuredImage)];
    if (entry) {
      featuredImage = entry.poster;
      featuredVideoUrl = entry.video;
    }
  }

  let content = article.content;
  if (content) {
    const dom = new JSDOM(`<!doctype html><body>${content}</body>`);
    for (const img of dom.window.document.querySelectorAll("img")) {
      const src = img.getAttribute("src");
      if (!isSupabaseGif(src)) continue;
      const entry = manifest[hashUrl(src)];
      if (!entry) continue;

      const outerHTML = img.outerHTML;
      if (!content.includes(outerHTML)) {
        console.warn(`⚠ [${article.slug}] <img> não bateu como substring exata no content — pulando (src=${src}).`);
        continue;
      }
      content = content.split(outerHTML).join(buildVideoSnippet(entry, img.getAttribute("alt") ?? ""));
    }
  }

  return { ...article, featuredImage, featuredVideoUrl, content };
}

function rewriteBanner(banner, manifest) {
  if (!isSupabaseGif(banner.imageUrl)) return banner;
  const entry = manifest[hashUrl(banner.imageUrl)];
  if (!entry) return banner;
  return { ...banner, imageUrl: entry.poster, videoUrl: entry.video };
}

main().catch((error) => {
  console.error("✗ transcode-gif-media falhou de forma inesperada:", error.message);
  // Fail-safe: erro aqui nunca deve travar o deploy do restante do site.
  process.exit(0);
});
