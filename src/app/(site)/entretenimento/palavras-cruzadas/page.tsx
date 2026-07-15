import Link from "next/link";
import type { Metadata } from "next";
import { Crossword } from "@/components/games/Crossword";
import { CROSSWORDS, getLatestCrossword } from "@/lib/crosswords";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Palavras Cruzadas",
  description: "A palavra cruzada diária do Portal Pólis — hoje com o tema Políticas Públicas.",
};

export default function PalavrasCruzadasPage() {
  const puzzle = getLatestCrossword(CROSSWORDS);

  return (
    <div className="paper-texture flex h-full w-full flex-col overflow-y-auto bg-polis-paper text-polis-ink">
      <div className="flex shrink-0 items-center justify-between border-b border-polis-rule/20 px-6 py-2 font-serif text-xs uppercase tracking-[0.2em]">
        <Link href="/entretenimento" className="hover:text-polis-gold-ink">
          ‹ Entretenimento
        </Link>
        <span>Palavras Cruzadas</span>
      </div>

      <div className="flex-1 px-6 py-8">
        {puzzle ? (
          <>
            <div className="mx-auto mb-8 max-w-4xl text-center">
              <h1 className="font-serif text-4xl font-bold text-polis-ink">Palavras Cruzadas</h1>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-polis-gold-ink">
                Edição de {formatDate(puzzle.date)} · Tema: {puzzle.theme}
              </p>
              <p className="mx-auto mt-3 max-w-md text-sm text-polis-ink-soft">
                Uma palavra cruzada nova todo dia, no espírito dos passatempos de jornal impresso —
                só que com correção automática e progresso salvo no seu navegador.
              </p>
            </div>
            <Crossword puzzle={puzzle} />
          </>
        ) : (
          <p className="text-center text-polis-ink-soft">Nenhuma palavra cruzada publicada ainda.</p>
        )}
      </div>

      <div className="flex h-10 shrink-0 items-center justify-between border-t border-polis-rule/20 px-6 text-[11px] tracking-wide">
        <span>Entretenimento</span>
        <span>Portal Pólis</span>
      </div>
    </div>
  );
}
