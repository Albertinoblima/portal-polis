"use client";

import { useState } from "react";
import { AudioButtonFrame } from "./AudioButtonFrame";

export function ListenButton({ text }: { text: string }) {
  const [isSpeaking, setIsSpeaking] = useState(false);

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

  return (
    <AudioButtonFrame
      active={isSpeaking}
      label={isSpeaking ? "Parar leitura" : "Ouvir matéria"}
      onClick={toggleSpeech}
    />
  );
}
