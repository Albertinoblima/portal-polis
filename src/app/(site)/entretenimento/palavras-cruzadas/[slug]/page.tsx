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
      <Crossword
        puzzle={puzzle}
        dateLabel={`Edição arquivada de ${formatDateOnly(puzzle.date)}`}
        nav={{
          older: older ? { href: `/entretenimento/palavras-cruzadas/${older.slug}/`, label: "‹ Edição anterior" } : undefined,
          newer: newer
            ? {
              href: index === 1 ? "/entretenimento/palavras-cruzadas/" : `/entretenimento/palavras-cruzadas/${newer.slug}/`,
              label: "Edição seguinte ›",
            }
            : undefined,
        }}
      />
    </PageChrome>
  );
}
