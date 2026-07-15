"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface Point {
  x: number;
  y: number;
}

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
type Status = "idle" | "playing" | "paused" | "gameover";

const COLS = 20;
const ROWS = 12;
const START_SPEED = 160;
const MIN_SPEED = 70;
const SPEED_STEP = 4;
const HIGH_SCORE_KEY = "polis:cobrinha:recorde";

const INITIAL_SNAKE: Point[] = [
  { x: 8, y: 6 },
  { x: 7, y: 6 },
  { x: 6, y: 6 },
];
const INITIAL_DIRECTION: Direction = "RIGHT";
// Posição fixa (não randômica) para não divergir entre o HTML renderizado no
// servidor e a primeira renderização no cliente — randomizar aqui causaria
// hydration mismatch. A comida só é sorteada de fato a partir de startGame(),
// que só roda no cliente (evento de clique).
const INITIAL_FOOD: Point = { x: 14, y: 3 };

const DIRECTION_VECTORS: Record<Direction, Point> = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

const OPPOSITE: Record<Direction, Direction> = {
  UP: "DOWN",
  DOWN: "UP",
  LEFT: "RIGHT",
  RIGHT: "LEFT",
};

const KEY_TO_DIRECTION: Record<string, Direction> = {
  ArrowUp: "UP",
  w: "UP",
  W: "UP",
  ArrowDown: "DOWN",
  s: "DOWN",
  S: "DOWN",
  ArrowLeft: "LEFT",
  a: "LEFT",
  A: "LEFT",
  ArrowRight: "RIGHT",
  d: "RIGHT",
  D: "RIGHT",
};

function randomFood(snake: Point[]): Point {
  let candidate: Point;
  do {
    candidate = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
  } while (snake.some((segment) => segment.x === candidate.x && segment.y === candidate.y));
  return candidate;
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

export function Snake() {
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Point>(INITIAL_FOOD);
  const [status, setStatus] = useState<Status>("idle");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState<number>(() => loadHighScore());

  const directionRef = useRef<Direction>(INITIAL_DIRECTION);
  const nextDirectionRef = useRef<Direction>(INITIAL_DIRECTION);
  const speedRef = useRef(START_SPEED);
  const scoreRef = useRef(0);
  const touchStartRef = useRef<Point | null>(null);

  const startGame = useCallback(() => {
    setSnake(INITIAL_SNAKE);
    setFood(randomFood(INITIAL_SNAKE));
    setScore(0);
    scoreRef.current = 0;
    directionRef.current = INITIAL_DIRECTION;
    nextDirectionRef.current = INITIAL_DIRECTION;
    speedRef.current = START_SPEED;
    setStatus("playing");
  }, []);

  const queueDirection = useCallback(
    (direction: Direction) => {
      if (status !== "playing") return;
      if (direction === OPPOSITE[directionRef.current]) return;
      nextDirectionRef.current = direction;
    },
    [status]
  );

  const togglePause = useCallback(() => {
    setStatus((prev) => (prev === "playing" ? "paused" : prev === "paused" ? "playing" : prev));
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const direction = KEY_TO_DIRECTION[event.key];
      if (direction) {
        event.preventDefault();
        queueDirection(direction);
        return;
      }
      if (event.key === " ") {
        event.preventDefault();
        togglePause();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [queueDirection, togglePause]);

  useEffect(() => {
    if (status !== "playing") return;

    const timer = window.setTimeout(() => {
      directionRef.current = nextDirectionRef.current;
      const vector = DIRECTION_VECTORS[directionRef.current];
      const head = snake[0];
      const newHead: Point = { x: head.x + vector.x, y: head.y + vector.y };
      // Fiel ao jogo original: bater na borda da tela é fim de jogo, sem
      // "atravessar" para o outro lado.
      const hitWall = newHead.x < 0 || newHead.x >= COLS || newHead.y < 0 || newHead.y >= ROWS;
      const ateFood = newHead.x === food.x && newHead.y === food.y;
      const body = ateFood ? snake : snake.slice(0, -1);
      const collided = hitWall || body.some((segment) => segment.x === newHead.x && segment.y === newHead.y);

      if (collided) {
        setStatus("gameover");
        setHighScore((prev) => {
          const next = Math.max(prev, scoreRef.current);
          try {
            window.localStorage.setItem(HIGH_SCORE_KEY, String(next));
          } catch {
            // localStorage indisponível (modo privado, etc.) — recorde some ao fechar a aba.
          }
          return next;
        });
        return;
      }

      const newSnake = [newHead, ...body];
      setSnake(newSnake);

      if (ateFood) {
        scoreRef.current += 1;
        setScore(scoreRef.current);
        setFood(randomFood(newSnake));
        speedRef.current = Math.max(MIN_SPEED, speedRef.current - SPEED_STEP);
      }
    }, speedRef.current);

    return () => window.clearTimeout(timer);
  }, [status, snake, food]);

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;

    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      queueDirection(dx > 0 ? "RIGHT" : "LEFT");
    } else {
      queueDirection(dy > 0 ? "DOWN" : "UP");
    }
  }

  const overlayMessage =
    status === "idle"
      ? "Pronto para jogar?"
      : status === "paused"
        ? "Pausado"
        : status === "gameover"
          ? "Fim de jogo!"
          : null;

  return (
    <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center gap-5">
      <h1 className="font-serif text-3xl font-bold text-polis-ink">Jogo da Cobrinha</h1>

      <div className="flex w-full items-center justify-around border-y border-polis-rule/30 py-2 text-sm text-polis-ink">
        <span>
          Pontos <strong>{score}</strong>
        </span>
        <span className="text-polis-ink-soft">
          Recorde <strong>{highScore}</strong>
        </span>
      </div>

      <div className="w-full rounded-2xl border-4 border-polis-ink bg-polis-ink p-3 shadow-lg">
        <div
          className="relative w-full overflow-hidden rounded-sm bg-[#9ead86]"
          style={{ aspectRatio: `${COLS} / ${ROWS}` }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {snake.map((segment, index) => (
            <div
              key={index}
              className={cn("absolute rounded-[1px]", index === 0 ? "bg-[#20281a]" : "bg-[#2b331f]")}
              style={{
                width: `${100 / COLS}%`,
                height: `${100 / ROWS}%`,
                left: `${(segment.x / COLS) * 100}%`,
                top: `${(segment.y / ROWS) * 100}%`,
              }}
            />
          ))}

          <div
            className="absolute rounded-full bg-[#2b331f]"
            style={{
              width: `${100 / COLS}%`,
              height: `${100 / ROWS}%`,
              left: `${(food.x / COLS) * 100}%`,
              top: `${(food.y / ROWS) * 100}%`,
            }}
          />

          {overlayMessage && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#9ead86]/90 text-center">
              <p className="font-serif text-xl font-bold text-[#20281a]">{overlayMessage}</p>
              {status === "gameover" && <p className="text-sm text-[#2b331f]">Você fez {score} pontos.</p>}
              <button
                type="button"
                onClick={startGame}
                className="border border-[#20281a] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#20281a] transition-colors hover:bg-[#20281a] hover:text-[#9ead86]"
              >
                {status === "idle" ? "Jogar" : "Jogar novamente"}
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-polis-ink-soft">
        Use as setas do teclado (ou WASD), arraste o dedo na tela ou toque nos botões abaixo. Espaço
        pausa o jogo.
      </p>

      <div className="grid grid-cols-3 gap-2">
        <div />
        <DirectionButton label="Cima" onPress={() => queueDirection("UP")}>
          ▲
        </DirectionButton>
        <div />
        <DirectionButton label="Esquerda" onPress={() => queueDirection("LEFT")}>
          ◀
        </DirectionButton>
        <button
          type="button"
          onClick={togglePause}
          disabled={status === "idle" || status === "gameover"}
          className="flex aspect-square items-center justify-center border border-polis-ink/30 text-[10px] font-semibold uppercase tracking-wide text-polis-ink-soft transition-colors hover:border-polis-gold-muted hover:text-polis-gold-ink disabled:opacity-30"
        >
          {status === "paused" ? "Continuar" : "Pausar"}
        </button>
        <DirectionButton label="Direita" onPress={() => queueDirection("RIGHT")}>
          ▶
        </DirectionButton>
        <div />
        <DirectionButton label="Baixo" onPress={() => queueDirection("DOWN")}>
          ▼
        </DirectionButton>
        <div />
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
