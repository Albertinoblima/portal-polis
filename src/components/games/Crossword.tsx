"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { buildCrosswordGrid, type CrosswordEntry, type CrosswordPuzzle } from "@/lib/crosswords";
import { cn, formatTime } from "@/lib/utils";
import { cellKey } from "@/lib/grid";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import { emitGameInteractionLock } from "./gameInteraction";

type Direction = "across" | "down";

interface Position {
  row: number;
  col: number;
}

interface StoredProgress {
  answers: string[][];
  elapsedSeconds: number;
  completed: boolean;
}

function progressKey(slug: string): string {
  return `polis:crossword:${slug}`;
}

function emptyAnswers(rows: number, cols: number): string[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => ""));
}

interface CrosswordProps {
  puzzle: CrosswordPuzzle;
  layout?: "full" | "embedded";
}

export function Crossword({ puzzle, layout = "full" }: CrosswordProps) {
  const isEmbedded = layout === "embedded";
  const [isCompactLandscape, setIsCompactLandscape] = useState(false);
  const { rows, cols, cells } = useMemo(() => buildCrosswordGrid(puzzle), [puzzle]);

  const defaultProgress = useMemo<StoredProgress>(
    () => ({ answers: emptyAnswers(rows, cols), elapsedSeconds: 0, completed: false }),
    [rows, cols]
  );

  const [progress, setProgress] = useLocalStorageState<StoredProgress>(progressKey(puzzle.slug), defaultProgress, {
    deserialize: (raw) => {
      const parsed = JSON.parse(raw) as StoredProgress;
      // Descarta progresso salvo de uma edição com dimensões diferentes
      // (grade mudou de tamanho) em vez de tentar encaixar respostas erradas.
      if (parsed.answers.length !== rows || parsed.answers[0]?.length !== cols) {
        return defaultProgress;
      }
      return parsed;
    },
  });
  const { answers, elapsedSeconds, completed } = progress;

  const [selected, setSelected] = useState<Position | null>(null);
  const [direction, setDirection] = useState<Direction>("across");
  const [checkResults, setCheckResults] = useState<boolean[][] | null>(null);
  const boardWrapperRef = useRef<HTMLDivElement>(null);
  const [boardWidth, setBoardWidth] = useState(0);

  const inputRefs = useRef(new Map<string, HTMLInputElement>());

  const entryAt = useMemo(() => {
    const map = new Map<string, Partial<Record<Direction, CrosswordEntry>>>();
    for (const entry of puzzle.entries) {
      for (let i = 0; i < entry.answer.length; i++) {
        const r = entry.direction === "down" ? entry.row + i : entry.row;
        const c = entry.direction === "across" ? entry.col + i : entry.col;
        const key = cellKey(r, c);
        const existing = map.get(key) ?? {};
        existing[entry.direction] = entry;
        map.set(key, existing);
      }
    }
    return map;
  }, [puzzle]);

  function entryFor(pos: Position, dir: Direction): CrosswordEntry | undefined {
    return entryAt.get(cellKey(pos.row, pos.col))?.[dir];
  }

  function isInSelectedWord(row: number, col: number): boolean {
    if (!selected) return false;
    const entry = entryFor(selected, direction);
    if (!entry) return false;
    if (entry.direction === "across") {
      return row === entry.row && col >= entry.col && col < entry.col + entry.answer.length;
    }
    return col === entry.col && row >= entry.row && row < entry.row + entry.answer.length;
  }

  function isFullyCorrect(candidate: string[][]): boolean {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = cells[r][c];
        if (cell.letter && candidate[r][c] !== cell.letter) return false;
      }
    }
    return true;
  }

  function focusCell(row: number, col: number) {
    inputRefs.current.get(cellKey(row, col))?.focus();
  }

  function selectCell(row: number, col: number) {
    if (!cells[row][col].letter) return;
    setCheckResults(null);
    const entries = entryAt.get(cellKey(row, col));
    if (selected && selected.row === row && selected.col === col) {
      if (entries?.across && entries?.down) {
        setDirection((d) => (d === "across" ? "down" : "across"));
      }
      return;
    }
    const preferred: Direction = entries?.[direction] ? direction : entries?.across ? "across" : "down";
    setDirection(preferred);
    setSelected({ row, col });
  }

  function focusEntry(entry: CrosswordEntry) {
    setCheckResults(null);
    setDirection(entry.direction);
    setSelected({ row: entry.row, col: entry.col });
    focusCell(entry.row, entry.col);
  }

  function moveInDirection(pos: Position, dir: Direction, delta: 1 | -1): Position | null {
    const row = dir === "down" ? pos.row + delta : pos.row;
    const col = dir === "across" ? pos.col + delta : pos.col;
    if (row < 0 || row >= rows || col < 0 || col >= cols) return null;
    if (!cells[row][col].letter) return null;
    return { row, col };
  }

  function handleChange(row: number, col: number, value: string) {
    const letter = value.slice(-1).toUpperCase().replace(/[^A-Z]/g, "");
    const next = answers.map((r) => [...r]);
    next[row][col] = letter;
    setCheckResults(null);

    const done = isFullyCorrect(next);
    setProgress({ answers: next, elapsedSeconds, completed: done });

    if (letter) {
      const nextPos = moveInDirection({ row, col }, direction, 1);
      if (nextPos) {
        setSelected(nextPos);
        focusCell(nextPos.row, nextPos.col);
      }
    }
  }

  function handleKeyDown(row: number, col: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !answers[row][col]) {
      const prev = moveInDirection({ row, col }, direction, -1);
      if (prev) {
        const next = answers.map((r) => [...r]);
        next[prev.row][prev.col] = "";
        setProgress({ answers: next, elapsedSeconds, completed: false });
        setSelected(prev);
        focusCell(prev.row, prev.col);
      }
      event.preventDefault();
      return;
    }

    const arrowMap: Partial<Record<string, { dir: Direction; delta: 1 | -1 }>> = {
      ArrowRight: { dir: "across", delta: 1 },
      ArrowLeft: { dir: "across", delta: -1 },
      ArrowDown: { dir: "down", delta: 1 },
      ArrowUp: { dir: "down", delta: -1 },
    };
    const move = arrowMap[event.key];
    if (move) {
      event.preventDefault();
      const next = moveInDirection({ row, col }, move.dir, move.delta);
      setDirection(move.dir);
      if (next) {
        setSelected(next);
        focusCell(next.row, next.col);
      }
    }
  }

  function handleCheck() {
    const results = answers.map((rowValues, r) =>
      rowValues.map((value, c) => {
        const cell = cells[r][c];
        if (!cell.letter || !value) return true;
        return value === cell.letter;
      })
    );
    setCheckResults(results);
  }

  function handleReveal() {
    const next = cells.map((rowCells) => rowCells.map((cell) => cell.letter ?? ""));
    setCheckResults(null);
    setProgress({ answers: next, elapsedSeconds, completed: true });
  }

  useEffect(() => {
    if (completed) return;
    const interval = window.setInterval(() => {
      setProgress((prev) => ({ ...prev, elapsedSeconds: prev.elapsedSeconds + 1 }));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [completed, setProgress]);

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
    return () => emitGameInteractionLock(false, "crossword");
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

  function handleBoardPointerDownCapture(event: React.PointerEvent<HTMLDivElement>) {
    emitGameInteractionLock(true, "crossword");
    event.stopPropagation();
  }

  function handleBoardPointerEndCapture() {
    emitGameInteractionLock(false, "crossword");
  }

  const currentClueEntry = selected ? entryFor(selected, direction) : undefined;
  const acrossEntries = puzzle.entries.filter((e) => e.direction === "across").sort((a, b) => a.number - b.number);
  const downEntries = puzzle.entries.filter((e) => e.direction === "down").sort((a, b) => a.number - b.number);
  const boardMaxPx = useMemo(() => {
    const preferredCell = isEmbedded ? (compactLandscape ? 30 : 35) : 40;
    const hardCap = isEmbedded ? (compactLandscape ? 440 : 520) : 640;
    return Math.min(cols * preferredCell, hardCap);
  }, [cols, compactLandscape, isEmbedded]);
  const activeBoardPx = boardWidth > 0 ? Math.min(boardWidth, boardMaxPx) : boardMaxPx;
  const cellPx = Math.max(28, Math.floor(activeBoardPx / cols));

  return (
    <div
      className={cn(
        "mx-auto flex w-full flex-col gap-8",
        compactLandscape && "max-w-none flex-row items-start gap-3",
        isEmbedded && !compactLandscape && "max-w-3xl",
        !isEmbedded && "max-w-4xl lg:flex-row lg:items-start lg:justify-center"
      )}
    >
      <div className={cn("flex flex-col items-center gap-4", compactLandscape && "min-w-0 flex-1 gap-2.5")}>
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
          {completed && (
            <span className="font-semibold uppercase tracking-wide text-polis-gold-ink">
              Concluída!
            </span>
          )}
        </div>

        <div ref={boardWrapperRef} className="w-full">
          <div
            className="mx-auto grid gap-[2px] border-2 border-polis-ink bg-polis-ink"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, width: `min(100%, ${boardMaxPx}px)` }}
            onPointerDownCapture={handleBoardPointerDownCapture}
            onPointerUpCapture={handleBoardPointerEndCapture}
            onPointerCancelCapture={handleBoardPointerEndCapture}
            onPointerOutCapture={handleBoardPointerEndCapture}
          >
            {cells.map((rowCells, r) =>
              rowCells.map((cell, c) => {
                if (!cell.letter) {
                  return <div key={cellKey(r, c)} className="aspect-square w-full bg-polis-ink" />;
                }

                const isSelected = selected?.row === r && selected?.col === c;
                const isHighlighted = isInSelectedWord(r, c);
                const result = checkResults?.[r]?.[c];

                return (
                  <div key={cellKey(r, c)} className="relative aspect-square w-full bg-polis-paper">
                    {cell.number && (
                      <span
                        className="pointer-events-none absolute left-0.5 top-0 select-none font-semibold text-polis-ink-soft"
                        style={{ fontSize: `${Math.max(8, Math.floor(cellPx * 0.2))}px` }}
                      >
                        {cell.number}
                      </span>
                    )}
                    <input
                      ref={(el) => {
                        if (el) inputRefs.current.set(cellKey(r, c), el);
                        else inputRefs.current.delete(cellKey(r, c));
                      }}
                      value={answers[r][c]}
                      maxLength={1}
                      inputMode="text"
                      autoComplete="off"
                      aria-label={`Casa ${cell.number ?? ""} linha ${r + 1} coluna ${c + 1}`}
                      onFocus={(event) => event.target.select()}
                      onClick={() => selectCell(r, c)}
                      onChange={(event) => handleChange(r, c, event.target.value)}
                      onKeyDown={(event) => handleKeyDown(r, c, event)}
                      className={cn(
                        "h-full w-full bg-transparent text-center font-serif font-bold uppercase text-polis-ink outline-none",
                        isSelected && "bg-polis-gold/30",
                        !isSelected && isHighlighted && "bg-polis-gold/10",
                        result === true && "text-polis-gold-ink",
                        result === false && "text-red-700"
                      )}
                      style={{ fontSize: `${Math.max(16, Math.floor(cellPx * 0.52))}px` }}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>

        <p
          className={cn(
            "text-center text-sm text-polis-ink-soft",
            compactLandscape && "min-h-0 max-w-none px-2 py-1 text-[12px] leading-snug",
            isEmbedded
              ? "min-h-12 w-full max-w-xl border-y border-polis-rule/15 bg-polis-paper-soft/20 px-3 py-2 leading-relaxed"
              : "min-h-10 max-w-xs"
          )}
        >
          {currentClueEntry
            ? `${currentClueEntry.number}. ${currentClueEntry.clue}`
            : "Selecione uma casa do tabuleiro para ver a dica."}
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={handleCheck}
            className={cn(
              "border border-polis-ink/30 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-polis-ink transition-colors hover:border-polis-gold-muted hover:text-polis-gold-ink",
              compactLandscape && "px-3 py-1.5 text-[11px]",
              isEmbedded && "min-w-32"
            )}
          >
            Conferir
          </button>
          <button
            type="button"
            onClick={handleReveal}
            className={cn(
              "text-xs uppercase tracking-wide text-polis-ink-soft underline hover:text-polis-gold-ink",
              compactLandscape && "px-3 py-1.5 text-[11px]",
              isEmbedded &&
              "border border-polis-rule/25 px-3 py-2 no-underline transition-colors hover:border-polis-gold-muted"
            )}
          >
            Revelar solução
          </button>
        </div>
      </div>

      <div
        className={cn(
          "grid w-full flex-1 grid-cols-1 gap-6 text-sm",
          compactLandscape &&
          "max-h-[19rem] max-w-[45%] overflow-y-auto border-l border-polis-rule/20 pl-3 pr-1 pt-0",
          isEmbedded && !compactLandscape && "max-w-3xl border-t border-polis-rule/20 pt-4 md:grid-cols-2",
          !isEmbedded && "max-w-md sm:grid-cols-2"
        )}
      >
        <div>
          <h2 className="mb-2 font-serif text-lg font-bold text-polis-ink">Horizontais</h2>
          <ul className={cn("space-y-2", isEmbedded && "space-y-1.5")}>
            {acrossEntries.map((entry) => (
              <li key={entry.number}>
                <button
                  type="button"
                  onClick={() => focusEntry(entry)}
                  className={cn(
                    "text-left text-polis-ink-soft hover:text-polis-gold-ink",
                    isEmbedded &&
                    "w-full border-b border-polis-rule/10 pb-1.5 text-[13px] leading-relaxed transition-colors"
                  )}
                >
                  <strong className="text-polis-ink">{entry.number}.</strong> {entry.clue}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-2 font-serif text-lg font-bold text-polis-ink">Verticais</h2>
          <ul className={cn("space-y-2", isEmbedded && "space-y-1.5")}>
            {downEntries.map((entry) => (
              <li key={entry.number}>
                <button
                  type="button"
                  onClick={() => focusEntry(entry)}
                  className={cn(
                    "text-left text-polis-ink-soft hover:text-polis-gold-ink",
                    isEmbedded &&
                    "w-full border-b border-polis-rule/10 pb-1.5 text-[13px] leading-relaxed transition-colors"
                  )}
                >
                  <strong className="text-polis-ink">{entry.number}.</strong> {entry.clue}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
