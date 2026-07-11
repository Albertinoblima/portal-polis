"use client";

import { AdminTopbar } from "@/components/admin/Topbar";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { getContactMessages, markContactHandled } from "@/lib/supabase/queries";
import { formatDate } from "@/lib/utils";

export default function AdminMensagensPage() {
  const { data: messages, loading, refetch } = useSupabaseQuery(getContactMessages);

  async function handleToggleHandled(id: string, handled: boolean) {
    await markContactHandled(id, !handled);
    refetch();
  }

  return (
    <>
      <AdminTopbar title="Mensagens de Contato" description="Mensagens recebidas pelo formulário de contato." />

      <div className="p-6">
        {loading ? (
          <p className="text-sm text-polis-slate">Carregando...</p>
        ) : (messages ?? []).length === 0 ? (
          <div className="rounded-sm border-2 border-dashed border-polis-navy/20 bg-white p-10 text-center text-sm text-polis-gray">
            Nenhuma mensagem recebida ainda.
          </div>
        ) : (
          <ul className="space-y-4">
            {(messages ?? []).map((message) => (
              <li key={message.id} className="rounded-sm border border-polis-navy/10 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-semibold text-polis-navy">{message.name}</span>{" "}
                    <a href={`mailto:${message.email}`} className="text-xs text-polis-gold hover:underline">
                      {message.email}
                    </a>
                    <span className="ml-2 text-xs text-polis-gray">{formatDate(message.created_at)}</span>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      message.handled_at ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {message.handled_at ? "Respondida" : "Pendente"}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-polis-navy/90">{message.message}</p>
                <button
                  type="button"
                  onClick={() => handleToggleHandled(message.id, Boolean(message.handled_at))}
                  className="mt-3 text-xs font-semibold text-polis-navy hover:text-polis-gold"
                >
                  {message.handled_at ? "Marcar como pendente" : "Marcar como respondida"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
