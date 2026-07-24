"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { buildWordSearchGrid, type WordSearchCell, type WordSearchPuzzle } from "@/lib/wordsearch";
import { cn, formatTime } from "@/lib/utils";
import { cellKey as coordsKey } from "@/lib/grid";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import { emitGameInteractionLock } from "./gameInteraction";

interface Progress {
  foundWords: Set<string>;
  elapsedSeconds: number;
}

interface StoredProgress {
  foundWords: string[];
  elapsedSeconds: number;
}

function cellKey(cell: WordSearchCell): string {
  return coordsKey(cell.row, cell.col);
}

function cellSetKey(cells: WordSearchCell[]): string {
  return cells
    .map(cellKey)
    .sort()
    .join(",");
}

/** Se start->end forma uma linha reta em uma das 8 direções (incluindo o
 *  caso degenerado de uma única casa), retorna as casas intermediárias —
 *  caso contrário, `null` (seleção inválida, ex.: um "L"). */
function lineCells(start: WordSearchCell, end: WordSearchCell): WordSearchCell[] | null {
  const dRow = end.row - start.row;
  const dCol = end.col - start.col;
  if (dRow === 0 && dCol === 0) return [start];
  if (dRow !== 0 && dCol !== 0 && Math.abs(dRow) !== Math.abs(dCol)) return null;

  const steps = Math.max(Math.abs(dRow), Math.abs(dCol));
  const stepRow = Math.sign(dRow);
  const stepCol = Math.sign(dCol);
  const cells: WordSearchCell[] = [];
  for (let i = 0; i <= steps; i++) {
    cells.push({ row: start.row + stepRow * i, col: start.col + stepCol * i });
  }
  return cells;
}

function progressKey(slug: string): string {
  return `polis:wordsearch:${slug}`;
}

function segmentFor(cells: WordSearchCell[]) {
  const start = cells[0];
  const end = cells[cells.length - 1];
  return { x1: start.col + 0.5, y1: start.row + 0.5, x2: end.col + 0.5, y2: end.row + 0.5 };
}

function cellFromPoint(clientX: number, clientY: number): WordSearchCell | null {
  const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
  const target = el?.closest<HTMLElement>("[data-row]");
  if (!target) return null;
  const row = Number(target.dataset.row);
  const col = Number(target.dataset.col);
  if (Number.isNaN(row) || Number.isNaN(col)) return null;
  return { row, col };
}

interface WordSearchProps {
  puzzle: WordSearchPuzzle;
  layout?: "full" | "embedded";
}

export function WordSearch({ puzzle, layout = "full" }: WordSearchProps) {
  const grid = useMemo(() => buildWordSearchGrid(puzzle), [puzzle]);
  const isEmbedded = layout === "embedded";
  const [isCompactLandscape, setIsCompactLandscape] = useState(false);

  const placementByKey = useMemo(() => {
    const map = new Map<string, (typeof grid.placements)[number]>();
    for (const placement of grid.placements) map.set(cellSetKey(placement.cells), placement);
    return map;
  }, [grid]);

  const placementByWord = useMemo(() => {
    const map = new Map<string, (typeof grid.placements)[number]>();
    for (const placement of grid.placements) map.set(placement.word, placement);
    return map;
  }, [grid]);

  const [progress, setProgress] = useLocalStorageState<Progress>(
    progressKey(puzzle.slug),
    { foundWords: new Set(), elapsedSeconds: 0 },
    {
      serialize: (value) =>
        JSON.stringify({ foundWords: [...value.foundWords], elapsedSeconds: value.elapsedSeconds }),
      deserialize: (raw) => {
        const parsed = JSON.parse(raw) as Partial<StoredProgress>;
        return {
          foundWords: new Set(Array.isArray(parsed.foundWords) ? parsed.foundWords : []),
          elapsedSeconds: typeof parsed.elapsedSeconds === "number" ? parsed.elapsedSeconds : 0,
        };
      },
    }
  );
  const { foundWords, elapsedSeconds } = progress;

  const [dragStart, setDragStart] = useState<WordSearchCell | null>(null);
  const [dragCurrent, setDragCurrent] = useState<WordSearchCell | null>(null);
  const [missCells, setMissCells] = useState<WordSearchCell[] | null>(null);
  const [lastFound, setLastFound] = useState<string | null>(null);
  const boardWrapperRef = useRef<HTMLDivElement>(null);
  const [boardWidth, setBoardWidth] = useState(0);

  const pointerActiveRef = useRef(false);

  const completed = foundWords.size === puzzle.words.length;

  useEffect(() => {
    if (completed) return;
    const interval = window.setInterval(() => {
      setProgress((prev) => ({ ...prev, elapsedSeconds: prev.elapsedSeconds + 1 }));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [completed, setProgress]);

  useEffect(() => {
    if (!missCells) return;
    const timer = window.setTimeout(() => setMissCells(null), 450);
    return () => window.clearTimeout(timer);
  }, [missCells]);

  useEffect(() => {
    const node = boardWrapperRef.current;
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      setBoardWidth(width);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => emitGameInteractionLock(false, "wordsearch");
  }, []);

  useEffect(() => {
    if (!isEmbedded || typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(orientation: landscape) and (max-height: 560px)");
    const handleChange = () => setIsCompactLandscape(mediaQuery.matches);
    handleChange();

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [isEmbedded]);

  const compactLandscape = isEmbedded && isCompactLandscape;

  function tryFinalize(start: WordSearchCell, end: WordSearchCell) {
    const cells = lineCells(start, end);
    if (!cells || cells.length < 2) return;

    const match = placementByKey.get(cellSetKey(cells));
    if (match && !foundWords.has(match.word)) {
      const nextFound = new Set(foundWords);
      nextFound.add(match.word);
      setProgress({ foundWords: nextFound, elapsedSeconds });
      setLastFound(match.word);
    } else if (!match) {
      setMissCells(cells);
    }
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const cell = cellFromPoint(event.clientX, event.clientY);
    if (!cell) return;
    emitGameInteractionLock(true, "wordsearch");
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);

    if (dragStart && !pointerActiveRef.current) {
      // Segunda ponta de uma seleção "toque, toque" (alternativa ao arrasto).
      if (cell.row !== dragStart.row || cell.col !== dragStart.col) {
        tryFinalize(dragStart, cell);
      }
      setDragStart(null);
      setDragCurrent(null);
      return;
    }

    pointerActiveRef.current = true;
    setDragStart(cell);
    setDragCurrent(cell);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!pointerActiveRef.current) return;
    event.stopPropagation();

    if (!pointerActiveRef.current || !dragStart) return;
    const cell = cellFromPoint(event.clientX, event.clientY);
    if (!cell) return;
    if (lineCells(dragStart, cell)) setDragCurrent(cell);
  }

  function handlePointerUp() {
    emitGameInteractionLock(false, "wordsearch");

    if (!pointerActiveRef.current) return;
    pointerActiveRef.current = false;

    const moved = dragStart && dragCurrent && (dragCurrent.row !== dragStart.row || dragCurrent.col !== dragStart.col);
    if (dragStart && moved) {
      tryFinalize(dragStart, dragCurrent as WordSearchCell);
      setDragStart(null);
      setDragCurrent(null);
    }
    // Sem arrasto: foi um toque simples — dragStart continua pendente,
    // aguardando a segunda ponta da palavra.
  }

  function handleReveal() {
    setProgress({ foundWords: new Set(puzzle.words), elapsedSeconds });
  }

  const dragCells = useMemo(
    () => (dragStart ? lineCells(dragStart, dragCurrent ?? dragStart) ?? [dragStart] : []),
    [dragStart, dragCurrent]
  );
  const dragCellKeys = useMemo(() => new Set(dragCells.map(cellKey)), [dragCells]);
  const missCellKeys = useMemo(() => new Set((missCells ?? []).map(cellKey)), [missCells]);
  const boardMaxPx = useMemo(() => {
    const preferredCell = isEmbedded ? (compactLandscape ? 27 : 32) : 38;
    const hardCap = isEmbedded ? (compactLandscape ? 420 : 500) : 620;
    return Math.min(grid.size * preferredCell, hardCap);
  }, [compactLandscape, grid.size, isEmbedded]);
  const activeBoardPx = boardWidth > 0 ? Math.min(boardWidth, boardMaxPx) : boardMaxPx;
  const cellPx = Math.max(26, Math.floor(activeBoardPx / grid.size));
  const foundCellKeys = useMemo(() => {
    const set = new Set<string>();
    for (const word of foundWords) {
      const placement = placementByWord.get(word);
      if (!placement) continue;
      for (const cell of placement.cells) set.add(cellKey(cell));
    }
    return set;
  }, [foundWords, placementByWord]);

  return (
    <div
      className={cn(
        "mx-auto flex w-full flex-col gap-6",
        compactLandscape && "max-w-none flex-row items-start gap-3",
        isEmbedded && !compactLandscape && "max-w-3xl",
        !isEmbedded && "max-w-4xl lg:flex-row lg:items-start lg:justify-center"
      )}
    >
      <div className={cn("flex flex-col items-center gap-3", compactLandscape && "min-w-0 flex-1 gap-2")}>
        <div
          className={cn(
            "flex items-center gap-4 text-sm text-polis-ink-soft",
            compactLandscape && "gap-2 text-[11px] tracking-[0.12em]",
            isEmbedded &&
            "w-full justify-center border-y border-polis-rule/20 bg-polis-paper-soft/30 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em]"
          )}
        >
          <span>
            Tempo: <strong className="text-polis-ink">{formatTime(elapsedSeconds)}</strong>
          </span>
          <span>
            Palavras: <strong className="text-polis-ink">{foundWords.size}/{puzzle.words.length}</strong>
          </span>
          {completed && (
            <span className="font-semibold uppercase tracking-wide text-polis-gold-ink">Decifrado!</span>
          )}
        </div>

        <div ref={boardWrapperRef} className="w-full">
          <div
            className="mx-auto border-2 border-polis-ink bg-polis-ink p-px"
            style={{ width: `min(100%, ${boardMaxPx}px)` }}
          >
            <div
              className="relative touch-none select-none gap-px bg-polis-ink"
              style={{ display: "grid", gridTemplateColumns: `repeat(${grid.size}, minmax(0, 1fr))` }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onPointerLeave={handlePointerUp}
              role="img"
              aria-label={`Grade de ${grid.size} por ${grid.size} letras. ${foundWords.size} de ${puzzle.words.length} palavras encontradas. Use o mouse ou o toque para arrastar sobre uma palavra.`}
            >
              {grid.letters.map((rowLetters, r) =>
                rowLetters.map((letter, c) => {
                  const key = cellKey({ row: r, col: c });
                  const isFound = foundCellKeys.has(key);
                  const isDragging = dragCellKeys.has(key);
                  const isMiss = missCellKeys.has(key);
                  return (
                    <div
                      key={key}
                      data-row={r}
                      data-col={c}
                      className={cn(
                        "flex aspect-square w-full items-center justify-center bg-polis-paper font-serif font-bold uppercase text-polis-ink-soft transition-colors duration-150",
                        (isDragging || isFound) && "text-polis-gold-ink",
                        isMiss && "text-red-700"
                      )}
                      style={{ fontSize: `${Math.max(13, Math.floor(cellPx * 0.45))}px` }}
                    >
                      {letter}
                    </div>
                  );
                })
              )}

              <svg
                viewBox={`0 0 ${grid.size} ${grid.size}`}
                preserveAspectRatio="none"
                className="pointer-events-none absolute inset-0 h-full w-full"
              >
                {[...foundWords].map((word) => {
                  const placement = placementByWord.get(word);
                  if (!placement || placement.cells.length < 2) return null;
                  const seg = segmentFor(placement.cells);
                  return (
                    <line
                      key={word}
                      x1={seg.x1}
                      y1={seg.y1}
                      x2={seg.x2}
                      y2={seg.y2}
                      stroke="#c9a227"
                      strokeWidth={0.45}
                      strokeLinecap="round"
                      opacity={0.5}
                    />
                  );
                })}
                {dragCells.length >= 2 &&
                  (() => {
                    const seg = segmentFor(dragCells);
                    return (
                      <line
                        x1={seg.x1}
                        y1={seg.y1}
                        x2={seg.x2}
                        y2={seg.y2}
                        stroke="#c9a227"
                        strokeWidth={0.55}
                        strokeLinecap="round"
                        opacity={0.85}
                      />
                    );
                  })()}
                {missCells && missCells.length >= 2 && (
                  <line
                    {...segmentFor(missCells)}
                    stroke="#b91c1c"
                    strokeWidth={0.5}
                    strokeLinecap="round"
                    opacity={0.75}
                  />
                )}
              </svg>
            </div>
          </div>
        </div>

        <p aria-live="polite" className="sr-only">
          {lastFound ? `Palavra encontrada: ${lastFound}.` : ""}
        </p>

        <p
          className={cn(
            "text-center text-xs text-polis-ink-soft",
            compactLandscape && "max-w-none text-[11px] leading-snug",
            isEmbedded ? "max-w-xl leading-relaxed" : "max-w-xs"
          )}
        >
          {compactLandscape
            ? "Arraste ou toque nas duas pontas da palavra para marcar."
            : "Arraste (ou toque em uma casa e depois na outra ponta) sobre as letras para marcar uma palavra — nas 8 direções, inclusive de trás para frente."}
        </p>

        <button
          type="button"
          onClick={handleReveal}
          className={cn(
            "text-xs uppercase tracking-wide text-polis-ink-soft underline hover:text-polis-gold-ink",
            compactLandscape && "py-0.5 text-[11px]",
            isEmbedded &&
            "border border-polis-rule/25 px-3 py-1 no-underline transition-colors hover:border-polis-gold-muted"
          )}
        >
          Revelar todas
        </button>
      </div>

      <div
        className={cn(
          "w-full flex-1",
          compactLandscape &&
          "max-h-[17rem] max-w-[44%] overflow-y-auto border-l border-polis-rule/20 pl-3 pr-1",
          isEmbedded && !compactLandscape && "max-w-3xl border-t border-polis-rule/20 pt-4",
          !isEmbedded && "max-w-sm"
        )}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-serif text-lg font-bold text-polis-ink">Palavras do dia</h2>
          {isEmbedded && (
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-polis-ink-soft">
              Grade {grid.size}x{grid.size}
            </span>
          )}
        </div>
        <div
          className={cn(
            "grid gap-2 text-sm",
            compactLandscape && "gap-1.5 text-[12px]",
            isEmbedded ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 gap-x-4 gap-y-2"
          )}
        >
          {puzzle.words.map((word) => {
            const found = foundWords.has(word);
            return (
              <span
                key={word}
                className={cn(
                  "flex items-center gap-2",
                  compactLandscape && "min-h-7 px-2 py-0.5 text-[11px] tracking-[0.06em]",
                  isEmbedded &&
                  "min-h-9 border border-polis-rule/15 bg-polis-paper-soft/25 px-2.5 py-1 text-[12px] tracking-[0.08em]",
                  found ? "text-polis-gold-ink" : "text-polis-ink-soft"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-2.5 w-2.5 shrink-0 border",
                    found ? "border-polis-gold-ink bg-polis-gold-ink" : "border-polis-ink/30"
                  )}
                />
                <span className={cn(found && "line-through decoration-2")}>{word}</span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
