"use client";

import { useEffect, useRef, useState } from "react";
import { AudioButtonFrame } from "./AudioButtonFrame";
import { useAudioPlaybackController } from "./AudioPlaybackContext";
import { useAudioWordHighlight } from "./useAudioWordHighlight";

/** Botão "Ouvir matéria" tocando o MP3 gerado pelo Piper TTS em build time. */
export function AudioPlayerButton({
  src,
  articleTitle,
  articleSlug,
}: {
  src: string;
  articleTitle: string;
  articleSlug: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { setController } = useAudioPlaybackController();

  useAudioWordHighlight(audioRef, articleSlug);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  }

  // Publica o controle para o botão do cabeçalho (ver AudioPlaybackContext) —
  // única forma de pausar/parar depois que o flip-book já virou passou da
  // página 1, onde este botão vive de verdade.
  useEffect(() => {
    setController({ articleTitle, isPlaying, toggle });
    return () => setController(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, articleTitle]);

  return (
    <>
      <audio
        ref={audioRef}
        src={src}
        preload="none"
        className="hidden"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />
      <AudioButtonFrame
        active={isPlaying}
        label={isPlaying ? "Parar leitura" : "Ouvir matéria"}
        onClick={toggle}
      />
    </>
  );
}
