import type { ReactNode } from "react";

interface AdminTopbarProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function AdminTopbar({ title, description, actions }: AdminTopbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-polis-navy/10 bg-white px-6 py-5">
      <div className="flex flex-col gap-1">
        <h1 className="font-sans text-2xl font-bold text-polis-navy">{title}</h1>
        {description && <p className="text-sm text-polis-slate">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
