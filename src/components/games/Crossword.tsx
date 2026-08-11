"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { buildCrosswordGrid, type CrosswordEntry, type CrosswordPuzzle } from "@/lib/crosswords";
import { cn, formatTime } from "@/lib/utils";
import { cellKey } from "@/lib/grid";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import { useElementSize } from "@/hooks/useElementSize";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { GameInfoDialog, GameSettingsButton } from "@/components/games/GameInfoDialog";
import { CrosswordBoard } from "./CrosswordBoard";
import { CrosswordClues } from "./CrosswordClues";
import { CrosswordActiveClueBar } from "./CrosswordActiveClueBar";
import { emitGameInteractionLock } from "./gameInteraction";
import {
  buildEntryIndex,
  entryAt,
  isFullyCorrect,
  moveArrowSmart,
  moveOneStep,
  neighborEntry,
  orderedEntries,
  wordCells,
  type Direction,
  type Position,
} from "./crosswordEngine";

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

const MIN_CELL_PX = 22;

interface BoardBox {
  cellPx: number;
  width: number;
  height: number;
}

/** Tamanho de célula considerando LARGURA *E* ALTURA disponíveis — ao
 *  contrário da versão anterior (só largura), o que deixava um
 *  quebra-cabeça com muitas linhas crescer alto demais para a tela e forçar
 *  rolagem. Função pura, fora do componente, para não precisar entrar como
 *  dependência dos `useMemo` que a chamam. */
function computeBoardBox(size: { width: number; height: number }, cols: number, rows: number): BoardBox | null {
  if (size.width <= 0 || size.height <= 0 || cols <= 0 || rows <= 0) return null;
  const cellPx = Math.max(MIN_CELL_PX, Math.floor(Math.min(size.width / cols, size.height / rows)));
  return { cellPx, width: cellPx * cols, height: cellPx * rows };
}

interface EditionLink {
  href: string;
  label: string;
}

interface CrosswordProps {
  puzzle: CrosswordPuzzle;
  dateLabel: string;
  nav?: {
    older?: EditionLink;
    newer?: EditionLink;
    archiveHref?: string;
  };
}

export function Crossword({ puzzle, dateLabel, nav }: CrosswordProps) {
  const { rows, cols, cells } = useMemo(() => buildCrosswordGrid(puzzle), [puzzle]);
  const entryIndex = useMemo(() => buildEntryIndex(puzzle.entries), [puzzle]);
  const acrossEntries = useMemo(
    () => puzzle.entries.filter((e) => e.direction === "across").sort((a, b) => a.number - b.number),
    [puzzle]
  );
  const downEntries = useMemo(
    () => puzzle.entries.filter((e) => e.direction === "down").sort((a, b) => a.number - b.number),
    [puzzle]
  );
  const allEntries = useMemo(() => orderedEntries(puzzle.entries), [puzzle]);

  const defaultProgress = useMemo<StoredProgress>(
    () => ({ answers: emptyAnswers(rows, cols), elapsedSeconds: 0, completed: false }),
    [rows, cols]
  );
  const [progress, setProgress] = useLocalStorageState<StoredProgress>(progressKey(puzzle.slug), defaultProgress, {
    deserialize: (raw) => {
      const parsed = JSON.parse(raw) as StoredProgress;
      // Descarta progresso salvo de uma edição com dimensões diferentes
      // (grade mudou de tamanho) em vez de tentar encaixar respostas erradas.
      if (parsed.answers.length !== rows || parsed.answers[0]?.length !== cols) return defaultProgress;
      return parsed;
    },
  });
  const { answers, elapsedSeconds, completed } = progress;

  const [selected, setSelected] = useState<Position | null>(null);
  const [direction, setDirection] = useState<Direction>("across");
  const [checkResults, setCheckResults] = useState<boolean[][] | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [cluesOpen, setCluesOpen] = useState(false);

  // Decide qual dos dois layouts (mobile empilhado vs. desktop em 2 colunas)
  // efetivamente MONTA no DOM — mesmo raciocínio de Snake.tsx/Blocks.tsx/
  // TicTacToe.tsx (isDesktopLayout).
  const isDesktopLayout = useMediaQuery("(min-width: 1024px)");
  const [boardWrapRef, boardWrapSize] = useElementSize<HTMLDivElement>();
  const [desktopBoardWrapRef, desktopBoardWrapSize] = useElementSize<HTMLDivElement>();
  const mobileBoardBox = useMemo(() => computeBoardBox(boardWrapSize, cols, rows), [boardWrapSize, cols, rows]);
  const desktopBoardBox = useMemo(() => computeBoardBox(desktopBoardWrapSize, cols, rows), [desktopBoardWrapSize, cols, rows]);

  const inputRefs = useRef(new Map<string, HTMLInputElement>());

  function registerInputRef(row: number, col: number, el: HTMLInputElement | null) {
    const key = cellKey(row, col);
    if (el) inputRefs.current.set(key, el);
    else inputRefs.current.delete(key);
  }

  function focusCell(row: number, col: number) {
    inputRefs.current.get(cellKey(row, col))?.focus();
  }

  const currentEntry = selected ? entryAt(entryIndex, selected, direction) : undefined;
  const highlighted = useMemo(() => {
    const set = new Set<string>();
    if (currentEntry) for (const pos of wordCells(currentEntry)) set.add(cellKey(pos.row, pos.col));
    return set;
  }, [currentEntry]);

  function selectCell(row: number, col: number) {
    if (!cells[row][col].letter) return;
    setCheckResults(null);
    const entries = entryIndex.get(cellKey(row, col));
    if (selected && selected.row === row && selected.col === col) {
      // Casa de cruzamento: tocar de novo na mesma casa alterna o foco entre
      // a dica horizontal e a vertical, em vez de não fazer nada.
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
    setCluesOpen(false);
  }

  function goToNeighborClue(delta: 1 | -1) {
    const next = neighborEntry(allEntries, currentEntry, delta);
    if (next) focusEntry(next);
  }

  function handleChangeLetter(row: number, col: number, value: string) {
    const letter = value.slice(-1).toUpperCase().replace(/[^A-Z]/g, "");
    const next = answers.map((r) => [...r]);
    next[row][col] = letter;
    setCheckResults(null);
    setProgress({ answers: next, elapsedSeconds, completed: isFullyCorrect(cells, next) });

    if (letter) {
      const nextPos = moveOneStep(cells, { row, col }, direction, 1);
      if (nextPos) {
        setSelected(nextPos);
        focusCell(nextPos.row, nextPos.col);
      }
    }
  }

  function handleCellKeyDown(row: number, col: number, event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === " ") {
      // Alterna Horizontal/Vertical na própria casa, quando ela pertence às
      // duas — precisa do preventDefault ANTES do onChange rodar: sem ele,
      // o espaço chegaria como caractere digitado e, mesmo filtrado pelo
      // regex de handleChangeLetter, já teria limpado a resposta da casa
      // no caminho (value vira " " antes do filtro).
      event.preventDefault();
      const entries = entryIndex.get(cellKey(row, col));
      if (entries?.across && entries?.down) setDirection((d) => (d === "across" ? "down" : "across"));
      return;
    }

    if (event.key === "Backspace" && !answers[row]?.[col]) {
      const prev = moveOneStep(cells, { row, col }, direction, -1);
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
      // Navegação "inteligente": pula por cima de blocos pretos em vez de
      // ficar presa contra o primeiro bloco no caminho (ver crosswordEngine).
      const next = moveArrowSmart(cells, { row, col }, move.dir, move.delta);
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

  useEffect(() => () => emitGameInteractionLock(false, "crossword"), []);

  function handleBoardPointerDownCapture(event: ReactPointerEvent<HTMLDivElement>) {
    emitGameInteractionLock(true, "crossword");
    event.stopPropagation();
  }
  function handleBoardPointerEndCapture() {
    emitGameInteractionLock(false, "crossword");
  }

  function renderBoard(box: BoardBox | null) {
    return (
      <CrosswordBoard
        cells={cells}
        answers={answers}
        selected={selected}
        checkResults={checkResults}
        highlighted={highlighted}
        cellPx={box?.cellPx ?? MIN_CELL_PX}
        boardWidthPx={box?.width ?? 0}
        boardHeightPx={box?.height ?? 0}
        onSelectCell={selectCell}
        onChangeLetter={handleChangeLetter}
        onCellKeyDown={handleCellKeyDown}
        registerInputRef={registerInputRef}
        onPointerDownCapture={handleBoardPointerDownCapture}
        onPointerEndCapture={handleBoardPointerEndCapture}
      />
    );
  }

  function renderActions(className?: string) {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        <button
          type="button"
          onClick={handleCheck}
          className="border border-polis-ink/30 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-polis-ink transition-colors hover:border-polis-gold-muted hover:text-polis-gold-ink"
        >
          Conferir
        </button>
        <button
          type="button"
          onClick={handleReveal}
          className="border border-polis-rule/25 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-polis-ink-soft transition-colors hover:border-polis-gold-muted hover:text-polis-gold-ink"
        >
          Revelar solução
        </button>
      </div>
    );
  }

  const settingsContent = (
    <div className="flex flex-col gap-4 text-sm text-polis-ink">
      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-polis-ink-soft">Guia Rápido</p>
        <ul className="space-y-1.5 text-xs leading-relaxed text-polis-ink-soft">
          <li>Clique/toque numa casa para selecioná-la; de novo na mesma casa alterna entre a dica horizontal e vertical, quando houver as duas.</li>
          <li>Espaço também alterna a direção, sem precisar tocar de novo.</li>
          <li>Setas navegam pelo tabuleiro pulando os blocos pretos.</li>
          <li>Digitar avança automaticamente; Backspace numa casa vazia recua e apaga a anterior.</li>
          <li>O progresso é salvo automaticamente neste navegador.</li>
        </ul>
      </div>
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
          <h1 className="font-serif text-lg font-bold text-polis-ink sm:text-xl">Palavras Cruzadas</h1>
          <p className="text-[11px] uppercase tracking-[0.14em] text-polis-ink-soft">
            {dateLabel} · {puzzle.theme}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-polis-ink-soft">
            Tempo <strong className="text-polis-ink">{formatTime(elapsedSeconds)}</strong>
          </span>
          {completed && (
            <span className="text-xs font-semibold uppercase tracking-wide text-polis-gold-ink">Concluída!</span>
          )}
          <GameSettingsButton onClick={() => setGuideOpen(true)} />
        </div>
      </div>

      {/* Mobile/tablet (< lg): tabuleiro maximizado no topo; logo abaixo,
          só a dica ATIVA numa barra de destaque — a lista completa fica
          escondida atrás do botão "Todas" (é isto que acaba com a rolagem
          excessiva: antes, a lista inteira desenrolava sem limite abaixo
          do tabuleiro). Montado condicionalmente (não só escondido via
          CSS) — mesmo raciocínio de isDesktopLayout nos outros jogos. */}
      {!isDesktopLayout && (
        <div className="flex min-h-0 w-full flex-1 flex-col items-center gap-2.5">
          <div ref={boardWrapRef} className="flex min-h-0 w-full min-w-0 flex-1 items-center justify-center">
            {renderBoard(mobileBoardBox)}
          </div>

          <CrosswordActiveClueBar
            activeEntry={currentEntry}
            onPrev={() => goToNeighborClue(-1)}
            onNext={() => goToNeighborClue(1)}
            onOpenAllClues={() => setCluesOpen(true)}
          />

          {renderActions()}
        </div>
      )}

      {/* Desktop (lg+): duas colunas — tabuleiro maximizado à esquerda,
          dicas com rolagem PRÓPRIA à direita (nunca a página inteira).
          min-w-0 na coluna do tabuleiro é essencial (não decorativo): sem
          ele, o item de grid nunca encolhe abaixo do min-content do filho
          de largura fixa (o tabuleiro, dimensionado via ResizeObserver), o
          que cria um ciclo de realimentação que faz a coluna vazar pra
          fora da grade a cada poucos frames — mesmo bug já corrigido em
          Snake.tsx/Blocks.tsx/TicTacToe.tsx. */}
      {isDesktopLayout && (
        <div className="grid min-h-0 flex-1 lg:grid-cols-[1fr_340px] lg:gap-8">
          <div className="flex min-h-0 min-w-0 flex-col items-center gap-3">
            <div ref={desktopBoardWrapRef} className="flex min-h-0 min-w-0 w-full flex-1 items-center justify-center">
              {renderBoard(desktopBoardBox)}
            </div>
            <p className="min-h-10 w-full max-w-xl border-y border-polis-rule/15 bg-polis-paper-soft/20 px-3 py-2 text-center text-sm leading-relaxed text-polis-ink-soft">
              {currentEntry ? `${currentEntry.number}. ${currentEntry.clue}` : "Selecione uma casa do tabuleiro para ver a dica."}
            </p>
            {renderActions("justify-center")}
          </div>

          <div className="flex min-h-0 flex-col overflow-y-auto border-l border-polis-rule/20 pl-6">
            <CrosswordClues
              acrossEntries={acrossEntries}
              downEntries={downEntries}
              activeEntry={currentEntry}
              onSelectEntry={focusEntry}
              columns={1}
            />
          </div>
        </div>
      )}

      <GameInfoDialog open={guideOpen} onOpenChange={setGuideOpen} title="Configurações e Guia">
        {settingsContent}
      </GameInfoDialog>

      <GameInfoDialog open={cluesOpen} onOpenChange={setCluesOpen} title="Todas as dicas">
        <CrosswordClues
          acrossEntries={acrossEntries}
          downEntries={downEntries}
          activeEntry={currentEntry}
          onSelectEntry={focusEntry}
        />
      </GameInfoDialog>
    </div>
  );
}
