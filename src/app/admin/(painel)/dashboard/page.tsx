import type { Metadata } from "next";
import { AdminTopbar } from "@/components/admin/Topbar";
import { KpiCard } from "@/components/admin/KpiCard";
import { getPublishedArticles } from "@/lib/content";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function AdminDashboardPage() {
  const articles = getPublishedArticles();
  const totalViews = articles.reduce((sum, article) => sum + article.viewCount, 0);

  return (
    <>
      <AdminTopbar title="Dashboard" description="Visão geral da operação editorial do Pólis." />

      <div className="p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Publicadas" value={articles.length} hint="Total de matérias publicadas" />
          <KpiCard label="Em Revisão" value={0} hint="Aguardando aprovação editorial" />
          <KpiCard label="Visualizações" value={totalViews.toLocaleString("pt-BR")} hint="Acumulado de todas as matérias" />
          <KpiCard label="Newsletter" value={0} hint="Inscritos ativos" />
        </div>

        <section className="mt-8">
          <h2 className="mb-4 font-sans text-lg font-bold text-polis-navy">Atividade Recente</h2>
          <div className="overflow-hidden rounded-sm border border-polis-navy/10 bg-white">
            <ul className="divide-y divide-polis-navy/10">
              {articles.slice(0, 5).map((article) => (
                <li key={article.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="font-medium text-polis-navy">{article.title}</span>
                  <span className="text-polis-gray">publicado</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </>
  );
}
