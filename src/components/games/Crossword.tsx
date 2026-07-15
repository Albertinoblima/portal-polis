"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { buildCrosswordGrid, type CrosswordEntry, type CrosswordPuzzle } from "@/lib/crosswords";
import { cn } from "@/lib/utils";

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

function cellKey(row: number, col: number): string {
  return `${row}:${col}`;
}

function progressKey(slug: string): string {
  return `polis:crossword:${slug}`;
}

function emptyAnswers(rows: number, cols: number): string[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => ""));
}

function loadProgress(slug: string, rows: number, cols: number): StoredProgress {
  const empty = emptyAnswers(rows, cols);
  if (typeof window === "undefined") return { answers: empty, elapsedSeconds: 0, completed: false };
  try {
    const raw = window.localStorage.getItem(progressKey(slug));
    if (!raw) return { answers: empty, elapsedSeconds: 0, completed: false };
    const parsed = JSON.parse(raw) as StoredProgress;
    if (parsed.answers.length !== rows || parsed.answers[0]?.length !== cols) {
      return { answers: empty, elapsedSeconds: 0, completed: false };
    }
    return parsed;
  } catch {
    return { answers: empty, elapsedSeconds: 0, completed: false };
  }
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

interface CrosswordProps {
  puzzle: CrosswordPuzzle;
}

export function Crossword({ puzzle }: CrosswordProps) {
  const { rows, cols, cells } = useMemo(() => buildCrosswordGrid(puzzle), [puzzle]);
  const initial = useMemo(() => loadProgress(puzzle.slug, rows, cols), [puzzle.slug, rows, cols]);

  const [answers, setAnswers] = useState<string[][]>(initial.answers);
  const [elapsedSeconds, setElapsedSeconds] = useState(initial.elapsedSeconds);
  const [completed, setCompleted] = useState(initial.completed);
  const [selected, setSelected] = useState<Position | null>(null);
  const [direction, setDirection] = useState<Direction>("across");
  const [checkResults, setCheckResults] = useState<boolean[][] | null>(null);

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

  function persist(nextAnswers: string[][], nextElapsed: number, nextCompleted: boolean) {
    try {
      window.localStorage.setItem(
        progressKey(puzzle.slug),
        JSON.stringify({ answers: nextAnswers, elapsedSeconds: nextElapsed, completed: nextCompleted })
      );
    } catch {
      // localStorage indisponível (modo privado, etc.) — progresso segue só em memória.
    }
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
    setAnswers(next);
    setCheckResults(null);

    const done = isFullyCorrect(next);
    setCompleted(done);
    persist(next, elapsedSeconds, done);

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
        setAnswers(next);
        persist(next, elapsedSeconds, false);
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
    setAnswers(next);
    setCheckResults(null);
    setCompleted(true);
    persist(next, elapsedSeconds, true);
  }

  useEffect(() => {
    if (completed) return;
    const interval = window.setInterval(() => {
      setElapsedSeconds((seconds) => {
        const next = seconds + 1;
        persist(answers, next, completed);
        return next;
      });
    }, 1000);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completed]);

  const currentClueEntry = selected ? entryFor(selected, direction) : undefined;
  const acrossEntries = puzzle.entries.filter((e) => e.direction === "across").sort((a, b) => a.number - b.number);
  const downEntries = puzzle.entries.filter((e) => e.direction === "down").sort((a, b) => a.number - b.number);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 lg:flex-row lg:items-start lg:justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-4 text-sm text-polis-ink-soft">
          <span>
            Tempo: <strong className="text-polis-ink">{formatTime(elapsedSeconds)}</strong>
          </span>
          {completed && (
            <span className="font-semibold uppercase tracking-wide text-polis-gold-ink">
              Concluída!
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <div
            className="grid gap-[2px] border-2 border-polis-ink bg-polis-ink"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {cells.map((rowCells, r) =>
              rowCells.map((cell, c) => {
                if (!cell.letter) {
                  return <div key={cellKey(r, c)} className="h-9 w-9 bg-polis-ink sm:h-10 sm:w-10" />;
                }

                const isSelected = selected?.row === r && selected?.col === c;
                const isHighlighted = isInSelectedWord(r, c);
                const result = checkResults?.[r]?.[c];

                return (
                  <div key={cellKey(r, c)} className="relative h-9 w-9 bg-polis-paper sm:h-10 sm:w-10">
                    {cell.number && (
                      <span className="pointer-events-none absolute left-0.5 top-0 select-none text-[8px] font-semibold text-polis-ink-soft">
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
                        "h-full w-full bg-transparent text-center font-serif text-lg font-bold uppercase text-polis-ink outline-none",
                        isSelected && "bg-polis-gold/30",
                        !isSelected && isHighlighted && "bg-polis-gold/10",
                        result === true && "text-polis-gold-ink",
                        result === false && "text-red-700"
                      )}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>

        <p className="min-h-10 max-w-xs text-center text-sm text-polis-ink-soft">
          {currentClueEntry
            ? `${currentClueEntry.number}. ${currentClueEntry.clue}`
            : "Selecione uma casa do tabuleiro para ver a dica."}
        </p>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleCheck}
            className="border border-polis-ink/30 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-polis-ink transition-colors hover:border-polis-gold-muted hover:text-polis-gold-ink"
          >
            Conferir
          </button>
          <button
            type="button"
            onClick={handleReveal}
            className="text-xs uppercase tracking-wide text-polis-ink-soft underline hover:text-polis-gold-ink"
          >
            Revelar solução
          </button>
        </div>
      </div>

      <div className="grid w-full max-w-md flex-1 grid-cols-1 gap-6 text-sm sm:grid-cols-2">
        <div>
          <h2 className="mb-2 font-serif text-lg font-bold text-polis-ink">Horizontais</h2>
          <ul className="space-y-2">
            {acrossEntries.map((entry) => (
              <li key={entry.number}>
                <button
                  type="button"
                  onClick={() => focusEntry(entry)}
                  className="text-left text-polis-ink-soft hover:text-polis-gold-ink"
                >
                  <strong className="text-polis-ink">{entry.number}.</strong> {entry.clue}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-2 font-serif text-lg font-bold text-polis-ink">Verticais</h2>
          <ul className="space-y-2">
            {downEntries.map((entry) => (
              <li key={entry.number}>
                <button
                  type="button"
                  onClick={() => focusEntry(entry)}
                  className="text-left text-polis-ink-soft hover:text-polis-gold-ink"
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
