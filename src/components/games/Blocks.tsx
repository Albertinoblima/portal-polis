"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn, formatTime } from "@/lib/utils";
import { cellKey } from "@/lib/grid";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import { GameOverlay } from "@/components/games/GameOverlay";
import { useCompactLandscape } from "@/hooks/useCompactLandscape";

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

function emptyBoard(): boolean[][] {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(false));
}

function canPlace(board: boolean[][], cells: { row: number; col: number }[]): boolean {
  return cells.every(({ row, col }) => {
    if (col < 0 || col >= COLS || row >= ROWS) return false;
    if (row < 0) return true;
    return !board[row][col];
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
  board: boolean[][];
  gameOver: boolean;
  cleared: number;
}

function lockPiece(piece: PieceState, board: boolean[][]): LockResult {
  const next = board.map((row) => [...row]);
  for (const { row, col } of pieceCells(piece)) {
    if (row < 0) return { board: next, gameOver: true, cleared: 0 };
    next[row][col] = true;
  }

  const remaining = next.filter((row) => row.some((cell) => !cell));
  const cleared = ROWS - remaining.length;
  const cleaned = [...Array.from({ length: cleared }, () => Array(COLS).fill(false)), ...remaining];

  return { board: cleaned, gameOver: false, cleared };
}

export function Blocks() {
  const [mode, setMode] = useLocalStorageState<BlocksMode>(MODE_KEY, "competitivo");
  const [board, setBoard] = useState<boolean[][]>(() => emptyBoard());
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

  const bagRef = useRef<PieceType[]>([]);
  const speedRef = useRef(START_SPEED);
  const elapsedRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isCompactLandscape = useCompactLandscape(true);
  const isTrainingMode = mode === "treino";
  const isChallengeMode = mode === "desafio";

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
  const boardWidth = isCompactLandscape ? "w-[190px]" : "w-[200px] sm:w-[240px]";
  const canChangeMode = status === "idle" || status === "gameover";
  const speedCellsPerSecond = (1000 / speedMs).toFixed(1);
  const challengeTierIndex = reachedChallengeTierIndex(lines);
  const bestTierLabel = bestChallengeTier >= 0 ? CHALLENGE_TIERS[bestChallengeTier]?.label : "-";
  const nextTier = CHALLENGE_TIERS[challengeTierIndex + 1] ?? null;
  const challengeProgress = nextTier ? Math.min(100, (lines / nextTier.lines) * 100) : 100;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className={cn(
        "mx-auto flex h-full max-w-3xl flex-col items-center justify-center gap-5 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-polis-gold-muted sm:flex-row sm:items-start sm:justify-center",
        isCompactLandscape && "justify-start gap-3"
      )}
    >
      <div className={cn("flex flex-col items-center gap-4", isCompactLandscape && "gap-2.5")}>
        <h1 className="font-serif text-3xl font-bold text-polis-ink">Jogo dos Blocos</h1>

        <div className="flex w-full max-w-[300px] gap-2">
          <button
            type="button"
            onClick={() => setMode("competitivo")}
            disabled={!canChangeMode}
            className={cn(
              "flex-1 border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors disabled:opacity-40",
              mode === "competitivo"
                ? "border-polis-gold-muted bg-polis-paper-soft text-polis-ink"
                : "border-polis-ink/30 text-polis-ink-soft hover:border-polis-gold-muted hover:text-polis-gold-ink"
            )}
          >
            Competitivo
          </button>
          <button
            type="button"
            onClick={() => setMode("treino")}
            disabled={!canChangeMode}
            className={cn(
              "flex-1 border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors disabled:opacity-40",
              mode === "treino"
                ? "border-polis-gold-muted bg-polis-paper-soft text-polis-ink"
                : "border-polis-ink/30 text-polis-ink-soft hover:border-polis-gold-muted hover:text-polis-gold-ink"
            )}
          >
            Treino
          </button>
          <button
            type="button"
            onClick={() => setMode("desafio")}
            disabled={!canChangeMode}
            className={cn(
              "flex-1 border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors disabled:opacity-40",
              mode === "desafio"
                ? "border-polis-gold-muted bg-polis-paper-soft text-polis-ink"
                : "border-polis-ink/30 text-polis-ink-soft hover:border-polis-gold-muted hover:text-polis-gold-ink"
            )}
          >
            Desafio
          </button>
        </div>

        <p className="text-center text-[11px] uppercase tracking-[0.14em] text-polis-ink-soft">
          {isTrainingMode
            ? "Modo treino: ritmo fixo para prática de encaixe"
            : isChallengeMode
              ? "Modo desafio: metas de linhas com aceleração temporal"
              : "Modo competitivo: progressão clássica por nível"}
        </p>

        {isChallengeMode && (
          <div className="w-full max-w-[300px] border border-polis-rule/20 bg-polis-paper-soft/25 px-3 py-2 text-xs text-polis-ink-soft">
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

        <div className="grid w-full max-w-[300px] grid-cols-2 items-center gap-y-1 border-y border-polis-rule/20 bg-polis-paper-soft/30 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-polis-ink">
          <span>Nível {level}</span>
          <span>Pontos {score}</span>
          <span>Linhas {lines}</span>
          <span>Tempo {formatTime(elapsedSeconds)}</span>
        </div>

        <div
          className={cn(
            "w-full border-2 bg-polis-ink p-px transition-colors duration-200 sm:w-auto",
            clearFlash ? "border-polis-gold" : "border-polis-ink"
          )}
        >
          <div
            className={cn("relative mx-auto overflow-hidden", boardWidth)}
            style={{ aspectRatio: `${COLS} / ${ROWS}` }}
          >
            <div
              className="grid h-full w-full gap-px bg-polis-ink"
              style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))` }}
            >
              {board.map((rowCells, r) =>
                rowCells.map((_, c) => {
                  const key = cellKey(r, c);
                  const filled = filledKeys.has(key);
                  const isGhost = !filled && ghostKeys.has(key);
                  return (
                    <div
                      key={key}
                      className={cn(
                        "bg-polis-paper",
                        filled && (clearFlash ? "bg-polis-gold" : "bg-polis-ink"),
                        isGhost && "border border-polis-ink/40"
                      )}
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

        <p className={cn("max-w-xs text-center text-xs text-polis-ink-soft", isCompactLandscape && "text-[11px] leading-snug")}>
          Setas (ou WASD) movem e giram, espaço derruba na hora, P pausa. Use os botões abaixo no
          toque.
        </p>

        <p className="text-[11px] uppercase tracking-[0.14em] text-polis-ink-soft">
          Ritmo atual: <strong className="text-polis-ink">{speedCellsPerSecond} casas/s</strong>
        </p>

        <div className={cn("grid grid-cols-3 gap-2", isCompactLandscape && "gap-1.5")}>
          <div />
          <DirectionButton compact={isCompactLandscape} label="Girar" onPress={tryRotate}>
            ⟳
          </DirectionButton>
          <div />
          <DirectionButton compact={isCompactLandscape} label="Esquerda" onPress={() => tryMove(0, -1)}>
            ◀
          </DirectionButton>
          <button
            type="button"
            onClick={togglePause}
            disabled={status === "idle" || status === "gameover"}
            className="flex aspect-square items-center justify-center border border-polis-ink/30 text-[9px] font-semibold uppercase tracking-wide text-polis-ink-soft transition-colors hover:border-polis-gold-muted hover:text-polis-gold-ink disabled:opacity-30"
          >
            {status === "paused" ? "Continuar" : "Pausar"}
          </button>
          <DirectionButton compact={isCompactLandscape} label="Direita" onPress={() => tryMove(0, 1)}>
            ▶
          </DirectionButton>
          <div />
          <DirectionButton compact={isCompactLandscape} label="Descer" onPress={() => tryMove(1, 0)}>
            ▼
          </DirectionButton>
          <div />
        </div>

        <button
          type="button"
          onClick={hardDrop}
          disabled={status !== "playing"}
          className={cn(
            "w-full max-w-[190px] border border-polis-ink/30 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-polis-ink transition-colors hover:border-polis-gold-muted hover:text-polis-gold-ink disabled:opacity-30",
            isCompactLandscape && "py-1.5 text-[11px]"
          )}
        >
          Queda rápida
        </button>
      </div>

      <div
        className={cn(
          "flex w-full max-w-[200px] flex-col gap-4 text-sm text-polis-ink",
          isCompactLandscape && "max-h-[22rem] overflow-y-auto border-l border-polis-rule/20 pl-3"
        )}
      >
        <div>
          <p className="text-xs uppercase tracking-wide text-polis-ink-soft">Próxima</p>
          <div className="mt-1 flex h-16 w-16 items-center justify-center border border-polis-ink/30 bg-polis-paper-soft">
            {nextShape && (
              <div
                className="grid h-12 w-12"
                style={{ gridTemplateColumns: `repeat(${nextShape.size}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${nextShape.size}, minmax(0, 1fr))` }}
              >
                {Array.from({ length: nextShape.size * nextShape.size }, (_, i) => {
                  const r = Math.floor(i / nextShape.size);
                  const c = i % nextShape.size;
                  const active = nextShape.cells.some(([cr, cc]) => cr === r && cc === c);
                  return <div key={i} className={cn(active && "bg-polis-ink")} />;
                })}
              </div>
            )}
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
          <dt className="text-polis-ink-soft">Pontos</dt>
          <dd className="text-right font-semibold">{score}</dd>
          <dt className="text-polis-ink-soft">Recorde</dt>
          <dd className="text-right font-semibold">{highScore}</dd>
          <dt className="text-polis-ink-soft">Melhor linhas</dt>
          <dd className="text-right font-semibold">{bestLines}</dd>
          <dt className="text-polis-ink-soft">Linhas</dt>
          <dd className="text-right font-semibold">{lines}</dd>
          <dt className="text-polis-ink-soft">Nível</dt>
          <dd className="text-right font-semibold">{level}</dd>
          <dt className="text-polis-ink-soft">Tempo</dt>
          <dd className="text-right font-semibold">{formatTime(elapsedSeconds)}</dd>
        </dl>
      </div>
    </div>
  );
}

function DirectionButton({
  label,
  onPress,
  compact = false,
  children,
}: {
  label: string;
  onPress: () => void;
  compact?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onPress}
      className={cn(
        "flex aspect-square items-center justify-center border border-polis-ink/30 text-lg text-polis-ink transition-colors hover:border-polis-gold-muted hover:text-polis-gold-ink",
        compact && "text-base"
      )}
    >
      {children}
    </button>
  );
}
