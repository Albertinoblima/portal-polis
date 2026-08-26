import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Módulo separado de content.ts de propósito: content.ts é importado por
// componentes "use client" (ex.: NavBar.tsx), e o bundler do Next também
// tenta empacotar esse arquivo para o client — onde `node:fs` não existe e
// quebra o build ("the chunking context does not support external modules").
// Só importe este arquivo a partir de Server Components.
//
// Gerado por scripts/generate-audio.mjs (Piper TTS) em CI, antes do `next
// build`. Lido via fs (em vez de `import ... from "@/content/audio-manifest.json"`)
// porque esse arquivo só existe depois da primeira rodada do script — um
// import estático quebraria o build antes disso.
interface AudioManifestEntry {
  hash: string;
  file: string;
  updatedAt: string;
}

interface AudioManifestArticleEntry {
  body?: AudioManifestEntry;
  preamble?: AudioManifestEntry;
}

function loadAudioManifest(): Record<string, AudioManifestArticleEntry> {
  try {
    const manifestPath = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "..",
      "content",
      "audio-manifest.json"
    );
    return JSON.parse(readFileSync(manifestPath, "utf-8"));
  } catch {
    return {};
  }
}

const audioManifest = loadAudioManifest();

/**
 * `preambleSrc` toca antes de `bodySrc` (ver AudioPlayerButton.tsx) — nome do
 * jornal, edição, data, categoria, autor, título e subtítulo, gerado
 * separado do corpo por scripts/generate-audio.mjs. Sem entrada de corpo,
 * não há player Piper para esta matéria (cai no fallback ListenButton).
 */
export function getArticleAudio(slug: string): { bodySrc: string; preambleSrc?: string } | undefined {
  const entry = audioManifest[slug];
  if (!entry?.body) return undefined;
  return { bodySrc: entry.body.file, preambleSrc: entry.preamble?.file };
}
