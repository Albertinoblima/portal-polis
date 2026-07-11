"use client";

import { useState } from "react";
import { AdminTopbar } from "@/components/admin/Topbar";
import { useAdminSession } from "@/components/admin/AuthProvider";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { deleteComment, getComments, updateCommentStatus } from "@/lib/supabase/queries";
import { logAction } from "@/lib/supabase/audit";
import { formatDate } from "@/lib/utils";
import type { CommentStatus } from "@/types/database";

const statusLabels: Record<CommentStatus, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
};

const statusClasses: Record<CommentStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-slate-100 text-slate-600",
};

export default function AdminComentariosPage() {
  const { profile } = useAdminSession();
  const { data: comments, loading, refetch } = useSupabaseQuery(getComments);
  const [filter, setFilter] = useState<CommentStatus | "all">("pending");

  async function handleModerate(id: string, status: CommentStatus) {
    await updateCommentStatus(id, status);
    await logAction({
      userId: profile.id,
      action: "update",
      entity: "comment",
      entityId: id,
      newValue: { status },
    });
    refetch();
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este comentário definitivamente?")) return;
    await deleteComment(id);
    await logAction({ userId: profile.id, action: "delete", entity: "comment", entityId: id });
    refetch();
  }

  const filtered = (comments ?? []).filter((c) => filter === "all" || c.status === filter);

  return (
    <>
      <AdminTopbar title="Comentários" description="Modere os comentários enviados pelos leitores." />

      <div className="p-6">
        <div className="mb-4 flex gap-2">
          {(["pending", "approved", "rejected", "all"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                filter === value
                  ? "bg-polis-navy text-white"
                  : "border border-polis-navy/20 text-polis-slate hover:border-polis-navy"
              }`}
            >
              {value === "all" ? "Todos" : statusLabels[value]}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-polis-slate">Carregando...</p>
        ) : filtered.length === 0 ? (
          <div className="rounded-sm border-2 border-dashed border-polis-navy/20 bg-white p-10 text-center text-sm text-polis-gray">
            Nenhum comentário nesse filtro.
          </div>
        ) : (
          <ul className="space-y-4">
            {filtered.map((comment) => (
              <li key={comment.id} className="rounded-sm border border-polis-navy/10 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-semibold text-polis-navy">{comment.author_name}</span>{" "}
                    <span className="text-xs text-polis-gray">
                      em {comment.article?.title ?? "matéria removida"} · {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClasses[comment.status]}`}
                  >
                    {statusLabels[comment.status]}
                  </span>
                </div>
                <p className="mt-2 text-sm text-polis-navy/90">{comment.content}</p>
                <div className="mt-3 flex gap-3 text-xs font-semibold">
                  {comment.status !== "approved" && (
                    <button
                      type="button"
                      onClick={() => handleModerate(comment.id, "approved")}
                      className="text-emerald-700 hover:underline"
                    >
                      Aprovar
                    </button>
                  )}
                  {comment.status !== "rejected" && (
                    <button
                      type="button"
                      onClick={() => handleModerate(comment.id, "rejected")}
                      className="text-amber-700 hover:underline"
                    >
                      Rejeitar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(comment.id)}
                    className="text-red-700 hover:underline"
                  >
                    Excluir
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
