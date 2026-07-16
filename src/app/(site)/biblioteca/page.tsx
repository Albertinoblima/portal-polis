import type { Metadata } from "next";
import { Newspaper, type NewspaperBlock } from "@/components/newspaper/Newspaper";
import { EditionCard } from "@/components/library/EditionCard";
import { getAllEditions } from "@/lib/editions";

export const metadata: Metadata = {
  title: "Biblioteca",
  description: "Todas as edições do Portal Pólis, para consulta e pesquisa.",
};

export default function BibliotecaPage() {
  const editions = getAllEditions();

  const blocks: NewspaperBlock[] = [
    {
      type: "node",
      node: (
        <header className="flex h-full flex-col justify-center border-b-4 border-polis-gold-muted pb-4">
          <h1 className="font-serif text-4xl font-bold text-polis-ink">Biblioteca</h1>
          <p className="mt-2 max-w-2xl text-polis-ink-soft">
            Todas as edições do Portal Pólis, para consulta e pesquisa. Clique no ícone de uma
            edição para lê-la por completo, ou no título de uma matéria para ir direto a ela.
          </p>
        </header>
      ),
    },
    {
      type: "grid",
      items: editions.map((edition) => <EditionCard key={edition.number} edition={edition} />),
      itemsPerPage: { mobile: 1, desktop: 2 },
      gridClassName: "grid h-full grid-cols-1 gap-6 md:grid-cols-2",
      emptyState: <p className="text-polis-ink-soft">Nenhuma edição publicada ainda.</p>,
    },
  ];

  return <Newspaper sectionLabel="Biblioteca" showMasthead blocks={blocks} />;
}
