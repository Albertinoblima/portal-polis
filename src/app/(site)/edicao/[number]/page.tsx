import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Newspaper } from "@/components/newspaper/Newspaper";
import { buildEditionBlocks } from "@/components/newspaper/editionBlocks";
import { getAllEditionsAscending, getEditionByNumber } from "@/lib/editions";
import { formatDateOnly, withPlaceholderParam } from "@/lib/utils";

interface EdicaoPageProps {
  params: Promise<{ number: string }>;
}

export async function generateStaticParams() {
  const params = getAllEditionsAscending().map((edition) => ({ number: String(edition.number) }));
  return withPlaceholderParam(params, { number: "_placeholder" });
}

export async function generateMetadata({ params }: EdicaoPageProps): Promise<Metadata> {
  const { number } = await params;
  const edition = getEditionByNumber(Number(number));
  if (!edition) return {};
  return {
    title: `Edição nº ${edition.number}`,
    description: `Edição de ${formatDateOnly(edition.date)} do Portal Pólis, com ${edition.articles.length} matéria(s).`,
  };
}

export default async function EdicaoPage({ params }: EdicaoPageProps) {
  const { number } = await params;
  const edition = getEditionByNumber(Number(number));
  if (!edition) notFound();

  return <Newspaper sectionLabel={`Edição nº ${edition.number}`} showMasthead blocks={buildEditionBlocks(edition)} />;
}
