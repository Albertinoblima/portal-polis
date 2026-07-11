"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { getEditoriaById, searchArticles } from "@/lib/content";

export function SearchResults() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const [term, setTerm] = useState(q);
  const results = q ? searchArticles(q) : [];

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(term ? `/busca/?q=${encodeURIComponent(term)}` : "/busca/");
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="mt-6 flex gap-2">
        <input
          type="search"
          name="q"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Buscar matérias, temas, editorias..."
          className="w-full rounded-sm border border-polis-navy/20 px-4 py-3 text-polis-navy focus:border-polis-gold focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-sm bg-polis-navy px-6 py-3 text-sm font-semibold text-white hover:bg-polis-navy/90"
        >
          Buscar
        </button>
      </form>

      <div className="mt-10">
        {q && (
          <p className="mb-6 text-sm text-polis-slate">
            {results.length} resultado(s) para <strong>&ldquo;{q}&rdquo;</strong>
          </p>
        )}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((article) => (
            <ArticleCard key={article.id} article={article} editoria={getEditoriaById(article.editoriaId)} />
          ))}
        </div>
      </div>
    </>
  );
}
