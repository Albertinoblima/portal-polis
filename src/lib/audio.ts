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
function loadAudioManifest(): Record<string, { file: string }> {
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

export function getArticleAudioUrl(slug: string): string | undefined {
  return audioManifest[slug]?.file;
}
