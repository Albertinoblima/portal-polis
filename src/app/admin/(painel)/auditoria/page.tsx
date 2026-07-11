"use client";

import { AdminTopbar } from "@/components/admin/Topbar";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { getAuditLogs } from "@/lib/supabase/queries";
import { formatDate } from "@/lib/utils";

const actionLabels: Record<string, string> = {
  create: "Criou",
  update: "Atualizou",
  delete: "Excluiu",
};

export default function AdminAuditoriaPage() {
  const { data: logs, loading } = useSupabaseQuery(() => getAuditLogs(200));

  return (
    <>
      <AdminTopbar
        title="Auditoria"
        description="Histórico das últimas ações realizadas no painel."
      />

      <div className="p-6">
        {loading ? (
          <p className="text-sm text-polis-slate">Carregando...</p>
        ) : (logs ?? []).length === 0 ? (
          <div className="rounded-sm border-2 border-dashed border-polis-navy/20 bg-white p-10 text-center text-sm text-polis-gray">
            Nenhuma ação registrada ainda.
          </div>
        ) : (
          <div className="overflow-hidden rounded-sm border border-polis-navy/10 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-polis-navy/10 bg-polis-off-white text-xs uppercase tracking-wide text-polis-gray">
                <tr>
                  <th className="px-5 py-3">Quando</th>
                  <th className="px-5 py-3">Usuário</th>
                  <th className="px-5 py-3">Ação</th>
                  <th className="px-5 py-3">Entidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-polis-navy/10">
                {(logs ?? []).map((log) => (
                  <tr key={log.id}>
                    <td className="px-5 py-3 whitespace-nowrap text-polis-slate">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-5 py-3 font-medium text-polis-navy">
                      {log.user?.name ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-polis-slate">
                      {actionLabels[log.action] ?? log.action}
                    </td>
                    <td className="px-5 py-3 text-polis-slate">
                      {log.entity} <span className="text-xs text-polis-gray">#{log.entity_id.slice(0, 8)}</span>
                    </td>
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
