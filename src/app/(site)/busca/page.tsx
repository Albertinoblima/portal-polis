import { Suspense } from "react";
import type { Metadata } from "next";
import { SearchResults } from "@/components/articles/SearchResults";

export const metadata: Metadata = {
  title: "Busca",
  description: "Busque matérias no Pólis por título, subtítulo ou conteúdo.",
};

export default function BuscaPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <h1 className="font-sans text-4xl font-bold text-polis-navy">Busca</h1>
      <Suspense fallback={null}>
        <SearchResults />
      </Suspense>
    </div>
  );
}
