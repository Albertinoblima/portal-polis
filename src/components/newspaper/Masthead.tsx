import { getLatestEdition } from "@/lib/editions";
import { formatDateOnly } from "@/lib/utils";

interface MastheadEdition {
  number: number;
  date: string;
}

interface MastheadProps {
  sectionLabel?: string;
  /** Edição a exibir no timbre. Se omitido, cai para a edição mais recente publicada. */
  edition?: MastheadEdition;
}

export function Masthead({ sectionLabel, edition }: MastheadProps) {
  const resolvedEdition = edition ?? getLatestEdition() ?? undefined;

  const dateLabel = resolvedEdition
    ? formatDateOnly(resolvedEdition.date, { weekday: true })
    : new Date().toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
  const editionLabel = resolvedEdition ? `Edição nº ${resolvedEdition.number}` : "Edição Digital";

  return (
    <header className="shrink-0 border-b-4 border-double border-polis-rule px-6 pb-4 pt-6 text-center">
      <div className="flex items-center justify-between border-b border-polis-rule pb-2 text-[10px] uppercase tracking-[0.25em] text-polis-ink">
        <span>{dateLabel}</span>
        <span>{editionLabel}</span>
      </div>
      <h1 className="mt-4 font-serif text-4xl font-bold tracking-tight text-polis-ink md:text-6xl">
        Portal Pólis
      </h1>
      <p className="mt-1 font-serif text-sm italic text-polis-ink-soft">Onde a política faz sentido</p>
      {sectionLabel && (
        <div className="mt-3 border-t border-polis-rule pt-2 text-xs font-semibold uppercase tracking-[0.3em] text-polis-gold-ink">
          {sectionLabel}
        </div>
      )}
    </header>
  );
}
