"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn, formatTime } from "@/lib/utils";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import { GameOverlay } from "@/components/games/GameOverlay";
import { useCompactLandscape } from "@/hooks/useCompactLandscape";

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
const HIGH_TIME_KEY = "polis:cobrinha:melhor-tempo";
const TIME_ACCELERATION_INTERVAL = 20;
const TIME_ACCELERATION_STEP = 2;

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

export function Snake() {
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Point>(INITIAL_FOOD);
  const [status, setStatus] = useState<Status>("idle");
  const [score, setScore] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [speedMs, setSpeedMs] = useState(START_SPEED);
  const [highScore, setHighScore] = useLocalStorageState(HIGH_SCORE_KEY, 0);
  const [bestTime, setBestTime] = useLocalStorageState(HIGH_TIME_KEY, 0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [isNewBestTime, setIsNewBestTime] = useState(false);
  const [eatenPulse, setEatenPulse] = useState<Point | null>(null);

  const directionRef = useRef<Direction>(INITIAL_DIRECTION);
  const nextDirectionRef = useRef<Direction>(INITIAL_DIRECTION);
  const speedRef = useRef(START_SPEED);
  const scoreRef = useRef(0);
  const elapsedRef = useRef(0);
  const touchStartRef = useRef<Point | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isCompactLandscape = useCompactLandscape(true);

  const startGame = useCallback(() => {
    setSnake(INITIAL_SNAKE);
    setFood(randomFood(INITIAL_SNAKE));
    setScore(0);
    setElapsedSeconds(0);
    elapsedRef.current = 0;
    scoreRef.current = 0;
    directionRef.current = INITIAL_DIRECTION;
    nextDirectionRef.current = INITIAL_DIRECTION;
    speedRef.current = START_SPEED;
    setSpeedMs(START_SPEED);
    setStatus("playing");
    setIsNewHighScore(false);
    setIsNewBestTime(false);
    containerRef.current?.focus();
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
    // Escuta no contêiner do jogo (não em `window`) para que setas/espaço só
    // afetem a cobra quando o tabuleiro estiver focado — assim não "vazam"
    // para outros campos da página (ex.: um campo de busca).
    const container = containerRef.current;
    if (!container) return;

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
        return;
      }
      if (event.key === "p" || event.key === "P" || event.key === "Escape") {
        event.preventDefault();
        togglePause();
      }
    }
    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
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
        setIsNewHighScore(scoreRef.current > highScore);
        setIsNewBestTime(elapsedRef.current > bestTime);
        setHighScore((prev) => Math.max(prev, scoreRef.current));
        setBestTime((prev) => Math.max(prev, elapsedRef.current));
        return;
      }

      const newSnake = [newHead, ...body];
      setSnake(newSnake);

      if (ateFood) {
        scoreRef.current += 1;
        setScore(scoreRef.current);
        setEatenPulse(food);
        setFood(randomFood(newSnake));
        speedRef.current = Math.max(MIN_SPEED, speedRef.current - SPEED_STEP);
        setSpeedMs(speedRef.current);
      }
    }, speedRef.current);

    return () => window.clearTimeout(timer);
  }, [status, snake, food, highScore, bestTime, setHighScore, setBestTime]);

  useEffect(() => {
    if (!eatenPulse) return;
    const timer = window.setTimeout(() => setEatenPulse(null), 300);
    return () => window.clearTimeout(timer);
  }, [eatenPulse]);

  useEffect(() => {
    if (status !== "playing") return;

    const timer = window.setInterval(() => {
      elapsedRef.current += 1;
      setElapsedSeconds(elapsedRef.current);

      if (elapsedRef.current % TIME_ACCELERATION_INTERVAL === 0) {
        speedRef.current = Math.max(MIN_SPEED, speedRef.current - TIME_ACCELERATION_STEP);
        setSpeedMs(speedRef.current);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [status]);

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

  const canPause = status === "playing" || status === "paused";
  const boardWidthClass = isCompactLandscape ? "w-[min(100%,22rem)]" : "w-full";
  const speedCellsPerSecond = (1000 / speedMs).toFixed(1);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className={cn(
        "mx-auto flex h-full max-w-4xl flex-col items-center justify-center gap-5 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-polis-gold-muted",
        isCompactLandscape && "justify-start gap-3 sm:flex-row sm:items-start sm:justify-center"
      )}
    >
      <div className={cn("flex w-full flex-col items-center gap-5", isCompactLandscape && "max-w-[24rem] gap-3")}>
        <h1 className="font-serif text-3xl font-bold text-polis-ink">Jogo da Cobrinha</h1>

        <div
          className={cn(
            "grid w-full grid-cols-2 items-center gap-y-1 border-y border-polis-rule/30 px-2 py-2 text-sm text-polis-ink sm:grid-cols-4",
            isCompactLandscape &&
            "border-polis-rule/20 bg-polis-paper-soft/30 py-1.5 text-xs font-semibold uppercase tracking-[0.15em]"
          )}
        >
          <span className="text-center">
            Pontos <strong>{score}</strong>
          </span>
          <span className="text-center text-polis-ink-soft">
            Tempo <strong>{formatTime(elapsedSeconds)}</strong>
          </span>
          <span className="text-center text-polis-ink-soft">
            Recorde <strong>{highScore}</strong>
          </span>
          <span className="text-center text-polis-ink-soft">
            Melhor tempo <strong>{formatTime(bestTime)}</strong>
          </span>
        </div>

        <div className={cn(boardWidthClass, "border-2 border-polis-ink")}>
          <div
            className="relative w-full overflow-hidden bg-polis-paper-soft touch-none"
            style={{ aspectRatio: `${COLS} / ${ROWS}` }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {snake.map((segment, index) => (
              <div
                key={index}
                className={cn("absolute", index === 0 ? "bg-polis-ink" : "bg-polis-ink/85")}
                style={{
                  width: `${100 / COLS}%`,
                  height: `${100 / ROWS}%`,
                  left: `${(segment.x / COLS) * 100}%`,
                  top: `${(segment.y / ROWS) * 100}%`,
                }}
              />
            ))}

            <div
              className="absolute rounded-full bg-polis-gold-ink"
              style={{
                width: `${100 / COLS}%`,
                height: `${100 / ROWS}%`,
                left: `${(food.x / COLS) * 100}%`,
                top: `${(food.y / ROWS) * 100}%`,
              }}
            />

            {eatenPulse && (
              <div
                className="motion-safe:animate-ping pointer-events-none absolute rounded-full bg-polis-gold/70"
                style={{
                  width: `${100 / COLS}%`,
                  height: `${100 / ROWS}%`,
                  left: `${(eatenPulse.x / COLS) * 100}%`,
                  top: `${(eatenPulse.y / ROWS) * 100}%`,
                }}
              />
            )}

            {overlayMessage && (
              <GameOverlay
                title={overlayMessage}
                subtitle={
                  status === "gameover" ? `Você fez ${score} pontos em ${formatTime(elapsedSeconds)}.` : undefined
                }
                actionLabel={status === "idle" ? "Jogar" : status === "paused" ? "Continuar" : "Jogar novamente"}
                onAction={status === "paused" ? togglePause : startGame}
                isNewHighScore={status === "gameover" && (isNewHighScore || isNewBestTime)}
              />
            )}
          </div>
        </div>

        <p className={cn("text-center text-xs text-polis-ink-soft", isCompactLandscape && "text-[11px] leading-snug")}>
          Use setas (ou WASD), arraste na tela ou toque nos botões. Espaço, P ou Esc pausam o jogo.
        </p>

        <p className="text-[11px] uppercase tracking-[0.14em] text-polis-ink-soft">
          Ritmo atual: <strong className="text-polis-ink">{speedCellsPerSecond} casas/s</strong>
        </p>

        <div className="flex w-full max-w-[260px] items-center justify-center gap-2">
          <button
            type="button"
            onClick={startGame}
            className="flex-1 border border-polis-ink/30 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-polis-ink transition-colors hover:border-polis-gold-muted hover:text-polis-gold-ink"
          >
            Novo jogo
          </button>
          <button
            type="button"
            onClick={togglePause}
            disabled={!canPause}
            className="flex-1 border border-polis-ink/30 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-polis-ink transition-colors hover:border-polis-gold-muted hover:text-polis-gold-ink disabled:opacity-30"
          >
            {status === "paused" ? "Continuar" : "Pausar"}
          </button>
        </div>

        <div className={cn("grid grid-cols-3 gap-2", isCompactLandscape && "gap-1.5")}>
          <div />
          <DirectionButton compact={isCompactLandscape} label="Cima" onPress={() => queueDirection("UP")}>
            ▲
          </DirectionButton>
          <div />
          <DirectionButton compact={isCompactLandscape} label="Esquerda" onPress={() => queueDirection("LEFT")}>
            ◀
          </DirectionButton>
          <div className="flex aspect-square items-center justify-center border border-dashed border-polis-ink/20 text-[10px] uppercase tracking-wide text-polis-ink-soft">
            eixo
          </div>
          <DirectionButton compact={isCompactLandscape} label="Direita" onPress={() => queueDirection("RIGHT")}>
            ▶
          </DirectionButton>
          <div />
          <DirectionButton compact={isCompactLandscape} label="Baixo" onPress={() => queueDirection("DOWN")}>
            ▼
          </DirectionButton>
          <div />
        </div>
      </div>

      <aside
        className={cn(
          "w-full max-w-xs border border-polis-rule/20 bg-polis-paper-soft/20 px-4 py-3 text-xs text-polis-ink-soft",
          isCompactLandscape ? "max-w-[15rem]" : "hidden"
        )}
      >
        <p className="font-semibold uppercase tracking-[0.14em] text-polis-ink">Guia Rápido</p>
        <ul className="mt-2 space-y-1.5 leading-relaxed">
          <li>Evite as bordas e o próprio corpo da cobra.</li>
          <li>Cada comida aumenta os pontos e acelera o ritmo.</li>
          <li>O tempo também acelera a partida a cada 20 segundos.</li>
          <li>Pausa estratégica ajuda em velocidades altas.</li>
        </ul>
      </aside>
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
