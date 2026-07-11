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
    <div className="flex min-h-0 flex-1 flex-col">
      <form onSubmit={handleSubmit} className="mt-6 flex shrink-0 gap-2">
        <input
          type="search"
          name="q"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Buscar matérias, temas, editorias..."
          className="w-full rounded-sm border border-polis-ink/20 px-4 py-3 text-polis-ink focus:border-polis-gold-muted focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-sm bg-polis-ink px-6 py-3 text-sm font-semibold text-polis-paper hover:bg-polis-ink/90"
        >
          Buscar
        </button>
      </form>

      {/* Resultados de busca são ilimitados/guiados pelo usuário, então esta é a
          única área do jornal com rolagem interna própria (não é conteúdo editorial). */}
      <div className="mt-6 min-h-0 flex-1 overflow-y-auto">
        {q && (
          <p className="mb-6 text-sm text-polis-ink-soft">
            {results.length} resultado(s) para <strong>&ldquo;{q}&rdquo;</strong>
          </p>
        )}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          {results.map((article) => (
            <ArticleCard key={article.id} article={article} editoria={getEditoriaById(article.editoriaId)} />
          ))}
        </div>
      </div>
    </div>
  );
}
