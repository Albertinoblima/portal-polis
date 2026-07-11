interface BarChartItem {
  label: string;
  value: number;
  color?: string;
}

export function BarChart({ items }: { items: BarChartItem[] }) {
  const max = Math.max(1, ...items.map((item) => item.value));

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex items-center justify-between gap-4 text-xs text-polis-slate">
            <span className="truncate font-medium text-polis-navy">{item.label}</span>
            <span className="shrink-0">{item.value.toLocaleString("pt-BR")}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-polis-navy/5">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(item.value / max) * 100}%`, backgroundColor: item.color ?? "#C9A227" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
