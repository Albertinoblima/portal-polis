interface AdminTopbarProps {
  title: string;
  description?: string;
}

export function AdminTopbar({ title, description }: AdminTopbarProps) {
  return (
    <div className="flex flex-col gap-1 border-b border-polis-navy/10 bg-white px-6 py-5">
      <h1 className="font-sans text-2xl font-bold text-polis-navy">{title}</h1>
      {description && <p className="text-sm text-polis-slate">{description}</p>}
    </div>
  );
}
