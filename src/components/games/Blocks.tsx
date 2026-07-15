"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";

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
const MIN_SPEED = 120;
const SPEED_STEP_PER_LEVEL = 60;
const LINES_PER_LEVEL = 10;
const LINE_SCORE = [0, 100, 300, 500, 800];
const HIGH_SCORE_KEY = "polis:blocos:recorde";

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

function loadHighScore(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(HIGH_SCORE_KEY);
    return raw ? Number(raw) || 0 : 0;
  } catch {
    return 0;
  }
}

function cellKey(row: number, col: number): string {
  return `${row}:${col}`;
}

export function Blocks() {
  const [board, setBoard] = useState<boolean[][]>(() => emptyBoard());
  const [current, setCurrent] = useState<PieceState | null>(null);
  const [nextType, setNextType] = useState<PieceType | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [highScore, setHighScore] = useState(0);

  const bagRef = useRef<PieceType[]>([]);
  const speedRef = useRef(START_SPEED);

  useEffect(() => {
    // Lido depois de montar (não no render inicial) para o HTML do servidor
    // e a primeira renderização no cliente baterem — ver a mesma técnica em
    // WordSearch.tsx.
    const timer = window.setTimeout(() => setHighScore(loadHighScore()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const endGame = useCallback((finalScore: number) => {
    setStatus("gameover");
    setHighScore((prev) => {
      const next = Math.max(prev, finalScore);
      try {
        window.localStorage.setItem(HIGH_SCORE_KEY, String(next));
      } catch {
        // localStorage indisponível (modo privado, etc.) — recorde some ao fechar a aba.
      }
      return next;
    });
  }, []);

  const advanceAfterLock = useCallback(
    (pieceToLock: PieceState, bonus = 0) => {
      const result = lockPiece(pieceToLock, board);
      if (result.gameOver) {
        endGame(score);
        return;
      }

      let newScore = score + bonus;
      if (result.cleared > 0) {
        const newLines = lines + result.cleared;
        const newLevel = Math.floor(newLines / LINES_PER_LEVEL) + 1;
        newScore += LINE_SCORE[result.cleared] * level;
        setLines(newLines);
        setLevel(newLevel);
        speedRef.current = Math.max(MIN_SPEED, START_SPEED - (newLevel - 1) * SPEED_STEP_PER_LEVEL);
      }
      if (newScore !== score) setScore(newScore);

      const type = nextType ?? takeFromBag(bagRef);
      const preview = peekBag(bagRef);
      const spawned: PieceState = { type, rotation: 0, ...spawnPosition(type) };

      setBoard(result.board);

      if (!canPlace(result.board, pieceCells(spawned))) {
        setCurrent(spawned);
        endGame(newScore);
        return;
      }

      setCurrent(spawned);
      setNextType(preview);
    },
    [board, score, lines, level, nextType, endGame]
  );

  function startGame() {
    bagRef.current = [];
    setBoard(emptyBoard());
    setScore(0);
    setLines(0);
    setLevel(1);
    speedRef.current = START_SPEED;

    const type = takeFromBag(bagRef);
    const preview = peekBag(bagRef);
    setCurrent({ type, rotation: 0, ...spawnPosition(type) });
    setNextType(preview);
    setStatus("playing");
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
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [status, togglePause, tryMove, tryRotate, hardDrop]);

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

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center gap-5 sm:flex-row sm:items-start sm:justify-center">
      <div className="flex flex-col items-center gap-4">
        <h1 className="font-serif text-3xl font-bold text-polis-ink">Jogo dos Blocos</h1>

        <div className="w-full rounded-2xl border-4 border-polis-ink bg-polis-ink p-3 shadow-lg">
          <div
            className="relative mx-auto w-[200px] overflow-hidden rounded-sm bg-[#9ead86] sm:w-[240px]"
            style={{ aspectRatio: `${COLS} / ${ROWS}` }}
          >
            <div
              className="grid h-full w-full"
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
                        filled && "bg-[#20281a]",
                        isGhost && "border border-[#20281a]/40"
                      )}
                    />
                  );
                })
              )}
            </div>

            {overlayMessage && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#9ead86]/90 px-3 text-center">
                <p className="font-serif text-lg font-bold text-[#20281a]">{overlayMessage}</p>
                {status === "gameover" && <p className="text-xs text-[#2b331f]">Você fez {score} pontos.</p>}
                <button
                  type="button"
                  onClick={startGame}
                  className="border border-[#20281a] px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-[#20281a] transition-colors hover:bg-[#20281a] hover:text-[#9ead86]"
                >
                  {status === "idle" ? "Jogar" : status === "paused" ? "Continuar" : "Jogar novamente"}
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="max-w-xs text-center text-xs text-polis-ink-soft">
          Setas (ou WASD) movem e giram, espaço derruba na hora, P pausa. Use os botões abaixo no
          toque.
        </p>

        <div className="grid grid-cols-3 gap-2">
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
            className="flex aspect-square items-center justify-center border border-polis-ink/30 text-[9px] font-semibold uppercase tracking-wide text-polis-ink-soft transition-colors hover:border-polis-gold-muted hover:text-polis-gold-ink disabled:opacity-30"
          >
            {status === "paused" ? "Continuar" : "Pausar"}
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

        <button
          type="button"
          onClick={hardDrop}
          disabled={status !== "playing"}
          className="w-full max-w-[190px] border border-polis-ink/30 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-polis-ink transition-colors hover:border-polis-gold-muted hover:text-polis-gold-ink disabled:opacity-30"
        >
          Queda rápida
        </button>
      </div>

      <div className="flex w-full max-w-[200px] flex-col gap-4 text-sm text-polis-ink">
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
          <dt className="text-polis-ink-soft">Linhas</dt>
          <dd className="text-right font-semibold">{lines}</dd>
          <dt className="text-polis-ink-soft">Nível</dt>
          <dd className="text-right font-semibold">{level}</dd>
        </dl>
      </div>
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
      className="flex aspect-square items-center justify-center border border-polis-ink/30 text-lg text-polis-ink transition-colors hover:border-polis-gold-muted hover:text-polis-gold-ink"
    >
      {children}
    </button>
  );
}
