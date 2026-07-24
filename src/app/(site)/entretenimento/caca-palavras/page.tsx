import Link from "next/link";
import type { Metadata } from "next";
import { PageChrome } from "@/components/newspaper/PageChrome";
import { WordSearch } from "@/components/games/WordSearch";
import { WORDSEARCHES, getWordSearchArchive } from "@/lib/wordsearch";
import { formatDateOnly } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Caça-Palavras",
  description: "O caça-palavras diário do Portal Pólis — hoje com o tema Democracia.",
};

export default function CacaPalavrasPage() {
  const archive = getWordSearchArchive(WORDSEARCHES);
  const puzzle = archive[0] ?? null;
  const previous = archive[1];

  return (
    <PageChrome
      pageNumber={1}
      totalPages={Math.max(archive.length, 1)}
      sectionLabel="Caça-Palavras"
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
            <h1 className="font-serif text-4xl font-bold text-polis-ink">Caça-Palavras</h1>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-polis-gold-ink">
              Edição de {formatDateOnly(puzzle.date)} · Tema: {puzzle.theme}
            </p>
            <p className="mx-auto mt-3 max-w-md text-sm text-polis-ink-soft">
              Um caça-palavras novo todo dia — arraste sobre as letras para encontrar cada termo,
              nas 8 direções. Progresso salvo automaticamente no seu navegador.
            </p>
            {previous && (
              <p className="mt-4 text-xs">
                <Link href={`/entretenimento/caca-palavras/${previous.slug}/`} className="text-polis-ink-soft underline hover:text-polis-gold-ink">
                  Ver edições anteriores ›
                </Link>
              </p>
            )}
          </div>
          <WordSearch puzzle={puzzle} />
        </>
      ) : (
        <p className="text-center text-polis-ink-soft">Nenhum caça-palavras publicado ainda.</p>
      )}
    </PageChrome>
  );
}
