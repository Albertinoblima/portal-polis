// Critério de detecção compartilhado entre src/lib/supabaseImageLoader.ts
// (bypass de transformação no client/build do Next) e
// scripts/transcode-gif-media.mjs (o que entra no pipeline de transcodificação
// em CI) — as duas checagens precisam ficar sempre em sincronia, senão um
// GIF pode ser tratado como transformável num lugar e não no outro.
export const STORAGE_OBJECT_PATH = "/storage/v1/object/public/";

export function isSupabaseGif(src: string): boolean {
  return src.includes(STORAGE_OBJECT_PATH) && src.toLowerCase().endsWith(".gif");
}
