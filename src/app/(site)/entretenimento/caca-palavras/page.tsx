import Link from "next/link";
import type { Metadata } from "next";
import { WordSearch } from "@/components/games/WordSearch";
import { WORDSEARCHES, getLatestWordSearch } from "@/lib/wordsearch";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Caça-Palavras",
  description: "O caça-palavras diário do Portal Pólis — hoje com o tema Democracia.",
};

export default function CacaPalavrasPage() {
  const puzzle = getLatestWordSearch(WORDSEARCHES);

  return (
    <div className="paper-texture flex h-full w-full flex-col overflow-y-auto bg-polis-paper text-polis-ink">
      <div className="flex shrink-0 items-center justify-between border-b border-polis-rule/20 px-6 py-2 font-serif text-xs uppercase tracking-[0.2em]">
        <Link href="/entretenimento" className="hover:text-polis-gold-ink">
          ‹ Entretenimento
        </Link>
        <span>Caça-Palavras</span>
      </div>

      <div className="flex-1 px-6 py-8">
        {puzzle ? (
          <>
            <div className="mx-auto mb-8 max-w-4xl text-center">
              <h1 className="font-serif text-4xl font-bold text-polis-ink">Caça-Palavras</h1>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-polis-gold-ink">
                Edição de {formatDate(puzzle.date)} · Tema: {puzzle.theme}
              </p>
              <p className="mx-auto mt-3 max-w-md text-sm text-polis-ink-soft">
                Um caça-palavras novo todo dia — arraste sobre as letras para encontrar cada termo,
                nas 8 direções. Progresso salvo automaticamente no seu navegador.
              </p>
            </div>
            <WordSearch puzzle={puzzle} />
          </>
        ) : (
          <p className="text-center text-polis-ink-soft">Nenhum caça-palavras publicado ainda.</p>
        )}
      </div>

      <div className="flex h-10 shrink-0 items-center justify-between border-t border-polis-rule/20 px-6 text-[11px] tracking-wide">
        <span>Entretenimento</span>
        <span>Portal Pólis</span>
      </div>
    </div>
  );
}
