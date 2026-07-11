"use client";

import Link from "next/link";
import { useState } from "react";
import { AdminTopbar } from "@/components/admin/Topbar";
import { StatusBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { getArticlesForAdmin, softDeleteArticle } from "@/lib/supabase/queries";
import { useAdminSession } from "@/components/admin/AuthProvider";
import { logAction } from "@/lib/supabase/audit";
import { formatDate } from "@/lib/utils";

export default function AdminMateriasPage() {
  const { profile } = useAdminSession();
  const { data: articles, loading, error, refetch } = useSupabaseQuery(getArticlesForAdmin);
  const [search, setSearch] = useState("");
  const canDelete = profile.role === "admin" || profile.role === "editor_chief";

  const filtered = (articles ?? []).filter((article) =>
    article.title.toLowerCase().includes(search.toLowerCase())
  );

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Arquivar a matéria "${title}"? Ela deixa de aparecer no site.`)) return;
    await softDeleteArticle(id);
    await logAction({
      userId: profile.id,
      action: "archive",
      entity: "article",
      entityId: id,
      newValue: { title },
    });
    refetch();
  }

  return (
    <>
      <AdminTopbar title="Matérias" description="Gerencie o conteúdo publicado no portal." />

      <div className="p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar matérias..."
            className="w-full max-w-sm rounded-sm border border-polis-navy/20 px-4 py-2 text-sm focus:border-polis-gold focus:outline-none"
          />
          <ButtonLink href="/admin/materias/nova/">+ Nova Matéria</ButtonLink>
        </div>

        {error && <p className="mb-4 text-sm text-red-700">Erro ao carregar matérias: {error}</p>}

        <div className="overflow-x-auto rounded-sm border border-polis-navy/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-polis-navy/10 bg-polis-off-white text-xs uppercase tracking-wide text-polis-gray">
              <tr>
                <th className="px-5 py-3">Título</th>
                <th className="px-5 py-3">Editoria</th>
                <th className="px-5 py-3">Autor</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Atualizado</th>
                <th className="px-5 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-polis-navy/10">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-polis-slate">
                    Carregando...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-polis-slate">
                    Nenhuma matéria encontrada.
                  </td>
                </tr>
              ) : (
                filtered.map((article) => (
                  <tr key={article.id}>
                    <td className="max-w-xs truncate px-5 py-3 font-medium text-polis-navy">
                      {article.title}
                    </td>
                    <td className="px-5 py-3 text-polis-slate">{article.editoria?.name}</td>
                    <td className="px-5 py-3 text-polis-slate">{article.author?.name}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={article.status} />
                    </td>
                    <td className="px-5 py-3 text-polis-slate">{formatDate(article.updated_at)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/admin/materias/editar/?id=${article.id}`}
                          className="font-semibold text-polis-navy hover:text-polis-gold"
                        >
                          Editar
                        </Link>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDelete(article.id, article.title)}
                            className="font-semibold text-red-700 hover:underline"
                          >
                            Arquivar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
