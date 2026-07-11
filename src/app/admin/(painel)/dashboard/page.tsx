"use client";

import { AdminTopbar } from "@/components/admin/Topbar";
import { KpiCard } from "@/components/admin/KpiCard";
import { StatusBadge } from "@/components/ui/Badge";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { getArticlesForAdmin } from "@/lib/supabase/queries";
import { supabase } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";

export default function AdminDashboardPage() {
  const { data: articles, loading: loadingArticles } = useSupabaseQuery(getArticlesForAdmin);
  const { data: subscriberCount } = useSupabaseQuery(async () => {
    const { count, error } = await supabase
      .from("newsletter_subscribers")
      .select("*", { count: "exact", head: true })
      .is("unsubscribed_at", null);
    if (error) throw error;
    return count ?? 0;
  });

  const published = articles?.filter((a) => a.status === "published") ?? [];
  const inReview = articles?.filter((a) => a.status === "in_review") ?? [];
  const totalViews = published.reduce((sum, article) => sum + article.view_count, 0);
  const recent = [...(articles ?? [])]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 6);

  return (
    <>
      <AdminTopbar title="Dashboard" description="Visão geral da operação editorial do Pólis." />

      <div className="p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Publicadas"
            value={loadingArticles ? "…" : published.length}
            hint="Total de matérias publicadas"
          />
          <KpiCard
            label="Em Revisão"
            value={loadingArticles ? "…" : inReview.length}
            hint="Aguardando aprovação editorial"
          />
          <KpiCard
            label="Visualizações"
            value={loadingArticles ? "…" : totalViews.toLocaleString("pt-BR")}
            hint="Acumulado de todas as matérias"
          />
          <KpiCard
            label="Newsletter"
            value={subscriberCount ?? "…"}
            hint="Inscritos ativos"
          />
        </div>

        <section className="mt-8">
          <h2 className="mb-4 font-sans text-lg font-bold text-polis-navy">Atividade Recente</h2>
          <div className="overflow-hidden rounded-sm border border-polis-navy/10 bg-white">
            {loadingArticles ? (
              <p className="px-5 py-4 text-sm text-polis-slate">Carregando...</p>
            ) : recent.length === 0 ? (
              <p className="px-5 py-4 text-sm text-polis-slate">Nenhuma matéria criada ainda.</p>
            ) : (
              <ul className="divide-y divide-polis-navy/10">
                {recent.map((article) => (
                  <li key={article.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                    <span className="truncate font-medium text-polis-navy">{article.title}</span>
                    <span className="flex shrink-0 items-center gap-3 text-polis-gray">
                      <StatusBadge status={article.status} />
                      {formatDate(article.updated_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
