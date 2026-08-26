"use client";

import { useEffect, useRef, useState } from "react";
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
 * da página.
 *
 * O mesmo problema existe pro `<source>`, não só pro play(): `preload=
 * "metadata"` sozinho já dispara uma requisição por vídeo assim que o
 * elemento entra no DOM, mesmo sem tocar — e como a Home não pagina
 * (getAllEditions(), sem limite), esse nº de requisições cresce a cada
 * matéria nova publicada, pra sempre, mesmo para as que o leitor nunca rola
 * até ver. Por isso o `<source>` só entra no DOM quando `shouldLoad` vira
 * true — no MESMO instante em que o vídeo entraria em viewport pela
 * primeira vez, reaproveitando o mesmo IntersectionObserver do play/pause
 * (threshold 0.25) em vez de expor uma segunda margem de pré-carga
 * especulativa: as páginas fora de tela são reposicionadas via transform,
 * não removidas do fluxo do documento, então não há como validar uma
 * distância "razoável" sem medir o layout real do flip-book.
 *
 * `shouldLoad` funciona como uma trava (só liga, nunca desliga de novo) —
 * uma vez carregado, o vídeo fica pronto para tocar/pausar normalmente pelo
 * resto da sessão, sem recarregar toda vez que sai e volta a entrar em tela.
 */
export function FeaturedMedia({ imageUrl, videoUrl, alt, fill, sizes, priority, className }: FeaturedMediaProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    // Sem suporte à API (navegador muito antigo): mesma degradação de
    // sempre — igual ao play/pause abaixo, o vídeo simplesmente nunca
    // carrega/toca sozinho e fica só no poster estático.
    if (!video || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
        if (entry.isIntersecting) setShouldLoad(true);
      },
      { threshold: 0.25 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [videoUrl]);

  // Dispara a seleção de fonte assim que o <source> entra no DOM (ver JSX
  // abaixo) — inserir um <source> depois do mount não é suficiente sozinho
  // em todo navegador (Firefox/Safari exigem load() explícito quando o
  // elemento já tinha assentado em NETWORK_EMPTY por não ter fonte nenhuma
  // no primeiro render). Precisa rodar ANTES do efeito de play/pause abaixo
  // (React roda efeitos na ordem em que aparecem no componente) para que o
  // play() já encontre uma fonte selecionada.
  useEffect(() => {
    if (shouldLoad) videoRef.current?.load();
  }, [shouldLoad]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !shouldLoad) return;
    if (isVisible) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [shouldLoad, isVisible]);

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
        {shouldLoad && <source src={videoUrl} type="video/mp4" />}
      </video>
    );
  }

  return <Image src={imageUrl} alt={alt} fill={fill} sizes={sizes} priority={priority} className={className} />;
}
