import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageChrome } from "@/components/newspaper/PageChrome";
import { WordSearch } from "@/components/games/WordSearch";
import { WORDSEARCHES, getWordSearchArchive } from "@/lib/wordsearch";
import { formatDateOnly, withPlaceholderParam } from "@/lib/utils";

interface CacaPalavrasEdicaoPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const params = getWordSearchArchive(WORDSEARCHES).map((puzzle) => ({ slug: puzzle.slug }));
  return withPlaceholderParam(params, { slug: "_placeholder" });
}

export async function generateMetadata({ params }: CacaPalavrasEdicaoPageProps): Promise<Metadata> {
  const { slug } = await params;
  const puzzle = getWordSearchArchive(WORDSEARCHES).find((p) => p.slug === slug);
  if (!puzzle) return {};
  return {
    title: `Caça-Palavras — Edição de ${formatDateOnly(puzzle.date)}`,
    description: `Edição arquivada do caça-palavras do Portal Pólis, de ${formatDateOnly(puzzle.date)} · Tema: ${puzzle.theme}.`,
  };
}

export default async function CacaPalavrasEdicaoPage({ params }: CacaPalavrasEdicaoPageProps) {
  const { slug } = await params;
  const archive = getWordSearchArchive(WORDSEARCHES);
  const index = archive.findIndex((p) => p.slug === slug);
  if (index === -1) notFound();

  const puzzle = archive[index];
  const newer = archive[index - 1];
  const older = archive[index + 1];

  return (
    <PageChrome
      pageNumber={index + 1}
      totalPages={archive.length}
      sectionLabel="Caça-Palavras"
      columns={1}
      runningTitle={
        <Link href="/entretenimento/caca-palavras/" className="hover:text-polis-gold-ink">
          ‹ Caça-Palavras
        </Link>
      }
    >
      <WordSearch
        puzzle={puzzle}
        dateLabel={`Edição arquivada de ${formatDateOnly(puzzle.date)}`}
        nav={{
          older: older ? { href: `/entretenimento/caca-palavras/${older.slug}/`, label: "‹ Edição anterior" } : undefined,
          newer: newer
            ? {
              href: index === 1 ? "/entretenimento/caca-palavras/" : `/entretenimento/caca-palavras/${newer.slug}/`,
              label: "Edição seguinte ›",
            }
            : undefined,
        }}
      />
    </PageChrome>
  );
}
