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
      type="button"
      onClick={toggleSpeech}
      aria-pressed={isSpeaking}
      className="paper-texture group relative inline-flex items-center gap-3 border-2 border-polis-ink bg-polis-paper-soft px-6 py-2.5 transition-colors hover:bg-polis-ink"
    >
      {/* moldura dupla + ornamentos, ao estilo de anúncio classificado de jornal antigo */}
      <span className="pointer-events-none absolute inset-[3px] border border-polis-ink/70 group-hover:border-polis-paper/70" />
      <Diamond className="-top-[5px] left-1/2 -translate-x-1/2" />
      <Diamond className="-bottom-[5px] left-1/2 -translate-x-1/2" />
      <CornerFlourish className="-left-[1px] -top-[1px]" />
      <CornerFlourish className="-right-[1px] -top-[1px] -scale-x-100" />
      <CornerFlourish className="-left-[1px] -bottom-[1px] -scale-y-100" />
      <CornerFlourish className="-right-[1px] -bottom-[1px] -scale-x-100 -scale-y-100" />

      <MegaphoneIcon speaking={isSpeaking} />
      {/* pointer-events-none: mesmo bug do ArticleCard — a biblioteca de
          page-flip só ignora toques quando event.target É o próprio
          <button> (não olha ancestrais); sem isso, tocar no ícone ou no
          texto (a maior parte da área clicável) faz o touchstart cair no
          fluxo de "virar página" dela, que dá preventDefault() e suprime o
          click sintético do toque — só funcionava na sorte de acertar uma
          borda sem elemento por cima. */}
      <span className="pointer-events-none relative font-serif text-sm font-bold uppercase tracking-wide text-polis-ink group-hover:text-polis-paper">
        {isSpeaking ? "Parar leitura" : "Ouvir matéria"}
      </span>
    </button>
  );
}

function Diamond({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute h-2 w-2 rotate-45 border border-polis-ink bg-polis-paper-soft group-hover:border-polis-paper group-hover:bg-polis-ink ${className ?? ""}`}
    />
  );
}

function CornerFlourish({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`pointer-events-none absolute h-4 w-4 text-polis-ink group-hover:text-polis-paper ${className ?? ""}`}
    >
      <path d="M2 22 C2 10 10 2 22 2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="2" cy="22" r="1.6" fill="currentColor" />
    </svg>
  );
}

function MegaphoneIcon({ speaking }: { speaking: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 32 24"
      className="pointer-events-none relative h-5 w-7 shrink-0 text-polis-ink group-hover:text-polis-paper"
    >
      <path d="M3 9 L14 4 L14 20 L3 15 Z" fill="currentColor" />
      <rect x="1" y="9" width="2.5" height="6" fill="currentColor" />
      <path
        d="M18 8 Q22 12 18 16"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        className={speaking ? "animate-pulse" : undefined}
      />
      <path
        d="M22 5 Q28 12 22 19"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        className={speaking ? "animate-pulse" : undefined}
      />
    </svg>
  );
}
