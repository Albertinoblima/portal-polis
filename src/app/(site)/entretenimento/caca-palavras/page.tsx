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
        <WordSearch
          puzzle={puzzle}
          dateLabel={`Edição de ${formatDateOnly(puzzle.date)}`}
          nav={previous ? { archiveHref: `/entretenimento/caca-palavras/${previous.slug}/` } : undefined}
        />
      ) : (
        <p className="text-center text-polis-ink-soft">Nenhum caça-palavras publicado ainda.</p>
      )}
    </PageChrome>
  );
}
