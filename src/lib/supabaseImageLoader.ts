// Loader customizado do next/image, necessário porque o site é
// `output: "export"` (sem servidor Node em produção) — a otimização nativa
// do Next não roda. Em vez disso, delegamos a otimização para o endpoint de
// Image Transformations do próprio Supabase Storage, que já está incluído
// no plano Pro e fica cacheado no CDN deles (isso é o que reduz a "Saída em
// cache" de servir sempre o arquivo original em todo tamanho de tela).
//
// Só reescreve URLs que já vêm do Storage público do Supabase
// (`.../storage/v1/object/public/...`, formato devolvido por
// `supabase.storage.from(bucket).getPublicUrl()` em queries.ts). Qualquer
// outro `src` (ex.: assets locais em /public, como logos e fallback de
// avatar de colunista) passa direto, sem transformação — o endpoint de
// render só existe para arquivos que estão de fato no Storage.
import { STORAGE_OBJECT_PATH, isSupabaseGif } from "@/lib/mediaUrl";

const STORAGE_RENDER_PATH = "/storage/v1/render/image/public/";

interface SupabaseImageLoaderParams {
  src: string;
  width: number;
  quality?: number;
}

export default function supabaseImageLoader({ src, width, quality }: SupabaseImageLoaderParams): string {
  // GIF fica de fora de propósito: o endpoint de transformação do Supabase
  // (imgproxy por baixo) achata GIF animado para o primeiro frame — vira
  // imagem estática. GIFs referenciados em featuredImage/content/banners que
  // já foram convertidos por scripts/transcode-gif-media.mjs nem chegam aqui
  // como `.gif` (viram poster + <video> antes do build) — isso só serve de
  // rede de segurança para falha de transcodificação ou a rodada antes do
  // manifest existir. Sem suporte a preservar frames no plano gerenciado (só
  // em self-hosted via IMGPROXY_MAX_ANIMATION_FRAMES), então GIF cru sempre
  // serve o arquivo original — só JPEG/PNG/WebP passam pelo redimensionamento.
  if (!src.includes(STORAGE_OBJECT_PATH) || isSupabaseGif(src)) {
    // O Next avisa em dev se o loader "ignora" `width` (não aparece na URL
    // devolvida) — aqui isso é intencional (arquivo estático local ou GIF
    // servido cru), mas anexamos `?w=` mesmo assim só para satisfazer essa
    // checagem; um servidor estático (GitHub Pages) ignora query string e
    // serve o mesmo arquivo de qualquer forma.
    return `${src}${src.includes("?") ? "&" : "?"}w=${width}`;
  }

  const url = new URL(src);
  url.pathname = url.pathname.replace(STORAGE_OBJECT_PATH, STORAGE_RENDER_PATH);
  url.searchParams.set("width", String(width));
  url.searchParams.set("quality", String(quality ?? 75));
  return url.toString();
}
