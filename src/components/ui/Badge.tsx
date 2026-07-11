import type { ArticleStatus } from "@/types";
import { cn } from "@/lib/utils";

const statusLabels: Record<ArticleStatus, string> = {
  draft: "Rascunho",
  in_review: "Em Revisão",
  approved: "Aprovado",
  published: "Publicado",
  scheduled: "Agendado",
  archived: "Arquivado",
};

const statusClasses: Record<ArticleStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  in_review: "bg-amber-100 text-amber-800",
  approved: "bg-blue-100 text-blue-800",
  published: "bg-emerald-100 text-emerald-800",
  scheduled: "bg-purple-100 text-purple-800",
  archived: "bg-slate-200 text-slate-500",
};

export function StatusBadge({ status }: { status: ArticleStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        statusClasses[status]
      )}
    >
      {statusLabels[status]}
    </span>
  );
}

export function EditoriaBadge({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="inline-flex items-center rounded-sm px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white"
      style={{ backgroundColor: color }}
    >
      {name}
    </span>
  );
}
