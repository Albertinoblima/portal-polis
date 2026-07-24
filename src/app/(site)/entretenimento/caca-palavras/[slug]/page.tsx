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
      <div className="mx-auto mb-8 max-w-4xl text-center">
        <h1 className="font-serif text-4xl font-bold text-polis-ink">Caça-Palavras</h1>
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-polis-gold-ink">
          Edição de {formatDateOnly(puzzle.date)} · Tema: {puzzle.theme}
        </p>
        <p className="mx-auto mt-3 max-w-md text-sm text-polis-ink-soft">
          Edição arquivada — as edições anteriores continuam disponíveis aqui, como no arquivo de
          um jornal impresso.
        </p>

        <div className="mt-4 flex items-center justify-center gap-4 text-xs font-semibold uppercase tracking-wide">
          {older ? (
            <Link
              href={`/entretenimento/caca-palavras/${older.slug}/`}
              className="text-polis-ink-soft underline hover:text-polis-gold-ink"
            >
              ‹ Edição anterior
            </Link>
          ) : (
            <span className="text-polis-ink-soft/40">‹ Edição anterior</span>
          )}
          {newer ? (
            <Link
              href={index === 1 ? "/entretenimento/caca-palavras/" : `/entretenimento/caca-palavras/${newer.slug}/`}
              className="text-polis-ink-soft underline hover:text-polis-gold-ink"
            >
              Edição seguinte ›
            </Link>
          ) : (
            <span className="text-polis-ink-soft/40">Edição seguinte ›</span>
          )}
        </div>
      </div>
      <WordSearch puzzle={puzzle} />
    </PageChrome>
  );
}
