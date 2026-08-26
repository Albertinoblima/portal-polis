import Image from "next/image";
import { cn } from "@/lib/utils";

interface FeaturedMediaProps {
  /** Poster (quando há vídeo) ou imagem estática normal — sempre presente. */
  imageUrl: string;
  videoUrl?: string;
  alt: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  className?: string;
}

/**
 * Decide entre <video> (GIF convertido por scripts/transcode-gif-media.mjs)
 * e <Image> (imagem estática normal) num único ponto, usado em todo lugar
 * que hoje renderiza featuredImage/imageUrl. `autoPlay` aqui é seguro — este
 * elemento nunca passa pelo paginador de matéria (paginate.ts), que clona
 * nós fora da árvore visível; só o HTML bruto do corpo da matéria passa por
 * lá, e por isso o <video> injetado ali (ver transcode-gif-media.mjs) não
 * leva autoplay, ficando a cargo de useInlineVideoAutoplay.ts.
 */
export function FeaturedMedia({ imageUrl, videoUrl, alt, fill, sizes, priority, className }: FeaturedMediaProps) {
  if (videoUrl) {
    return (
      <video
        className={cn(fill && "absolute inset-0 h-full w-full", className)}
        muted
        loop
        playsInline
        autoPlay
        preload={priority ? "auto" : "metadata"}
        poster={imageUrl}
        aria-label={alt}
      >
        <source src={videoUrl} type="video/mp4" />
      </video>
    );
  }

  return <Image src={imageUrl} alt={alt} fill={fill} sizes={sizes} priority={priority} className={className} />;
}
