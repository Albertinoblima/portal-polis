"use client";

import { useAudioPlaybackController } from "./AudioPlaybackContext";

/** Só aparece enquanto existe uma leitura de matéria ativa (tocando ou
 *  pausada) — ver AudioPlaybackContext. Fica ao lado da lupa de busca para
 *  dar acesso a pausar/retomar de qualquer página do flip-book, sem precisar
 *  voltar até a página 1 da matéria. */
export function HeaderAudioControl() {
  const { controller } = useAudioPlaybackController();
  if (!controller) return null;

  return (
    <button
      type="button"
      onClick={controller.toggle}
      aria-pressed={controller.isPlaying}
      aria-label={`${controller.isPlaying ? "Pausar" : "Retomar"} leitura: ${controller.articleTitle}`}
      title={controller.articleTitle}
      className="rounded-full p-2 text-polis-ink hover:bg-polis-ink/10"
    >
      {controller.isPlaying ? <PauseIcon /> : <PlayIcon />}
    </button>
  );
}

function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="5" width="4" height="14" className="animate-pulse" />
      <rect x="14" y="5" width="4" height="14" className="animate-pulse" />
    </svg>
  );
}
