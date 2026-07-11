"use client";

import { AdminTopbar } from "@/components/admin/Topbar";
import { Button } from "@/components/ui/Button";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { getNewsletterSubscribers } from "@/lib/supabase/queries";
import { formatDate } from "@/lib/utils";

function exportCsv(rows: { email: string; name: string | null; created_at: string }[]) {
  const header = "email,nome,inscrito_em";
  const lines = rows.map(
    (row) => `${row.email},${row.name ?? ""},${new Date(row.created_at).toISOString()}`
  );
  const csv = [header, ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `newsletter-assinantes-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AdminNewsletterPage() {
  const { data: subscribers, loading } = useSupabaseQuery(getNewsletterSubscribers);
  const active = (subscribers ?? []).filter((s) => !s.unsubscribed_at);

  return (
    <>
      <AdminTopbar
        title="Newsletter"
        description="Assinantes cadastrados através do formulário público."
      />

      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-polis-slate">
            {active.length} assinante{active.length === 1 ? "" : "s"} ativo
            {active.length === 1 ? "" : "s"}
          </p>
          <Button
            type="button"
            variant="secondary"
            disabled={active.length === 0}
            onClick={() => exportCsv(active)}
          >
            Exportar CSV
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-polis-slate">Carregando...</p>
        ) : active.length === 0 ? (
          <div className="rounded-sm border-2 border-dashed border-polis-navy/20 bg-white p-10 text-center text-sm text-polis-gray">
            Nenhum assinante ainda.
          </div>
        ) : (
          <div className="overflow-hidden rounded-sm border border-polis-navy/10 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-polis-navy/10 bg-polis-off-white text-xs uppercase tracking-wide text-polis-gray">
                <tr>
                  <th className="px-5 py-3">E-mail</th>
                  <th className="px-5 py-3">Inscrito em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-polis-navy/10">
                {active.map((subscriber) => (
                  <tr key={subscriber.id}>
                    <td className="px-5 py-3 font-medium text-polis-navy">{subscriber.email}</td>
                    <td className="px-5 py-3 text-polis-slate">{formatDate(subscriber.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
