"use client";

import { useEffect } from "react";

/**
 * Toca/pausa os <video data-inline-video> injetados no corpo da matéria por
 * scripts/transcode-gif-media.mjs (GIF convertido, sem autoplay no HTML
 * estático de propósito) conforme entram/saem do viewport, via
 * IntersectionObserver.
 *
 * Por que não usar `autoplay` direto no HTML: o corpo da matéria passa por
 * paginate.ts, que clona os nós num "probe" fora da tela para medir onde
 * cortar a página (document.body.appendChild(probe) — ver paginate.ts). Um
 * <video autoplay> clonado ali disparia carregamento de vídeo a cada
 * reflow/resize, multiplicando banda sem necessidade. Reconsulta o DOM a
 * cada chamada (em vez de guardar referências) pelo mesmo motivo documentado
 * em useAudioWordHighlight.ts: resize re-pagina a matéria e recria os nós,
 * invalidando qualquer referência guardada antes.
 */
export function useInlineVideoAutoplay(rescanKey: unknown) {
  useEffect(() => {
    if (typeof document === "undefined" || typeof IntersectionObserver === "undefined") return;

    const videos = Array.from(document.querySelectorAll<HTMLVideoElement>("[data-tts-body] video[data-inline-video]"));
    if (videos.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const video = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        }
      },
      { threshold: 0.25 }
    );

    for (const video of videos) observer.observe(video);
    return () => observer.disconnect();
  }, [rescanKey]);
}
