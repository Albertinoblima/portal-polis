"use client";

import { cn } from "@/lib/utils";
import { cellKey } from "./wordSearchEngine";

interface WordSearchGridProps {
  letters: string[][];
  size: number;
  cellPx: number;
  foundCellKeys: Set<string>;
  dragCellKeys: Set<string>;
  missCellKeys: Set<string>;
  /** Casas da palavra encontrada mais recentemente — ganham uma breve
   *  animação de pulsação (ver `@keyframes ws-cell-pulse` em globals.css)
   *  para celebrar o acerto, além da cor fixa que já indica "encontrada". */
  pulsingCellKeys: Set<string>;
}

/** Só as letras da grade — CSS Grid puro, uma `<div>` por casa. Tipografia
 *  monoespaçada (`font-mono`, JetBrains Mono já configurada no tema) com
 *  `tabular-nums` garante métricas estritas: toda letra ocupa exatamente a
 *  mesma largura, então as linhas do overlay (irmão desta grade, alinhado
 *  por cima) sempre casam pixel a pixel com o centro de cada casa. */
export function WordSearchGrid({ letters, size, cellPx, foundCellKeys, dragCellKeys, missCellKeys, pulsingCellKeys }: WordSearchGridProps) {
  return (
    <div
      className="grid touch-none select-none gap-px bg-polis-ink"
      style={{ gridTemplateColumns: `repeat(${size}, ${cellPx}px)`, gridTemplateRows: `repeat(${size}, ${cellPx}px)` }}
    >
      {letters.map((rowLetters, r) =>
        rowLetters.map((letter, c) => {
          const key = cellKey({ row: r, col: c });
          const isFound = foundCellKeys.has(key);
          const isDragging = dragCellKeys.has(key);
          const isMiss = missCellKeys.has(key);
          const isPulsing = pulsingCellKeys.has(key);
          return (
            <div
              key={key}
              className={cn(
                "flex items-center justify-center bg-polis-paper font-mono font-bold uppercase text-polis-ink-soft transition-colors duration-150 [font-variant-numeric:tabular-nums]",
                (isDragging || isFound) && "text-polis-gold-ink",
                isMiss && "text-red-700",
                isPulsing && "animate-[ws-cell-pulse_0.5s_ease-in-out]"
              )}
              style={{ fontSize: `${Math.max(12, Math.floor(cellPx * 0.46))}px` }}
            >
              {letter}
            </div>
          );
        })
      )}
    </div>
  );
}
