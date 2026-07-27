"use client";

import { useEffect, useState } from "react";
import { AudioButtonFrame } from "./AudioButtonFrame";
import { useAudioPlaybackController } from "./AudioPlaybackContext";

export function ListenButton({ text, articleTitle }: { text: string; articleTitle: string }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { setController } = useAudioPlaybackController();

  function toggleSpeech() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  }

  // Publica o controle para o botão do cabeçalho (ver AudioPlaybackContext) —
  // única forma de pausar/parar depois que o flip-book já virou passou da
  // página 1, onde este botão vive de verdade.
  useEffect(() => {
    setController({ articleTitle, isPlaying: isSpeaking, toggle: toggleSpeech });
    return () => setController(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSpeaking, articleTitle]);

  return (
    <AudioButtonFrame
      active={isSpeaking}
      label={isSpeaking ? "Parar leitura" : "Ouvir matéria"}
      onClick={toggleSpeech}
    />
  );
}
