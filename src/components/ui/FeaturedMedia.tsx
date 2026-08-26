"use client";

import { useEffect, useRef } from "react";
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
 * que hoje renderiza featuredImage/imageUrl.
 *
 * O vídeo só toca quando entra em viewport (IntersectionObserver), nunca com
 * `autoPlay` direto — a Home concatena TODAS as matérias publicadas numa
 * única página do flip-book, e o PageFlipEngine nunca desmonta páginas que já
 * viraram (só reposiciona via transform, ver AudioPlaybackContext.tsx) — ou
 * seja, o `<video>` de cada matéria fica sempre presente no DOM, mesmo fora
 * de tela. `autoPlay` incondicional aqui chegou a gerar ~250 vídeos tocando
 * ao mesmo tempo numa Home com dezenas de matérias, travando o carregamento
 * da página. `preload="metadata"` (nunca "auto"): evita baixar o arquivo
 * inteiro de vídeos fora de tela só porque `priority` foi passado.
 */
export function FeaturedMedia({ imageUrl, videoUrl, alt, fill, sizes, priority, className }: FeaturedMediaProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [videoUrl]);

  if (videoUrl) {
    return (
      <video
        ref={videoRef}
        className={cn(fill && "absolute inset-0 h-full w-full", className)}
        muted
        loop
        playsInline
        preload="metadata"
        poster={imageUrl}
        aria-label={alt}
      >
        <source src={videoUrl} type="video/mp4" />
      </video>
    );
  }

  return <Image src={imageUrl} alt={alt} fill={fill} sizes={sizes} priority={priority} className={className} />;
}
