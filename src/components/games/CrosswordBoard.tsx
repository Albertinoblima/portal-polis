"use client";

import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import type { CrosswordCell } from "@/lib/crosswords";
import { cn } from "@/lib/utils";
import { cellKey } from "@/lib/grid";
import type { Position } from "./crosswordEngine";

interface CrosswordBoardProps {
  cells: CrosswordCell[][];
  answers: string[][];
  selected: Position | null;
  checkResults: boolean[][] | null;
  /** Conjunto (via `cellKey`) de casas que pertencem à palavra atualmente
   *  selecionada — usado só pra destacar, não pra lógica de navegação. */
  highlighted: Set<string>;
  cellPx: number;
  boardWidthPx: number;
  boardHeightPx: number;
  onSelectCell: (row: number, col: number) => void;
  onChangeLetter: (row: number, col: number, value: string) => void;
  onCellKeyDown: (row: number, col: number, event: KeyboardEvent<HTMLInputElement>) => void;
  registerInputRef: (row: number, col: number, el: HTMLInputElement | null) => void;
  onPointerDownCapture?: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerEndCapture?: () => void;
}

/** Grade do tabuleiro em CSS Grid puro — uma casa bloqueada é só um `<div>`
 *  com fundo escurecido (sem borda branca interna: as divisórias nascem do
 *  `gap` entre casas, que deixa a cor de fundo do CONTÊINER aparecer, não de
 *  bordas desenhadas em cada célula). Cada casa de letra é um `<input>` de
 *  verdade (não uma tabela nem um único campo escondido) — mantém o teclado
 *  nativo do sistema operacional funcionando de graça em qualquer
 *  dispositivo, inclusive mobile. */
export function CrosswordBoard({
  cells,
  answers,
  selected,
  checkResults,
  highlighted,
  cellPx,
  boardWidthPx,
  boardHeightPx,
  onSelectCell,
  onChangeLetter,
  onCellKeyDown,
  registerInputRef,
  onPointerDownCapture,
  onPointerEndCapture,
}: CrosswordBoardProps) {
  const cols = cells[0]?.length ?? 0;

  return (
    <div
      className="grid shrink-0 gap-[2px] border-2 border-polis-ink bg-polis-ink transition-opacity"
      style={{
        gridTemplateColumns: `repeat(${cols}, ${cellPx}px)`,
        width: boardWidthPx || undefined,
        height: boardHeightPx || undefined,
        opacity: boardWidthPx ? 1 : 0,
      }}
      onPointerDownCapture={onPointerDownCapture}
      onPointerUpCapture={onPointerEndCapture}
      onPointerCancelCapture={onPointerEndCapture}
      onPointerOutCapture={onPointerEndCapture}
    >
      {cells.map((rowCells, r) =>
        rowCells.map((cell, c) => {
          if (!cell.letter) {
            return <div key={cellKey(r, c)} className="bg-polis-ink" />;
          }

          const isSelected = selected?.row === r && selected?.col === c;
          const isHighlighted = highlighted.has(cellKey(r, c));
          const result = checkResults?.[r]?.[c];

          return (
            <div key={cellKey(r, c)} className="relative bg-polis-paper">
              {cell.number && (
                <span
                  className="pointer-events-none absolute left-0.5 top-0 select-none font-semibold leading-none text-polis-ink-soft"
                  style={{ fontSize: `${Math.max(8, Math.floor(cellPx * 0.2))}px` }}
                >
                  {cell.number}
                </span>
              )}
              <input
                ref={(el) => registerInputRef(r, c, el)}
                value={answers[r]?.[c] ?? ""}
                maxLength={1}
                inputMode="text"
                autoComplete="off"
                aria-label={`Casa ${cell.number ?? ""} linha ${r + 1} coluna ${c + 1}`}
                onFocus={(event) => event.target.select()}
                onClick={() => onSelectCell(r, c)}
                onChange={(event) => onChangeLetter(r, c, event.target.value)}
                onKeyDown={(event) => onCellKeyDown(r, c, event)}
                className={cn(
                  "h-full w-full bg-transparent text-center font-serif font-bold uppercase text-polis-ink outline-none",
                  isSelected && "bg-polis-gold/30",
                  !isSelected && isHighlighted && "bg-polis-gold/10",
                  result === true && "text-polis-gold-ink",
                  result === false && "text-red-700"
                )}
                style={{ fontSize: `${Math.max(14, Math.floor(cellPx * 0.52))}px` }}
              />
            </div>
          );
        })
      )}
    </div>
  );
}
