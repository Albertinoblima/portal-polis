"use client";

import { useState } from "react";

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
    <button
      onClick={toggleSpeech}
      className="inline-flex items-center gap-2 rounded-sm border border-polis-navy px-4 py-2 text-sm font-semibold text-polis-navy transition-colors hover:bg-polis-navy hover:text-white"
    >
      <span aria-hidden>{isSpeaking ? "⏸" : "🔊"}</span>
      {isSpeaking ? "Parar leitura" : "Ouvir matéria"}
    </button>
  );
}
