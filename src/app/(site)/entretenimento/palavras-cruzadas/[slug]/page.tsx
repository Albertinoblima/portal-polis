import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageChrome } from "@/components/newspaper/PageChrome";
import { Crossword } from "@/components/games/Crossword";
import { CROSSWORDS, getCrosswordArchive } from "@/lib/crosswords";
import { formatDateOnly, withPlaceholderParam } from "@/lib/utils";

interface PalavrasCruzadasEdicaoPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const params = getCrosswordArchive(CROSSWORDS).map((puzzle) => ({ slug: puzzle.slug }));
  return withPlaceholderParam(params, { slug: "_placeholder" });
}

export async function generateMetadata({ params }: PalavrasCruzadasEdicaoPageProps): Promise<Metadata> {
  const { slug } = await params;
  const puzzle = getCrosswordArchive(CROSSWORDS).find((p) => p.slug === slug);
  if (!puzzle) return {};
  return {
    title: `Palavras Cruzadas — Edição de ${formatDateOnly(puzzle.date)}`,
    description: `Edição arquivada da palavra cruzada do Portal Pólis, de ${formatDateOnly(puzzle.date)} · Tema: ${puzzle.theme}.`,
  };
}

export default async function PalavrasCruzadasEdicaoPage({ params }: PalavrasCruzadasEdicaoPageProps) {
  const { slug } = await params;
  const archive = getCrosswordArchive(CROSSWORDS);
  const index = archive.findIndex((p) => p.slug === slug);
  if (index === -1) notFound();

  const puzzle = archive[index];
  const newer = archive[index - 1];
  const older = archive[index + 1];

  return (
    <PageChrome
      pageNumber={index + 1}
      totalPages={archive.length}
      sectionLabel="Palavras Cruzadas"
      columns={1}
      runningTitle={
        <Link href="/entretenimento/palavras-cruzadas/" className="hover:text-polis-gold-ink">
          ‹ Palavras Cruzadas
        </Link>
      }
    >
      <div className="mx-auto mb-8 max-w-4xl text-center">
        <h1 className="font-serif text-4xl font-bold text-polis-ink">Palavras Cruzadas</h1>
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
              href={`/entretenimento/palavras-cruzadas/${older.slug}/`}
              className="text-polis-ink-soft underline hover:text-polis-gold-ink"
            >
              ‹ Edição anterior
            </Link>
          ) : (
            <span className="text-polis-ink-soft/40">‹ Edição anterior</span>
          )}
          {newer ? (
            <Link
              href={
                index === 1 ? "/entretenimento/palavras-cruzadas/" : `/entretenimento/palavras-cruzadas/${newer.slug}/`
              }
              className="text-polis-ink-soft underline hover:text-polis-gold-ink"
            >
              Edição seguinte ›
            </Link>
          ) : (
            <span className="text-polis-ink-soft/40">Edição seguinte ›</span>
          )}
        </div>
      </div>
      <Crossword puzzle={puzzle} />
    </PageChrome>
  );
}
