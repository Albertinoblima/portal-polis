import { Suspense } from "react";
import type { Metadata } from "next";
import { SearchResults } from "@/components/articles/SearchResults";
import { Newspaper, type NewspaperBlock } from "@/components/newspaper/Newspaper";

export const metadata: Metadata = {
  title: "Busca",
  description: "Busque matérias no Portal Pólis por título, subtítulo ou conteúdo.",
};

export default function BuscaPage() {
  const blocks: NewspaperBlock[] = [
    {
      type: "node",
      node: (
        <div className="flex h-full flex-col">
          <h1 className="font-serif text-4xl font-bold text-polis-ink">Busca</h1>
          <Suspense fallback={null}>
            <SearchResults />
          </Suspense>
        </div>
      ),
    },
  ];

  return <Newspaper sectionLabel="Busca" showMasthead blocks={blocks} />;
}
