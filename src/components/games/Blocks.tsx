"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn, formatTime } from "@/lib/utils";
import { cellKey } from "@/lib/grid";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import { useElementSize } from "@/hooks/useElementSize";
import { useCompactLandscape } from "@/hooks/useCompactLandscape";
import { GameOverlay } from "@/components/games/GameOverlay";
import { GameInfoDialog, GameSettingsButton } from "@/components/games/GameInfoDialog";

type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";
type BlocksMode = "competitivo" | "treino" | "desafio";

interface PieceShape {
  /** Lado do quadro-guia (bounding box) onde a peça gira. */
  size: number;
  /** Casas ocupadas na rotação 0, como [linha, coluna] dentro do quadro-guia. */
  cells: [number, number][];
}

interface PieceState {
  type: PieceType;
  rotation: number;
  /** Posição do canto superior esquerdo do quadro-guia no tabuleiro. */
  row: number;
  col: number;
}

type Status = "idle" | "playing" | "paused" | "gameover";

const ROWS = 20;
const COLS = 10;
const BOARD_RATIO = COLS / ROWS;
/** Espaçamento (gap-3) entre o tabuleiro e o painel "Próxima" na mesma fileira. */
const ROW_GAP_PX = 12;
const START_SPEED = 800;
const TRAINING_SPEED = 900;
const CHALLENGE_START_SPEED = 760;
const LINES_PER_LEVEL = 10;
const COMPETITIVE_MIN_SPEED = 140;
const COMPETITIVE_SPEED_STEP = 55;
const CHALLENGE_MIN_SPEED = 170;
const CHALLENGE_TIME_ACCELERATION_INTERVAL = 22;
const CHALLENGE_TIME_ACCELERATION_STEP = 20;
const CHALLENGE_LINE_ACCELERATION_STEP = 12;
const LINE_SCORE = [0, 100, 300, 500, 800];
const HIGH_SCORE_KEY = "polis:blocos:recorde";
const BEST_LINES_KEY = "polis:blocos:melhor-linhas";
const MODE_KEY = "polis:blocos:modo";
const CHALLENGE_BEST_TIER_KEY = "polis:blocos:desafio:melhor-tier";

const CHALLENGE_TIERS = [
  { label: "Bronze", lines: 14 },
  { label: "Prata", lines: 30 },
  { label: "Ouro", lines: 46 },
] as const;

const PIECES: Record<PieceType, PieceShape> = {
  I: { size: 4, cells: [[1, 0], [1, 1], [1, 2], [1, 3]] },
  O: { size: 2, cells: [[0, 0], [0, 1], [1, 0], [1, 1]] },
  T: { size: 3, cells: [[0, 1], [1, 0], [1, 1], [1, 2]] },
  S: { size: 3, cells: [[0, 1], [0, 2], [1, 0], [1, 1]] },
  Z: { size: 3, cells: [[0, 0], [0, 1], [1, 1], [1, 2]] },
  J: { size: 3, cells: [[0, 0], [1, 0], [1, 1], [1, 2]] },
  L: { size: 3, cells: [[0, 2], [1, 0], [1, 1], [1, 2]] },
};

const PIECE_TYPES: PieceType[] = ["I", "O", "T", "S", "Z", "J", "L"];

/** Cores vibrantes e distintas para cada tipo de peça (valores hex). */
const PIECE_COLORS: Record<PieceType, { light: string; dark: string }> = {
  I: { light: "#0ea5e9", dark: "#0284c7" },
  O: { light: "#fbbf24", dark: "#f59e0b" },
  T: { light: "#a855f7", dark: "#9333ea" },
  S: { light: "#10b981", dark: "#059669" },
  Z: { light: "#f43f5e", dark: "#e11d48" },
  J: { light: "#3b82f6", dark: "#1d4ed8" },
  L: { light: "#fb923c", dark: "#f97316" },
};

function getPieceColor(type: PieceType, state: "light" | "dark" = "light"): string {
  return PIECE_COLORS[type][state];
}

/** Gira as casas 90° no sentido horário dentro do quadro-guia, `times` vezes. */
function rotateCells(cells: [number, number][], size: number, times: number): [number, number][] {
  let result = cells;
  const normalized = ((times % 4) + 4) % 4;
  for (let i = 0; i < normalized; i++) {
    result = result.map(([r, c]) => [c, size - 1 - r] as [number, number]);
  }
  return result;
}

function pieceCells(piece: PieceState): { row: number; col: number }[] {
  const shape = PIECES[piece.type];
  return rotateCells(shape.cells, shape.size, piece.rotation).map(([r, c]) => ({
    row: piece.row + r,
    col: piece.col + c,
  }));
}

function spawnPosition(type: PieceType): { row: number; col: number } {
  const shape = PIECES[type];
  return { row: 0, col: Math.floor((COLS - shape.size) / 2) };
}

function emptyBoard(): (PieceType | null)[][] {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function canPlace(board: (PieceType | null)[][], cells: { row: number; col: number }[]): boolean {
  return cells.every(({ row, col }) => {
    if (col < 0 || col >= COLS || row >= ROWS) return false;
    if (row < 0) return true;
    return board[row][col] === null;
  });
}

/** Sorteio "7-bag", como nos Tetris modernos: cada sequência de 7 peças contém
 *  exatamente uma de cada tipo, embaralhada — evita sequências de má sorte
 *  (ex.: cinco peças "S" seguidas). Só é chamado a partir de eventos do
 *  jogador (começar/repor o saco durante a partida), nunca durante a
 *  renderização inicial — sortear no render quebraria a hidratação. */
function shuffledBag(): PieceType[] {
  const bag = [...PIECE_TYPES];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

function takeFromBag(bagRef: { current: PieceType[] }): PieceType {
  if (bagRef.current.length === 0) bagRef.current = shuffledBag();
  return bagRef.current.shift() as PieceType;
}

function peekBag(bagRef: { current: PieceType[] }): PieceType {
  if (bagRef.current.length === 0) bagRef.current = shuffledBag();
  return bagRef.current[0];
}

function highScoreKeyForMode(mode: BlocksMode): string {
  return `${HIGH_SCORE_KEY}:${mode}`;
}

function bestLinesKeyForMode(mode: BlocksMode): string {
  return `${BEST_LINES_KEY}:${mode}`;
}

function reachedChallengeTierIndex(lines: number): number {
  for (let i = CHALLENGE_TIERS.length - 1; i >= 0; i--) {
    if (lines >= CHALLENGE_TIERS[i].lines) return i;
  }
  return -1;
}

interface LockResult {
  board: (PieceType | null)[][];
  gameOver: boolean;
  cleared: number;
}

function lockPiece(piece: PieceState, board: (PieceType | null)[][]): LockResult {
  const next = board.map((row) => [...row]);
  for (const { row, col } of pieceCells(piece)) {
    if (row < 0) return { board: next, gameOver: true, cleared: 0 };
    next[row][col] = piece.type;
  }

  const remaining = next.filter((row) => row.some((cell) => cell === null));
  const cleared = ROWS - remaining.length;
  const cleaned = [...Array.from({ length: cleared }, () => Array(COLS).fill(null)), ...remaining];

  return { board: cleaned, gameOver: false, cleared };
}

export function Blocks() {
  const [mode, setMode] = useLocalStorageState<BlocksMode>(MODE_KEY, "competitivo");
  const [board, setBoard] = useState<(PieceType | null)[][]>(() => emptyBoard());
  const [current, setCurrent] = useState<PieceState | null>(null);
  const [nextType, setNextType] = useState<PieceType | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [speedMs, setSpeedMs] = useState(START_SPEED);
  const [highScore, setHighScore] = useLocalStorageState(highScoreKeyForMode(mode), 0);
  const [bestLines, setBestLines] = useLocalStorageState(bestLinesKeyForMode(mode), 0);
  const [bestChallengeTier, setBestChallengeTier] = useLocalStorageState(CHALLENGE_BEST_TIER_KEY, -1);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [isNewBestLines, setIsNewBestLines] = useState(false);
  const [isNewChallengeTier, setIsNewChallengeTier] = useState(false);
  const [clearFlash, setClearFlash] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  const bagRef = useRef<PieceType[]>([]);
  const speedRef = useRef(START_SPEED);
  const elapsedRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  // Medidos juntos (não só o board isolado): o tabuleiro dos Blocos é alto e
  // estreito, então sobra muita largura no wrap — se centralizássemos só o
  // board dentro dela, o painel "Próxima" (que fica ao lado) ia parar
  // encostado na borda direita, longe do tabuleiro. Medindo a fileira toda e
  // descontando a largura real do painel, o conjunto board+"Próxima" fica
  // centralizado como um bloco só.
  const [rowRef, rowSize] = useElementSize<HTMLDivElement>();
  const [nextPanelRef, nextPanelSize] = useElementSize<HTMLDivElement>();
  const [dpadWrapRef, dpadWrapSize] = useElementSize<HTMLDivElement>();
  const isCompactLandscape = useCompactLandscape(true);
  const isTrainingMode = mode === "treino";
  const isChallengeMode = mode === "desafio";

  const boardBox = useMemo(() => {
    const { width, height } = rowSize;
    if (width <= 0 || height <= 0) return null;
    const reserved = nextPanelSize.width > 0 ? nextPanelSize.width + ROW_GAP_PX : 0;
    const availableWidth = Math.max(width - reserved, 0);
    const w = Math.floor(Math.min(availableWidth, height * BOARD_RATIO));
    return { width: w, height: Math.floor(w / BOARD_RATIO) };
  }, [rowSize, nextPanelSize]);

  // Só entra em jogo no modo paisagem compacto: lá a barra lateral tem altura
  // fixa (compartilhada com o tabuleiro) e placar+ritmo+D-pad competem por
  // ela — sem isto o D-pad (dimensionado só pela largura, com células
  // aspect-square) podia ficar mais alto do que o espaço realmente sobrando,
  // empurrando parte da barra para fora da área visível. Uma grade 3×3 com
  // gap uniforme é sempre quadrada (altura total = largura total), então
  // basta limitar pela altura disponível medida.
  const dpadFitPx = isCompactLandscape && dpadWrapSize.height > 0 ? Math.min(190, Math.floor(dpadWrapSize.height)) : null;

  const endGame = useCallback(
    (finalScore: number, finalLines: number) => {
      const reachedTier = isChallengeMode ? reachedChallengeTierIndex(finalLines) : -1;
      setStatus("gameover");
      setIsNewHighScore(finalScore > highScore);
      setIsNewBestLines(finalLines > bestLines);
      if (isChallengeMode) {
        setIsNewChallengeTier(reachedTier > bestChallengeTier);
        setBestChallengeTier((prev) => Math.max(prev, reachedTier));
      } else {
        setIsNewChallengeTier(false);
      }
      setHighScore((prev) => Math.max(prev, finalScore));
      setBestLines((prev) => Math.max(prev, finalLines));
    },
    [
      isChallengeMode,
      highScore,
      bestLines,
      bestChallengeTier,
      setHighScore,
      setBestLines,
      setBestChallengeTier,
    ]
  );

  const advanceAfterLock = useCallback(
    (pieceToLock: PieceState, bonus = 0) => {
      const result = lockPiece(pieceToLock, board);
      if (result.gameOver) {
        endGame(score, lines);
        return;
      }

      let newScore = score + bonus;
      let newLines = lines;
      let newLevel = level;
      if (result.cleared > 0) {
        newLines = lines + result.cleared;
        newLevel = Math.floor(newLines / LINES_PER_LEVEL) + 1;
        newScore += LINE_SCORE[result.cleared] * level;
        setLines(newLines);
        setLevel(newLevel);
        setClearFlash(true);
        if (!isTrainingMode && !isChallengeMode) {
          speedRef.current = Math.max(COMPETITIVE_MIN_SPEED, START_SPEED - (newLevel - 1) * COMPETITIVE_SPEED_STEP);
          setSpeedMs(speedRef.current);
        }
        if (isChallengeMode) {
          speedRef.current = Math.max(CHALLENGE_MIN_SPEED, speedRef.current - result.cleared * CHALLENGE_LINE_ACCELERATION_STEP);
          setSpeedMs(speedRef.current);
        }
      }
      if (newScore !== score) setScore(newScore);

      const type = nextType ?? takeFromBag(bagRef);
      const preview = peekBag(bagRef);
      const spawned: PieceState = { type, rotation: 0, ...spawnPosition(type) };

      setBoard(result.board);

      if (!canPlace(result.board, pieceCells(spawned))) {
        setCurrent(spawned);
        endGame(newScore, newLines);
        return;
      }

      setCurrent(spawned);
      setNextType(preview);
    },
    [board, score, lines, level, nextType, endGame, isTrainingMode, isChallengeMode]
  );

  function startGame() {
    bagRef.current = [];
    setBoard(emptyBoard());
    setScore(0);
    setLines(0);
    setLevel(1);
    setElapsedSeconds(0);
    elapsedRef.current = 0;
    const initialSpeed = isTrainingMode ? TRAINING_SPEED : isChallengeMode ? CHALLENGE_START_SPEED : START_SPEED;
    speedRef.current = initialSpeed;
    setSpeedMs(initialSpeed);

    const type = takeFromBag(bagRef);
    const preview = peekBag(bagRef);
    setCurrent({ type, rotation: 0, ...spawnPosition(type) });
    setNextType(preview);
    setStatus("playing");
    setIsNewHighScore(false);
    setIsNewBestLines(false);
    setIsNewChallengeTier(false);
    containerRef.current?.focus();
  }

  const togglePause = useCallback(() => {
    setStatus((prev) => (prev === "playing" ? "paused" : prev === "paused" ? "playing" : prev));
  }, []);

  const openInfo = useCallback(() => {
    if (status === "playing") setStatus("paused");
    setInfoOpen(true);
  }, [status]);

  const tryMove = useCallback(
    (dRow: number, dCol: number) => {
      if (status !== "playing" || !current) return;
      const moved: PieceState = { ...current, row: current.row + dRow, col: current.col + dCol };
      if (canPlace(board, pieceCells(moved))) setCurrent(moved);
    },
    [status, current, board]
  );

  const tryRotate = useCallback(() => {
    if (status !== "playing" || !current) return;
    const rotated: PieceState = { ...current, rotation: (current.rotation + 1) % 4 };
    // Pequenos ajustes horizontais ("wall kick" simplificado): tenta girar no
    // lugar e, se não couber, empurra a peça 1-2 casas para os lados antes
    // de desistir — evita que rotações perto da parede sejam sempre negadas.
    for (const kick of [0, -1, 1, -2, 2]) {
      const attempt: PieceState = { ...rotated, col: rotated.col + kick };
      if (canPlace(board, pieceCells(attempt))) {
        setCurrent(attempt);
        return;
      }
    }
  }, [status, current, board]);

  const hardDrop = useCallback(() => {
    if (status !== "playing" || !current) return;
    let dropped = current;
    let distance = 0;
    while (canPlace(board, pieceCells({ ...dropped, row: dropped.row + 1 }))) {
      dropped = { ...dropped, row: dropped.row + 1 };
      distance++;
    }
    advanceAfterLock(dropped, distance * 2);
  }, [status, current, board, advanceAfterLock]);

  useEffect(() => {
    if (status !== "playing" || !current) return;

    const timer = window.setTimeout(() => {
      const movedDown: PieceState = { ...current, row: current.row + 1 };
      if (canPlace(board, pieceCells(movedDown))) {
        setCurrent(movedDown);
      } else {
        advanceAfterLock(current);
      }
    }, speedRef.current);

    return () => window.clearTimeout(timer);
  }, [status, current, board, advanceAfterLock]);

  useEffect(() => {
    if (status !== "playing") return;

    const timer = window.setInterval(() => {
      elapsedRef.current += 1;
      setElapsedSeconds(elapsedRef.current);

      if (isChallengeMode && elapsedRef.current % CHALLENGE_TIME_ACCELERATION_INTERVAL === 0) {
        speedRef.current = Math.max(CHALLENGE_MIN_SPEED, speedRef.current - CHALLENGE_TIME_ACCELERATION_STEP);
        setSpeedMs(speedRef.current);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [status, isChallengeMode]);

  useEffect(() => {
    // Escuta no contêiner do jogo (não em `window`) para que os controles não
    // "vazem" para outros campos da página — ver o mesmo raciocínio em Snake.tsx.
    const container = containerRef.current;
    if (!container) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "p" || event.key === "P" || event.key === "Escape") {
        event.preventDefault();
        togglePause();
        return;
      }
      if (status !== "playing") return;
      switch (event.key) {
        case "ArrowLeft":
        case "a":
        case "A":
          event.preventDefault();
          tryMove(0, -1);
          break;
        case "ArrowRight":
        case "d":
        case "D":
          event.preventDefault();
          tryMove(0, 1);
          break;
        case "ArrowDown":
        case "s":
        case "S":
          event.preventDefault();
          tryMove(1, 0);
          break;
        case "ArrowUp":
        case "w":
        case "W":
          event.preventDefault();
          tryRotate();
          break;
        case " ":
          event.preventDefault();
          hardDrop();
          break;
      }
    }
    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [status, togglePause, tryMove, tryRotate, hardDrop]);

  useEffect(() => {
    if (!clearFlash) return;
    const timer = window.setTimeout(() => setClearFlash(false), 250);
    return () => window.clearTimeout(timer);
  }, [clearFlash]);

  const currentCells = useMemo(() => (current ? pieceCells(current) : []), [current]);

  const ghostCells = useMemo(() => {
    if (!current || status !== "playing") return [];
    let ghost = current;
    while (canPlace(board, pieceCells({ ...ghost, row: ghost.row + 1 }))) {
      ghost = { ...ghost, row: ghost.row + 1 };
    }
    return pieceCells(ghost);
  }, [current, board, status]);

  const filledKeys = useMemo(() => {
    const set = new Set<string>();
    board.forEach((row, r) => row.forEach((cell, c) => cell && set.add(cellKey(r, c))));
    for (const { row, col } of currentCells) {
      if (row >= 0) set.add(cellKey(row, col));
    }
    return set;
  }, [board, currentCells]);

  const ghostKeys = useMemo(() => new Set(ghostCells.map(({ row, col }) => cellKey(row, col))), [ghostCells]);

  const nextShape = nextType ? PIECES[nextType] : null;
  const overlayMessage =
    status === "idle" ? "Pronto para jogar?" : status === "paused" ? "Pausado" : status === "gameover" ? "Fim de jogo!" : null;
  const canChangeMode = status === "idle" || status === "gameover";
  const speedCellsPerSecond = (1000 / speedMs).toFixed(1);
  const challengeTierIndex = reachedChallengeTierIndex(lines);
  const bestTierLabel = bestChallengeTier >= 0 ? CHALLENGE_TIERS[bestChallengeTier]?.label : "-";
  const nextTier = CHALLENGE_TIERS[challengeTierIndex + 1] ?? null;
  const challengeProgress = nextTier ? Math.min(100, (lines / nextTier.lines) * 100) : 100;

  const settingsContent = (
    <div className="flex flex-col gap-4 text-sm text-polis-ink">
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-polis-ink-soft">Modo</p>
        <div className="flex gap-2">
          {(["competitivo", "treino", "desafio"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setMode(option)}
              disabled={!canChangeMode}
              className={cn(
                "flex-1 border px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors disabled:opacity-40",
                mode === option
                  ? "border-polis-gold-muted bg-polis-paper-soft text-polis-ink"
                  : "border-polis-ink/30 text-polis-ink-soft hover:border-polis-gold-muted hover:text-polis-gold-ink"
              )}
            >
              {option === "competitivo" ? "Competitivo" : option === "treino" ? "Treino" : "Desafio"}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-polis-ink-soft">
          {isTrainingMode
            ? "Modo treino: ritmo fixo para prática de encaixe."
            : isChallengeMode
              ? "Modo desafio: metas de linhas com aceleração temporal."
              : "Modo competitivo: progressão clássica por nível."}
        </p>
      </div>

      {isChallengeMode && (
        <div className="border border-polis-rule/20 bg-polis-paper-soft/25 px-3 py-2 text-xs text-polis-ink-soft">
          <div className="flex items-center justify-between">
            <span>
              Medalha: <strong className="text-polis-ink">{challengeTierIndex >= 0 ? CHALLENGE_TIERS[challengeTierIndex].label : "-"}</strong>
            </span>
            <span>
              Melhor: <strong className="text-polis-ink">{bestTierLabel}</strong>
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden bg-polis-ink/15">
            <div className="h-full bg-polis-gold-muted transition-[width] duration-300" style={{ width: `${challengeProgress}%` }} />
          </div>
          <p className="mt-1 text-[11px] uppercase tracking-[0.12em]">
            {nextTier ? `Próxima medalha (${nextTier.label}) em ${nextTier.lines} linhas` : "Meta máxima atingida"}
          </p>
        </div>
      )}

      <dl className="grid grid-cols-2 gap-x-2 gap-y-1 border-y border-polis-rule/20 py-2 text-xs">
        <dt className="text-polis-ink-soft">Recorde</dt>
        <dd className="text-right font-semibold">{highScore}</dd>
        <dt className="text-polis-ink-soft">Melhor linhas</dt>
        <dd className="text-right font-semibold">{bestLines}</dd>
      </dl>

      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-polis-ink-soft">Guia Rápido</p>
        <ul className="space-y-1.5 text-xs leading-relaxed text-polis-ink-soft">
          <li>Setas (ou WASD) movem e giram, espaço derruba na hora, P pausa.</li>
          <li>Use os botões na tela para jogar no toque.</li>
        </ul>
      </div>
    </div>
  );

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className="relative flex h-full w-full flex-col gap-2 overflow-hidden outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-polis-gold-muted"
    >
      <div className="flex shrink-0 items-center justify-between gap-2">
        <h1 className="font-serif text-lg font-bold text-polis-ink sm:text-xl">Jogo dos Blocos</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={startGame}
            className="border border-polis-ink/30 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-polis-ink transition-colors hover:border-polis-gold-muted hover:text-polis-gold-ink"
          >
            Novo jogo
          </button>
          <GameSettingsButton onClick={openInfo} />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row lg:gap-6">
        <div
          className={cn(
            "flex min-h-0 w-full min-w-0 flex-1",
            isCompactLandscape ? "flex-row items-stretch justify-center gap-4" : "flex-col items-center gap-2"
          )}
        >
          <div ref={rowRef} className={cn("flex min-h-0 flex-1 items-center justify-center gap-3", isCompactLandscape ? "w-auto" : "w-full")}>
            <div
              className={cn(
                "shrink-0 border-2 bg-polis-ink p-px transition-colors duration-200",
                clearFlash ? "border-polis-gold" : "border-polis-ink",
                boardBox ? "opacity-100" : "opacity-0"
              )}
              style={{ width: (boardBox?.width ?? 0) + 2, height: (boardBox?.height ?? 0) + 2 }}
            >
              <div className="relative h-full w-full overflow-hidden">
                <div
                  className="grid h-full w-full gap-px bg-polis-ink"
                  style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))` }}
                >
                  {board.map((rowCells, r) =>
                    rowCells.map((pieceAtCell, c) => {
                      const key = cellKey(r, c);
                      const filled = filledKeys.has(key);
                      const isGhost = !filled && ghostKeys.has(key);
                      const bgColor = pieceAtCell ? getPieceColor(pieceAtCell, "light") : "#f4f1e9";
                      return (
                        <div
                          key={key}
                          className={cn(
                            filled && clearFlash && "ring-2 ring-polis-gold ring-inset shadow-lg",
                            filled && !clearFlash && "shadow-md",
                            isGhost && "border-2 border-polis-ink/40 opacity-60",
                            !filled && !isGhost && "border border-polis-ink/10"
                          )}
                          style={{ backgroundColor: bgColor }}
                        />
                      );
                    })
                  )}
                </div>

                {overlayMessage && (
                  <GameOverlay
                    title={overlayMessage}
                    subtitle={
                      status === "gameover"
                        ? `${isChallengeMode && challengeTierIndex >= 0
                          ? `Medalha: ${CHALLENGE_TIERS[challengeTierIndex].label}. `
                          : ""
                        }Você fez ${score} pontos em ${formatTime(elapsedSeconds)}.`
                        : undefined
                    }
                    actionLabel={status === "idle" ? "Jogar" : status === "paused" ? "Continuar" : "Jogar novamente"}
                    onAction={status === "paused" ? togglePause : startGame}
                    isNewHighScore={status === "gameover" && (isNewHighScore || isNewBestLines || isNewChallengeTier)}
                  />
                )}
              </div>
            </div>

            <div ref={nextPanelRef} className="flex shrink-0 flex-col items-center gap-1.5">
              <p className="text-[10px] uppercase tracking-wide text-polis-ink-soft">Próxima</p>
              <div className="flex h-12 w-12 items-center justify-center border-2 border-polis-ink/20 bg-polis-paper-soft sm:h-14 sm:w-14">
                {nextShape && nextType && (
                  <div
                    className="grid h-10 w-10 gap-px bg-polis-ink/10 sm:h-11 sm:w-11"
                    style={{ gridTemplateColumns: `repeat(${nextShape.size}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${nextShape.size}, minmax(0, 1fr))` }}
                  >
                    {Array.from({ length: nextShape.size * nextShape.size }, (_, i) => {
                      const r = Math.floor(i / nextShape.size);
                      const c = i % nextShape.size;
                      const active = nextShape.cells.some(([cr, cc]) => cr === r && cc === c);
                      const bgColor = active ? getPieceColor(nextType, "light") : "transparent";
                      return <div key={i} className={active ? "shadow-md" : ""} style={{ backgroundColor: bgColor }} />;
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div
            className={cn(
              "flex shrink-0 flex-col items-center gap-2",
              isCompactLandscape ? "h-full w-[190px] overflow-y-auto" : "w-full max-w-md"
            )}
          >
            <div
              className={cn(
                "grid w-full items-center gap-y-1 border-y border-polis-rule/20 bg-polis-paper-soft/30 py-1.5 font-semibold uppercase tracking-[0.12em] text-polis-ink",
                isCompactLandscape ? "grid-cols-2 gap-x-1 text-[9px]" : "max-w-md grid-cols-4 px-2 text-[11px]"
              )}
            >
              <span className="text-center">Nível {level}</span>
              <span className="text-center">Pontos {score}</span>
              <span className="text-center">Linhas {lines}</span>
              <span className="text-center">Tempo {formatTime(elapsedSeconds)}</span>
            </div>

            <div
              className={cn(
                "flex w-full shrink-0 gap-2 text-[11px] uppercase tracking-[0.1em] text-polis-ink-soft",
                isCompactLandscape ? "flex-col items-stretch gap-1.5" : "max-w-xs items-center justify-between"
              )}
            >
              <span>
                Ritmo <strong className="text-polis-ink">{speedCellsPerSecond} c/s</strong>
              </span>
              <button
                type="button"
                onClick={hardDrop}
                disabled={status !== "playing"}
                className="border border-polis-ink/30 px-2.5 py-1 font-semibold text-polis-ink transition-colors hover:border-polis-gold-muted hover:text-polis-gold-ink disabled:opacity-30"
              >
                Queda rápida
              </button>
            </div>

            <div
              ref={dpadWrapRef}
              className={cn("flex items-center justify-center", isCompactLandscape ? "min-h-0 w-full flex-1" : "w-full shrink-0")}
            >
              <div
                className={cn(
                  "grid shrink-0 grid-cols-3 gap-1.5 transition-opacity",
                  isCompactLandscape ? (dpadFitPx ? "opacity-100" : "opacity-0") : "w-full max-w-[190px]"
                )}
                style={isCompactLandscape ? { width: dpadFitPx ?? 0, height: dpadFitPx ?? 0 } : undefined}
              >
                <div />
                <DirectionButton label="Girar" onPress={tryRotate}>
                  ⟳
                </DirectionButton>
                <div />
                <DirectionButton label="Esquerda" onPress={() => tryMove(0, -1)}>
                  ◀
                </DirectionButton>
                <button
                  type="button"
                  onClick={togglePause}
                  disabled={status === "idle" || status === "gameover"}
                  aria-label={status === "paused" ? "Continuar" : "Pausar"}
                  className="flex aspect-square min-h-0 min-w-0 items-center justify-center border border-polis-ink/30 text-[9px] font-semibold uppercase tracking-wide text-polis-ink-soft transition-colors hover:border-polis-gold-muted hover:text-polis-gold-ink disabled:opacity-30"
                >
                  {status === "paused" ? "▶" : "II"}
                </button>
                <DirectionButton label="Direita" onPress={() => tryMove(0, 1)}>
                  ▶
                </DirectionButton>
                <div />
                <DirectionButton label="Descer" onPress={() => tryMove(1, 0)}>
                  ▼
                </DirectionButton>
                <div />
              </div>
            </div>
          </div>
        </div>

        <aside className="hidden w-64 shrink-0 overflow-y-auto border-l border-polis-rule/20 pl-5 lg:block">
          {settingsContent}
        </aside>
      </div>

      <GameInfoDialog open={infoOpen} onOpenChange={setInfoOpen} title="Configurações e Guia">
        {settingsContent}
      </GameInfoDialog>
    </div>
  );
}

function DirectionButton({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onPress}
      className="flex aspect-square min-h-0 min-w-0 items-center justify-center border border-polis-ink/30 text-base text-polis-ink transition-colors hover:border-polis-gold-muted hover:text-polis-gold-ink"
    >
      {children}
    </button>
  );
}
