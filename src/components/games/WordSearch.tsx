"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { buildWordSearchGrid, type WordSearchCell, type WordSearchPuzzle } from "@/lib/wordsearch";
import { cn } from "@/lib/utils";

interface StoredProgress {
  foundWords: string[];
  elapsedSeconds: number;
}

function cellKey(cell: WordSearchCell): string {
  return `${cell.row}:${cell.col}`;
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

function loadProgress(slug: string): StoredProgress {
  if (typeof window === "undefined") return { foundWords: [], elapsedSeconds: 0 };
  try {
    const raw = window.localStorage.getItem(progressKey(slug));
    if (!raw) return { foundWords: [], elapsedSeconds: 0 };
    const parsed = JSON.parse(raw) as Partial<StoredProgress>;
    return {
      foundWords: Array.isArray(parsed.foundWords) ? parsed.foundWords : [],
      elapsedSeconds: typeof parsed.elapsedSeconds === "number" ? parsed.elapsedSeconds : 0,
    };
  } catch {
    return { foundWords: [], elapsedSeconds: 0 };
  }
}

function persistProgress(slug: string, foundWords: Set<string>, elapsedSeconds: number) {
  try {
    window.localStorage.setItem(
      progressKey(slug),
      JSON.stringify({ foundWords: [...foundWords], elapsedSeconds })
    );
  } catch {
    // localStorage indisponível (modo privado, etc.) — progresso segue só em memória.
  }
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
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
}

export function WordSearch({ puzzle }: WordSearchProps) {
  const grid = useMemo(() => buildWordSearchGrid(puzzle), [puzzle]);

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

  // Começa "zerado" (igual ao HTML renderizado no servidor, que nunca tem
  // acesso ao localStorage do leitor) e só troca para o progresso salvo
  // depois de montar no cliente — ler localStorage direto no render (como um
  // useMemo síncrono) faria o cliente hidratar com um valor diferente do que
  // o servidor mandou, gerando o erro "hydration mismatch" do React.
  const [foundWords, setFoundWords] = useState<Set<string>>(() => new Set());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [dragStart, setDragStart] = useState<WordSearchCell | null>(null);
  const [dragCurrent, setDragCurrent] = useState<WordSearchCell | null>(null);
  const [missCells, setMissCells] = useState<WordSearchCell[] | null>(null);
  const [lastFound, setLastFound] = useState<string | null>(null);

  const pointerActiveRef = useRef(false);
  const foundWordsRef = useRef(foundWords);

  const completed = hydrated && foundWords.size === puzzle.words.length;

  useEffect(() => {
    foundWordsRef.current = foundWords;
  }, [foundWords]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = loadProgress(puzzle.slug);
      setFoundWords(new Set(stored.foundWords));
      setElapsedSeconds(stored.elapsedSeconds);
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [puzzle.slug]);

  useEffect(() => {
    if (completed || !hydrated) return;
    const interval = window.setInterval(() => {
      setElapsedSeconds((seconds) => {
        const next = seconds + 1;
        persistProgress(puzzle.slug, foundWordsRef.current, next);
        return next;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [completed, hydrated, puzzle.slug]);

  useEffect(() => {
    if (!missCells) return;
    const timer = window.setTimeout(() => setMissCells(null), 450);
    return () => window.clearTimeout(timer);
  }, [missCells]);

  function tryFinalize(start: WordSearchCell, end: WordSearchCell) {
    const cells = lineCells(start, end);
    if (!cells || cells.length < 2) return;

    const match = placementByKey.get(cellSetKey(cells));
    if (match && !foundWordsRef.current.has(match.word)) {
      const next = new Set(foundWordsRef.current);
      next.add(match.word);
      setFoundWords(next);
      setLastFound(match.word);
      persistProgress(puzzle.slug, next, elapsedSeconds);
    } else if (!match) {
      setMissCells(cells);
    }
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const cell = cellFromPoint(event.clientX, event.clientY);
    if (!cell) return;
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
    if (!pointerActiveRef.current || !dragStart) return;
    const cell = cellFromPoint(event.clientX, event.clientY);
    if (!cell) return;
    if (lineCells(dragStart, cell)) setDragCurrent(cell);
  }

  function handlePointerUp() {
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
    const all = new Set(puzzle.words);
    setFoundWords(all);
    persistProgress(puzzle.slug, all, elapsedSeconds);
  }

  const dragCells = useMemo(
    () => (dragStart ? lineCells(dragStart, dragCurrent ?? dragStart) ?? [dragStart] : []),
    [dragStart, dragCurrent]
  );
  const dragCellKeys = useMemo(() => new Set(dragCells.map(cellKey)), [dragCells]);
  const missCellKeys = useMemo(() => new Set((missCells ?? []).map(cellKey)), [missCells]);
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
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 lg:flex-row lg:items-start lg:justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-4 text-sm text-polis-ink-soft">
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

        <div className="overflow-x-auto rounded-lg border-4 border-polis-ink bg-polis-navy p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between gap-4 font-mono text-[9px] uppercase tracking-[0.25em] text-polis-gold/60">
            <span>Busca Lexical</span>
            <span>Tema: {puzzle.theme}</span>
          </div>

          <div
            className="relative touch-none select-none"
            style={{ display: "grid", gridTemplateColumns: `repeat(${grid.size}, minmax(0, 1fr))` }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            role="img"
            aria-label={`Grade de ${grid.size} por ${grid.size} letras. ${foundWords.size} de ${puzzle.words.length} palavras encontradas. Use o mouse ou o toque para arrastar sobre uma palavra.`}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(180deg, #fff 0px, #fff 1px, transparent 1px, transparent 3px)",
              }}
            />

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
                      "flex h-7 w-7 items-center justify-center font-mono text-sm font-bold uppercase text-polis-off-white/70 transition-colors duration-150 sm:h-9 sm:w-9 sm:text-base",
                      (isDragging || isFound) && "text-polis-gold",
                      isMiss && "text-red-400"
                    )}
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
                  stroke="#f87171"
                  strokeWidth={0.5}
                  strokeLinecap="round"
                  opacity={0.75}
                />
              )}
            </svg>
          </div>
        </div>

        <p aria-live="polite" className="sr-only">
          {lastFound ? `Palavra encontrada: ${lastFound}.` : ""}
        </p>

        <p className="max-w-xs text-center text-xs text-polis-ink-soft">
          Arraste (ou toque em uma casa e depois na outra ponta) sobre as letras para marcar uma
          palavra — nas 8 direções, inclusive de trás para frente.
        </p>

        <button
          type="button"
          onClick={handleReveal}
          className="text-xs uppercase tracking-wide text-polis-ink-soft underline hover:text-polis-gold-ink"
        >
          Revelar todas
        </button>
      </div>

      <div className="w-full max-w-sm flex-1">
        <h2 className="mb-3 font-serif text-lg font-bold text-polis-ink">Palavras do dia</h2>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-sm">
          {puzzle.words.map((word) => {
            const found = foundWords.has(word);
            return (
              <span
                key={word}
                className={cn("flex items-center gap-2", found ? "text-polis-gold-ink" : "text-polis-ink-soft")}
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
