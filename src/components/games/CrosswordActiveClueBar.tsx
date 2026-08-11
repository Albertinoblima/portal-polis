"use client";

import type { CrosswordEntry } from "@/lib/crosswords";

interface CrosswordActiveClueBarProps {
  activeEntry: CrosswordEntry | undefined;
  onPrev: () => void;
  onNext: () => void;
  onOpenAllClues: () => void;
}

/** Painel de destaque da dica ativa (mobile): fica logo abaixo do
 *  tabuleiro, sempre mostrando só a dica da palavra selecionada no
 *  momento — a lista completa fica escondida atrás do botão "Todas". As
 *  setas ‹ › avançam para a dica anterior/seguinte na ordem de resolução
 *  sem precisar tocar diretamente numa casa do tabuleiro; é a "camada de
 *  controle" que substitui um teclado virtual dedicado aqui — o teclado
 *  do sistema operacional já cobre bem a digitação de letras em si (basta
 *  um `<input>` de verdade, como o tabuleiro já usa), então um QWERTY
 *  customizado só duplicaria isso com pior previsão de texto/acentos do
 *  que o teclado nativo. O que realmente falta pro fluxo touch é navegar
 *  entre palavras sem mirar em casas pequenas — é isso que esta barra
 *  resolve. */
export function CrosswordActiveClueBar({ activeEntry, onPrev, onNext, onOpenAllClues }: CrosswordActiveClueBarProps) {
  return (
    <div className="flex w-full max-w-md shrink-0 items-stretch gap-1.5">
      <button
        type="button"
        onClick={onPrev}
        aria-label="Dica anterior"
        className="flex w-9 shrink-0 items-center justify-center border border-polis-ink/30 text-polis-ink transition-colors hover:border-polis-gold-muted hover:text-polis-gold-ink"
      >
        ‹
      </button>

      <button
        type="button"
        onClick={onOpenAllClues}
        className="min-w-0 flex-1 border border-polis-rule/25 bg-polis-paper-soft/30 px-3 py-1.5 text-left text-[13px] leading-snug text-polis-ink transition-colors hover:border-polis-gold-muted"
      >
        {activeEntry ? (
          <>
            <strong className="text-polis-gold-ink">
              {activeEntry.number}
              {activeEntry.direction === "across" ? "H" : "V"}.
            </strong>{" "}
            <span className="line-clamp-1">{activeEntry.clue}</span>
          </>
        ) : (
          <span className="text-polis-ink-soft">Toque numa casa para começar</span>
        )}
      </button>

      <button
        type="button"
        onClick={onNext}
        aria-label="Próxima dica"
        className="flex w-9 shrink-0 items-center justify-center border border-polis-ink/30 text-polis-ink transition-colors hover:border-polis-gold-muted hover:text-polis-gold-ink"
      >
        ›
      </button>
    </div>
  );
}
