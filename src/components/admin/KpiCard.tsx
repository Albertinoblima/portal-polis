interface KpiCardProps {
  label: string;
  value: string | number;
  hint?: string;
}

export function KpiCard({ label, value, hint }: KpiCardProps) {
  return (
    <div className="rounded-sm border border-polis-navy/10 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-polis-gray">{label}</p>
      <p className="mt-2 font-sans text-3xl font-bold text-polis-navy">{value}</p>
      {hint && <p className="mt-1 text-xs text-polis-slate">{hint}</p>}
    </div>
  );
}
