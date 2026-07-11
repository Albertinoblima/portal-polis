import type { Metadata } from "next";
import Link from "next/link";
import { AdminTopbar } from "@/components/admin/Topbar";
import { StatusBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { getAuthors, getEditoriaById, getPublishedArticles } from "@/lib/content";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Matérias",
};

export default function AdminMateriasPage() {
  const articles = getPublishedArticles();
  const authors = getAuthors();

  return (
    <>
      <AdminTopbar title="Matérias" description="Gerencie o conteúdo publicado no portal." />

      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <input
            type="search"
            placeholder="Buscar matérias..."
            className="w-full max-w-sm rounded-sm border border-polis-navy/20 px-4 py-2 text-sm focus:border-polis-gold focus:outline-none"
          />
          <ButtonLink href="/admin/materias/nova">+ Nova Matéria</ButtonLink>
        </div>

        <div className="overflow-x-auto rounded-sm border border-polis-navy/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-polis-navy/10 bg-polis-off-white text-xs uppercase tracking-wide text-polis-gray">
              <tr>
                <th className="px-5 py-3">Título</th>
                <th className="px-5 py-3">Editoria</th>
                <th className="px-5 py-3">Autor</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Data</th>
                <th className="px-5 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-polis-navy/10">
              {articles.map((article) => {
                const editoria = getEditoriaById(article.editoriaId);
                const author = authors.find((a) => a.id === article.authorId);
                return (
                  <tr key={article.id}>
                    <td className="max-w-xs truncate px-5 py-3 font-medium text-polis-navy">
                      {article.title}
                    </td>
                    <td className="px-5 py-3 text-polis-slate">{editoria?.name}</td>
                    <td className="px-5 py-3 text-polis-slate">{author?.name}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={article.status} />
                    </td>
                    <td className="px-5 py-3 text-polis-slate">{formatDate(article.publishedAt)}</td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/materias/${article.id}/editar`}
                        className="font-semibold text-polis-navy hover:text-polis-gold"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
