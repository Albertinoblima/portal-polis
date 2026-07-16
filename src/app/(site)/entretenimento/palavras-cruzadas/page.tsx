import Link from "next/link";
import type { Metadata } from "next";
import { PageChrome } from "@/components/newspaper/PageChrome";
import { Crossword } from "@/components/games/Crossword";
import { CROSSWORDS, getLatestCrossword } from "@/lib/crosswords";
import { formatDateOnly } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Palavras Cruzadas",
  description: "A palavra cruzada diária do Portal Pólis — hoje com o tema Políticas Públicas.",
};

export default function PalavrasCruzadasPage() {
  const puzzle = getLatestCrossword(CROSSWORDS);

  return (
    <PageChrome
      pageNumber={1}
      totalPages={1}
      sectionLabel="Palavras Cruzadas"
      columns={1}
      runningTitle={
        <Link href="/entretenimento" className="hover:text-polis-gold-ink">
          ‹ Entretenimento
        </Link>
      }
    >
      {puzzle ? (
        <>
          <div className="mx-auto mb-8 max-w-4xl text-center">
            <h1 className="font-serif text-4xl font-bold text-polis-ink">Palavras Cruzadas</h1>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-polis-gold-ink">
              Edição de {formatDateOnly(puzzle.date)} · Tema: {puzzle.theme}
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
    </PageChrome>
  );
}
