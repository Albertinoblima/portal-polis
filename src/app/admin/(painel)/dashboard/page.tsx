"use client";

import { AdminTopbar } from "@/components/admin/Topbar";
import { BarChart } from "@/components/admin/BarChart";
import { KpiCard } from "@/components/admin/KpiCard";
import { StatusBadge } from "@/components/ui/Badge";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { getArticlesForAdmin, getEditorias } from "@/lib/supabase/queries";
import { supabase } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import { getAnalyticsSnapshot } from "@/lib/analytics";

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.round(seconds % 60);
  return `${minutes}m ${remaining}s`;
}

export default function AdminDashboardPage() {
  const analytics = getAnalyticsSnapshot();
  const { data: articles, loading: loadingArticles } = useSupabaseQuery(getArticlesForAdmin);
  const { data: editorias } = useSupabaseQuery(getEditorias);
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

  const porEditoria = (editorias ?? [])
    .map((editoria) => ({
      label: editoria.name,
      color: editoria.color,
      value: published.filter((a) => a.editoria_id === editoria.id).length,
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);

  const maisLidas = [...published]
    .sort((a, b) => b.view_count - a.view_count)
    .slice(0, 5)
    .map((a) => ({ label: a.title, value: a.view_count }));

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

        <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section className="rounded-sm border border-polis-navy/10 bg-white p-5">
            <h2 className="mb-4 font-sans text-sm font-bold text-polis-navy">Matérias por Editoria</h2>
            {porEditoria.length === 0 ? (
              <p className="text-sm text-polis-slate">Sem matérias publicadas ainda.</p>
            ) : (
              <BarChart items={porEditoria} />
            )}
          </section>
          <section className="rounded-sm border border-polis-navy/10 bg-white p-5">
            <h2 className="mb-4 font-sans text-sm font-bold text-polis-navy">Mais Lidas</h2>
            {maisLidas.length === 0 ? (
              <p className="text-sm text-polis-slate">Sem visualizações registradas ainda.</p>
            ) : (
              <BarChart items={maisLidas} />
            )}
          </section>
        </div>

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="font-sans text-lg font-bold text-polis-navy">Google Analytics</h2>
            {analytics.available && (
              <span className="text-xs text-polis-slate">
                Últimos {analytics.periodDays} dias · atualizado em{" "}
                {analytics.generatedAt && formatDate(analytics.generatedAt)}
              </span>
            )}
          </div>
          {!analytics.available ? (
            <div className="rounded-sm border border-polis-navy/10 bg-white p-5">
              <p className="text-sm text-polis-slate">
                Analytics ainda não configurado. Defina GA_PROPERTY_ID e GA_SERVICE_ACCOUNT_KEY nos
                secrets do repositório para começar a receber dados aqui.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                  label="Usuários"
                  value={analytics.totals.activeUsers.toLocaleString("pt-BR")}
                  hint="Usuários ativos no período"
                />
                <KpiCard
                  label="Sessões"
                  value={analytics.totals.sessions.toLocaleString("pt-BR")}
                  hint="Sessões no período"
                />
                <KpiCard
                  label="Pageviews"
                  value={analytics.totals.screenPageViews.toLocaleString("pt-BR")}
                  hint="Visualizações de página"
                />
                <KpiCard
                  label="Duração Média"
                  value={formatDuration(analytics.totals.averageSessionDuration)}
                  hint={`Taxa de rejeição: ${(analytics.totals.bounceRate * 100).toFixed(1)}%`}
                />
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <section className="rounded-sm border border-polis-navy/10 bg-white p-5">
                  <h3 className="mb-4 font-sans text-sm font-bold text-polis-navy">Páginas Mais Visitadas</h3>
                  {analytics.topPages.length === 0 ? (
                    <p className="text-sm text-polis-slate">Sem dados no período.</p>
                  ) : (
                    <BarChart
                      items={analytics.topPages.map((p) => ({ label: p.path, value: p.views }))}
                    />
                  )}
                </section>
                <section className="rounded-sm border border-polis-navy/10 bg-white p-5">
                  <h3 className="mb-4 font-sans text-sm font-bold text-polis-navy">Canais de Aquisição</h3>
                  {analytics.channels.length === 0 ? (
                    <p className="text-sm text-polis-slate">Sem dados no período.</p>
                  ) : (
                    <BarChart
                      items={analytics.channels.map((c) => ({ label: c.channel, value: c.sessions }))}
                    />
                  )}
                </section>
              </div>
            </>
          )}
        </section>

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
