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
const STORAGE_OBJECT_PATH = "/storage/v1/object/public/";
const STORAGE_RENDER_PATH = "/storage/v1/render/image/public/";

interface SupabaseImageLoaderParams {
  src: string;
  width: number;
  quality?: number;
}

export default function supabaseImageLoader({ src, width, quality }: SupabaseImageLoaderParams): string {
  // GIF fica de fora de propósito: o endpoint de transformação do Supabase
  // (imgproxy por baixo) achata GIF animado para o primeiro frame — vira
  // imagem estática. Como a maioria das imagens de matéria/banner aqui é
  // GIF, transformar quebraria a animação em quase todo o site. Sem suporte
  // a preservar frames no plano gerenciado (só em self-hosted via
  // IMGPROXY_MAX_ANIMATION_FRAMES), então GIF sempre serve o arquivo
  // original — só JPEG/PNG/WebP passam pelo redimensionamento.
  if (!src.includes(STORAGE_OBJECT_PATH) || src.toLowerCase().endsWith(".gif")) {
    return src;
  }

  const url = new URL(src);
  url.pathname = url.pathname.replace(STORAGE_OBJECT_PATH, STORAGE_RENDER_PATH);
  url.searchParams.set("width", String(width));
  url.searchParams.set("quality", String(quality ?? 75));
  return url.toString();
}
