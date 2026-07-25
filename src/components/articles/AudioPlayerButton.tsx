"use client";

import { useRef, useState } from "react";
import { AudioButtonFrame } from "./AudioButtonFrame";

/** Botão "Ouvir matéria" tocando o MP3 gerado pelo Piper TTS em build time. */
export function AudioPlayerButton({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  }

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
