"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { buildWordSearchGrid, type WordSearchCell, type WordSearchPuzzle } from "@/lib/wordsearch";
import { cn, formatTime } from "@/lib/utils";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import { useElementSize } from "@/hooks/useElementSize";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { GameInfoDialog, GameSettingsButton } from "@/components/games/GameInfoDialog";
import { WordSearchGrid } from "./WordSearchGrid";
import { WordSearchOverlay, type FoundWordSegment } from "./WordSearchOverlay";
import { WordSearchWordList } from "./WordSearchWordList";
import { emitGameInteractionLock } from "./gameInteraction";
import { buildPlacementIndex, cellFromClientPoint, cellKey, cellSetKey, lineCells, wordColorVar } from "./wordSearchEngine";

interface Progress {
  foundWords: Set<string>;
  elapsedSeconds: number;
}

interface StoredProgress {
  foundWords: string[];
  elapsedSeconds: number;
}

function progressKey(slug: string): string {
  return `polis:wordsearch:${slug}`;
}

const MIN_CELL_PX = 22;

interface BoardBox {
  cellPx: number;
  px: number;
}

/** Como a grade é sempre quadrada (`size x size`), o lado da célula é só o
 *  menor entre largura/altura disponíveis dividido pelo tamanho — função
 *  pura fora do componente para não precisar entrar como dependência dos
 *  `useMemo` que a chamam. */
function computeBoardBox(size: { width: number; height: number }, gridSize: number): BoardBox | null {
  if (size.width <= 0 || size.height <= 0 || gridSize <= 0) return null;
  const cellPx = Math.max(MIN_CELL_PX, Math.floor(Math.min(size.width, size.height) / gridSize));
  return { cellPx, px: cellPx * gridSize };
}

interface EditionLink {
  href: string;
  label: string;
}

interface WordSearchProps {
  puzzle: WordSearchPuzzle;
  dateLabel: string;
  nav?: {
    older?: EditionLink;
    newer?: EditionLink;
    archiveHref?: string;
  };
}

export function WordSearch({ puzzle, dateLabel, nav }: WordSearchProps) {
  const grid = useMemo(() => buildWordSearchGrid(puzzle), [puzzle]);
  const placementIndex = useMemo(() => buildPlacementIndex(grid.placements), [grid]);

  const [progress, setProgress] = useLocalStorageState<Progress>(
    progressKey(puzzle.slug),
    { foundWords: new Set(), elapsedSeconds: 0 },
    {
      serialize: (value) => JSON.stringify({ foundWords: [...value.foundWords], elapsedSeconds: value.elapsedSeconds }),
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
  const completed = foundWords.size === puzzle.words.length;

  const [dragStart, setDragStart] = useState<WordSearchCell | null>(null);
  const [dragCurrent, setDragCurrent] = useState<WordSearchCell | null>(null);
  const [missCells, setMissCells] = useState<WordSearchCell[] | null>(null);
  const [pulsingWord, setPulsingWord] = useState<string | null>(null);
  const [lastFound, setLastFound] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const pointerActiveRef = useRef(false);

  // Decide qual dos dois layouts (mobile empilhado vs. desktop em 2
  // colunas) efetivamente MONTA no DOM — mesmo raciocínio de Snake.tsx/
  // Blocks.tsx/TicTacToe.tsx/Crossword.tsx (isDesktopLayout).
  const isDesktopLayout = useMediaQuery("(min-width: 1024px)");
  const [boardWrapRef, boardWrapSize] = useElementSize<HTMLDivElement>();
  const [desktopBoardWrapRef, desktopBoardWrapSize] = useElementSize<HTMLDivElement>();
  const mobileBoardBox = useMemo(() => computeBoardBox(boardWrapSize, grid.size), [boardWrapSize, grid.size]);
  const desktopBoardBox = useMemo(() => computeBoardBox(desktopBoardWrapSize, grid.size), [desktopBoardWrapSize, grid.size]);

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
    if (!pulsingWord) return;
    const timer = window.setTimeout(() => setPulsingWord(null), 500);
    return () => window.clearTimeout(timer);
  }, [pulsingWord]);

  useEffect(() => () => emitGameInteractionLock(false, "wordsearch"), []);

  function tryFinalize(start: WordSearchCell, end: WordSearchCell) {
    const cells = lineCells(start, end);
    if (!cells || cells.length < 2) return;

    const match = placementIndex.byKey.get(cellSetKey(cells));
    if (match && !foundWords.has(match.word)) {
      const nextFound = new Set(foundWords);
      nextFound.add(match.word);
      setProgress({ foundWords: nextFound, elapsedSeconds });
      setPulsingWord(match.word);
      setLastFound(match.word);
    } else if (!match) {
      setMissCells(cells);
    }
  }

  function handleReveal() {
    setProgress({ foundWords: new Set(puzzle.words), elapsedSeconds });
  }

  const dragCells = useMemo(
    () => (dragStart ? (lineCells(dragStart, dragCurrent ?? dragStart) ?? [dragStart]) : []),
    [dragStart, dragCurrent]
  );
  const dragCellKeys = useMemo(() => new Set(dragCells.map(cellKey)), [dragCells]);
  const missCellKeys = useMemo(() => new Set((missCells ?? []).map(cellKey)), [missCells]);
  const foundCellKeys = useMemo(() => {
    const set = new Set<string>();
    for (const word of foundWords) {
      const placement = placementIndex.byWord.get(word);
      if (placement) for (const cell of placement.cells) set.add(cellKey(cell));
    }
    return set;
  }, [foundWords, placementIndex]);
  const pulsingCellKeys = useMemo(() => {
    const placement = pulsingWord ? placementIndex.byWord.get(pulsingWord) : undefined;
    return placement ? new Set(placement.cells.map(cellKey)) : new Set<string>();
  }, [pulsingWord, placementIndex]);
  const foundSegments = useMemo<FoundWordSegment[]>(() => {
    const segments: FoundWordSegment[] = [];
    puzzle.words.forEach((word, index) => {
      if (!foundWords.has(word)) return;
      const placement = placementIndex.byWord.get(word);
      if (placement) segments.push({ word, colorVar: wordColorVar(index), cells: placement.cells });
    });
    return segments;
  }, [puzzle.words, foundWords, placementIndex]);

  function renderBoard(box: BoardBox | null) {
    const cellPx = box?.cellPx ?? MIN_CELL_PX;
    const px = box?.px ?? 0;

    // Pointer Events unificados (pointerdown/pointermove/pointerup, com
    // setPointerCapture) — funcionam de forma idêntica pra mouse, caneta e
    // toque, sem precisar de handlers separados de touch/mouse. A casa sob
    // o ponteiro é achada por geometria pura (cellFromClientPoint), não por
    // hit-test no DOM.
    function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
      const rect = event.currentTarget.getBoundingClientRect();
      const cell = cellFromClientPoint(rect, cellPx, grid.size, event.clientX, event.clientY);
      if (!cell) return;
      emitGameInteractionLock(true, "wordsearch");
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);

      if (dragStart && !pointerActiveRef.current) {
        // Segunda ponta de uma seleção "toque, toque" (alternativa ao
        // arrasto contínuo, mais confortável em casas pequenas no mobile).
        if (cell.row !== dragStart.row || cell.col !== dragStart.col) tryFinalize(dragStart, cell);
        setDragStart(null);
        setDragCurrent(null);
        return;
      }

      pointerActiveRef.current = true;
      setDragStart(cell);
      setDragCurrent(cell);
    }

    function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
      if (!pointerActiveRef.current || !dragStart) return;
      event.stopPropagation();
      const rect = event.currentTarget.getBoundingClientRect();
      const cell = cellFromClientPoint(rect, cellPx, grid.size, event.clientX, event.clientY);
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

    return (
      <div
        className={cn("relative shrink-0 border-2 border-polis-ink bg-polis-ink p-px transition-opacity", box ? "opacity-100" : "opacity-0")}
        style={{ width: px + 2, height: px + 2 }}
      >
        <div
          className="relative"
          style={{ width: px, height: px }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          role="img"
          aria-label={`Grade de ${grid.size} por ${grid.size} letras. ${foundWords.size} de ${puzzle.words.length} palavras encontradas. Arraste ou toque em duas pontas para marcar uma palavra.`}
        >
          <WordSearchGrid
            letters={grid.letters}
            size={grid.size}
            cellPx={cellPx}
            foundCellKeys={foundCellKeys}
            dragCellKeys={dragCellKeys}
            missCellKeys={missCellKeys}
            pulsingCellKeys={pulsingCellKeys}
          />
          <WordSearchOverlay size={grid.size} foundSegments={foundSegments} dragCells={dragCells} missCells={missCells} />
        </div>
      </div>
    );
  }

  const settingsContent = (
    <div className="flex flex-col gap-4 text-sm text-polis-ink">
      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-polis-ink-soft">Guia Rápido</p>
        <ul className="space-y-1.5 text-xs leading-relaxed text-polis-ink-soft">
          <li>Arraste sobre as letras (ou toque numa casa e depois na outra ponta) para marcar uma palavra.</li>
          <li>Vale nas 8 direções: horizontal, vertical e as duas diagonais — inclusive de trás para frente.</li>
          <li>Cada palavra encontrada ganha uma cor própria, igual na lista e no tabuleiro.</li>
          <li>O progresso é salvo automaticamente neste navegador.</li>
        </ul>
      </div>
      <button
        type="button"
        onClick={handleReveal}
        className="self-start border border-polis-rule/25 px-3 py-1.5 text-xs uppercase tracking-wide text-polis-ink-soft transition-colors hover:border-polis-gold-muted hover:text-polis-gold-ink"
      >
        Revelar todas
      </button>
      {(nav?.archiveHref || nav?.older || nav?.newer) && (
        <div className="border-t border-polis-rule/20 pt-3">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-polis-ink-soft">Edições</p>
          <div className="flex flex-col items-start gap-1.5 text-xs">
            {nav?.older && (
              <a href={nav.older.href} className="text-polis-ink-soft underline hover:text-polis-gold-ink">
                {nav.older.label}
              </a>
            )}
            {nav?.newer && (
              <a href={nav.newer.href} className="text-polis-ink-soft underline hover:text-polis-gold-ink">
                {nav.newer.label}
              </a>
            )}
            {nav?.archiveHref && (
              <a href={nav.archiveHref} className="text-polis-ink-soft underline hover:text-polis-gold-ink">
                Ver edições anteriores
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative flex h-full w-full flex-col gap-2 overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-serif text-lg font-bold text-polis-ink sm:text-xl">Caça-Palavras</h1>
          <p className="text-[11px] uppercase tracking-[0.14em] text-polis-ink-soft">
            {dateLabel} · {puzzle.theme}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-polis-ink-soft">
            Tempo <strong className="text-polis-ink">{formatTime(elapsedSeconds)}</strong>
          </span>
          <span className="text-xs text-polis-ink-soft">
            Palavras <strong className="text-polis-ink">{foundWords.size}/{puzzle.words.length}</strong>
          </span>
          {completed && <span className="text-xs font-semibold uppercase tracking-wide text-polis-gold-ink">Decifrado!</span>}
          <GameSettingsButton onClick={() => setGuideOpen(true)} />
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {lastFound ? `Palavra encontrada: ${lastFound}.` : ""}
      </p>

      {/* Mobile/tablet (< lg): tabuleiro maximizado (largura total, sem
          rolagem horizontal), lista de palavras compacta logo abaixo,
          riscando automaticamente conforme são encontradas. */}
      {!isDesktopLayout && (
        <div className="flex min-h-0 w-full flex-1 flex-col items-center gap-3">
          <div ref={boardWrapRef} className="flex min-h-0 w-full min-w-0 flex-1 items-center justify-center">
            {renderBoard(mobileBoardBox)}
          </div>

          <div className="w-full max-w-md min-h-0 flex-1 overflow-y-auto border-t border-polis-rule/20 pt-2.5">
            <WordSearchWordList words={puzzle.words} foundWords={foundWords} columns={2} />
          </div>
        </div>
      )}

      {/* Desktop (lg+): duas colunas — tabuleiro ampliado e centralizado à
          esquerda, lista de palavras em colunas limpas à direita.
          min-w-0 na coluna do tabuleiro é essencial (não decorativo): sem
          ele, o item de grid nunca encolhe abaixo do min-content do filho
          de largura fixa (o tabuleiro, dimensionado via ResizeObserver), o
          que cria um ciclo de realimentação que faz a coluna vazar pra
          fora da grade a cada poucos frames — mesmo bug já corrigido em
          Snake.tsx/Blocks.tsx/TicTacToe.tsx/Crossword.tsx. */}
      {isDesktopLayout && (
        <div className="grid min-h-0 flex-1 lg:grid-cols-[1fr_320px] lg:gap-8">
          <div ref={desktopBoardWrapRef} className="flex min-h-0 min-w-0 w-full flex-1 items-center justify-center">
            {renderBoard(desktopBoardBox)}
          </div>

          <div className="flex min-h-0 flex-col gap-3 overflow-y-auto border-l border-polis-rule/20 pl-6">
            <h2 className="font-serif text-lg font-bold text-polis-ink">Palavras do dia</h2>
            <WordSearchWordList words={puzzle.words} foundWords={foundWords} columns={2} />
          </div>
        </div>
      )}

      <GameInfoDialog open={guideOpen} onOpenChange={setGuideOpen} title="Configurações e Guia">
        {settingsContent}
      </GameInfoDialog>
    </div>
  );
}
