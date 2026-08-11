"use client";

import { useEffect, useRef } from "react";
import type { CrosswordEntry } from "@/lib/crosswords";
import { cn } from "@/lib/utils";

interface CrosswordCluesProps {
  acrossEntries: CrosswordEntry[];
  downEntries: CrosswordEntry[];
  activeEntry: CrosswordEntry | undefined;
  onSelectEntry: (entry: CrosswordEntry) => void;
  /** 1 numa coluna estreita (sidebar do desktop), 2 lado a lado (diálogo
   *  "Todas as dicas" do mobile, mais largo). */
  columns?: 1 | 2;
  className?: string;
}

function entryKey(entry: CrosswordEntry): string {
  return `${entry.direction}-${entry.number}`;
}

/** Lista de dicas (Horizontais/Verticais). Usada tanto no painel fixo do
 *  desktop (com rolagem própria) quanto dentro do diálogo "Todas as dicas"
 *  do mobile — o próprio contêiner scrollável é responsabilidade de quem
 *  chama (`className` recebe o `overflow-y-auto`/altura), este componente
 *  só cuida do conteúdo e da sincronização visual: sempre que `activeEntry`
 *  muda (por clique, teclado ou navegação pela barra de dica ativa), o item
 *  correspondente rola para dentro da área visível automaticamente. */
export function CrosswordClues({ acrossEntries, downEntries, activeEntry, onSelectEntry, columns = 2, className }: CrosswordCluesProps) {
  const itemRefs = useRef(new Map<string, HTMLButtonElement>());

  useEffect(() => {
    if (!activeEntry) return;
    itemRefs.current.get(entryKey(activeEntry))?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeEntry]);

  function renderList(entries: CrosswordEntry[], title: string) {
    return (
      <div>
        <h2 className="mb-2 font-serif text-base font-bold text-polis-ink">{title}</h2>
        <ul className="space-y-1">
          {entries.map((entry) => {
            const active = activeEntry?.number === entry.number && activeEntry?.direction === entry.direction;
            return (
              <li key={entryKey(entry)}>
                <button
                  ref={(el) => {
                    if (el) itemRefs.current.set(entryKey(entry), el);
                    else itemRefs.current.delete(entryKey(entry));
                  }}
                  type="button"
                  onClick={() => onSelectEntry(entry)}
                  aria-current={active}
                  className={cn(
                    "w-full border-l-2 py-1 pl-2.5 pr-1 text-left text-[13px] leading-relaxed transition-colors",
                    active
                      ? "border-polis-gold-muted bg-polis-gold/10 text-polis-ink"
                      : "border-transparent text-polis-ink-soft hover:border-polis-rule/30 hover:text-polis-gold-ink"
                  )}
                >
                  <strong className={active ? "text-polis-gold-ink" : "text-polis-ink"}>{entry.number}.</strong>{" "}
                  {entry.clue}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 gap-5", columns === 2 && "sm:grid-cols-2", className)}>
      {renderList(acrossEntries, "Horizontais")}
      {renderList(downEntries, "Verticais")}
    </div>
  );
}
