"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn, formatTime } from "@/lib/utils";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import { useElementSize } from "@/hooks/useElementSize";
import { GameOverlay } from "@/components/games/GameOverlay";
import { GameInfoDialog, GameSettingsButton } from "@/components/games/GameInfoDialog";

interface Point {
  x: number;
  y: number;
}

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
type Status = "idle" | "playing" | "paused" | "gameover";
type SnakeMode = "competitivo" | "treino" | "desafio";

const COLS = 20;
const ROWS = 12;
const BOARD_RATIO = COLS / ROWS;
const START_SPEED = 160;
const TRAINING_SPEED = 180;
const CHALLENGE_START_SPEED = 150;
const MIN_SPEED = 70;
const SPEED_STEP = 4;
const HIGH_SCORE_KEY = "polis:cobrinha:recorde";
const HIGH_TIME_KEY = "polis:cobrinha:melhor-tempo";
const MODE_KEY = "polis:cobrinha:modo";
const CHALLENGE_BEST_TIER_KEY = "polis:cobrinha:desafio:melhor-tier";
const TIME_ACCELERATION_INTERVAL = 20;
const TIME_ACCELERATION_STEP = 2;

const CHALLENGE_TIERS = [
  { label: "Bronze", seconds: 120 },
  { label: "Prata", seconds: 240 },
  { label: "Ouro", seconds: 360 },
] as const;

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

function highScoreKeyForMode(mode: SnakeMode): string {
  return `${HIGH_SCORE_KEY}:${mode}`;
}

function highTimeKeyForMode(mode: SnakeMode): string {
  return `${HIGH_TIME_KEY}:${mode}`;
}

function reachedChallengeTierIndex(seconds: number): number {
  for (let i = CHALLENGE_TIERS.length - 1; i >= 0; i--) {
    if (seconds >= CHALLENGE_TIERS[i].seconds) return i;
  }
  return -1;
}

export function Snake() {
  const [mode, setMode] = useLocalStorageState<SnakeMode>(MODE_KEY, "competitivo");
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Point>(INITIAL_FOOD);
  const [status, setStatus] = useState<Status>("idle");
  const [score, setScore] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [speedMs, setSpeedMs] = useState(START_SPEED);
  const [highScore, setHighScore] = useLocalStorageState(highScoreKeyForMode(mode), 0);
  const [bestTime, setBestTime] = useLocalStorageState(highTimeKeyForMode(mode), 0);
  const [bestChallengeTier, setBestChallengeTier] = useLocalStorageState(CHALLENGE_BEST_TIER_KEY, -1);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [isNewBestTime, setIsNewBestTime] = useState(false);
  const [isNewChallengeTier, setIsNewChallengeTier] = useState(false);
  const [eatenPulse, setEatenPulse] = useState<Point | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);

  const directionRef = useRef<Direction>(INITIAL_DIRECTION);
  const nextDirectionRef = useRef<Direction>(INITIAL_DIRECTION);
  const speedRef = useRef(START_SPEED);
  const scoreRef = useRef(0);
  const elapsedRef = useRef(0);
  const touchStartRef = useRef<Point | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [boardWrapRef, boardWrapSize] = useElementSize<HTMLDivElement>();
  const isTrainingMode = mode === "treino";
  const isChallengeMode = mode === "desafio";

  const boardBox = useMemo(() => {
    const { width, height } = boardWrapSize;
    if (width <= 0 || height <= 0) return null;
    const w = Math.floor(Math.min(width, height * BOARD_RATIO));
    return { width: w, height: Math.floor(w / BOARD_RATIO) };
  }, [boardWrapSize]);

  const startGame = useCallback(() => {
    setSnake(INITIAL_SNAKE);
    setFood(randomFood(INITIAL_SNAKE));
    setScore(0);
    setElapsedSeconds(0);
    elapsedRef.current = 0;
    scoreRef.current = 0;
    directionRef.current = INITIAL_DIRECTION;
    nextDirectionRef.current = INITIAL_DIRECTION;
    const initialSpeed = isTrainingMode ? TRAINING_SPEED : isChallengeMode ? CHALLENGE_START_SPEED : START_SPEED;
    speedRef.current = initialSpeed;
    setSpeedMs(initialSpeed);
    setStatus("playing");
    setIsNewHighScore(false);
    setIsNewBestTime(false);
    setIsNewChallengeTier(false);
    containerRef.current?.focus();
  }, [isChallengeMode, isTrainingMode]);

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

  const openInfo = useCallback(() => {
    if (status === "playing") setStatus("paused");
    setInfoOpen(true);
  }, [status]);

  const adjustSpeed = useCallback(
    (delta: number) => {
      if (status !== "playing") return;
      const newSpeed = Math.max(MIN_SPEED, Math.min(START_SPEED, speedRef.current + delta));
      if (newSpeed !== speedRef.current) {
        speedRef.current = newSpeed;
        setSpeedMs(newSpeed);
      }
    },
    [status]
  );

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
        const reachedTier = isChallengeMode ? reachedChallengeTierIndex(elapsedRef.current) : -1;
        setStatus("gameover");
        setIsNewHighScore(scoreRef.current > highScore);
        setIsNewBestTime(elapsedRef.current > bestTime);
        setHighScore((prev) => Math.max(prev, scoreRef.current));
        setBestTime((prev) => Math.max(prev, elapsedRef.current));
        if (isChallengeMode) {
          setIsNewChallengeTier(reachedTier > bestChallengeTier);
          setBestChallengeTier((prev) => Math.max(prev, reachedTier));
        } else {
          setIsNewChallengeTier(false);
        }
        return;
      }

      const newSnake = [newHead, ...body];
      setSnake(newSnake);

      if (ateFood) {
        scoreRef.current += 1;
        setScore(scoreRef.current);
        setEatenPulse(food);
        setFood(randomFood(newSnake));
        if (!isTrainingMode && !isChallengeMode) {
          speedRef.current = Math.max(MIN_SPEED, speedRef.current - SPEED_STEP);
          setSpeedMs(speedRef.current);
        }
      }
    }, speedRef.current);

    return () => window.clearTimeout(timer);
  }, [
    status,
    snake,
    food,
    highScore,
    bestTime,
    bestChallengeTier,
    isChallengeMode,
    isTrainingMode,
    setHighScore,
    setBestTime,
    setBestChallengeTier,
  ]);

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

      if (!isTrainingMode && elapsedRef.current % TIME_ACCELERATION_INTERVAL === 0) {
        speedRef.current = Math.max(MIN_SPEED, speedRef.current - TIME_ACCELERATION_STEP);
        setSpeedMs(speedRef.current);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [status, isTrainingMode]);

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

  const canChangeMode = status === "idle" || status === "gameover";
  const speedCellsPerSecond = (1000 / speedMs).toFixed(1);
  const currentTierIndex = reachedChallengeTierIndex(elapsedSeconds);
  const nextTier = CHALLENGE_TIERS[currentTierIndex + 1] ?? null;
  const challengeProgress = nextTier
    ? Math.min(100, (elapsedSeconds / nextTier.seconds) * 100)
    : 100;
  const bestTierLabel = bestChallengeTier >= 0 ? CHALLENGE_TIERS[bestChallengeTier]?.label : "-";

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
            ? "Modo treino: velocidade fixa para praticar rota e reflexo."
            : isChallengeMode
              ? "Modo desafio: sobreviva para conquistar medalhas por tempo."
              : "Modo competitivo: aceleração por comida e por tempo."}
        </p>
      </div>

      {isChallengeMode && (
        <div className="border border-polis-rule/20 bg-polis-paper-soft/25 px-3 py-2 text-xs text-polis-ink-soft">
          <div className="flex items-center justify-between">
            <span>
              Medalha atual: <strong className="text-polis-ink">{currentTierIndex >= 0 ? CHALLENGE_TIERS[currentTierIndex].label : "-"}</strong>
            </span>
            <span>
              Melhor: <strong className="text-polis-ink">{bestTierLabel}</strong>
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden bg-polis-ink/15">
            <div className="h-full bg-polis-gold-muted transition-[width] duration-300" style={{ width: `${challengeProgress}%` }} />
          </div>
          <p className="mt-1 text-[11px] uppercase tracking-[0.12em]">
            {nextTier ? `Próxima medalha (${nextTier.label}) em ${formatTime(nextTier.seconds)}` : "Meta máxima atingida"}
          </p>
        </div>
      )}

      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-polis-ink-soft">Guia Rápido</p>
        <ul className="space-y-1.5 text-xs leading-relaxed text-polis-ink-soft">
          <li>Evite as bordas e o próprio corpo da cobra.</li>
          <li>
            {isTrainingMode
              ? "No treino, o ritmo fica constante para focar na técnica."
              : isChallengeMode
                ? "No desafio, a velocidade aumenta com o tempo para testar sobrevivência."
                : "Cada comida aumenta os pontos e acelera o ritmo."}
          </li>
          {!isTrainingMode && <li>A aceleração por tempo acontece a cada 20 segundos.</li>}
          <li>Use setas (ou WASD), arraste na tela ou toque nos botões. Espaço, P ou Esc pausam.</li>
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
        <h1 className="font-serif text-lg font-bold text-polis-ink sm:text-xl">Jogo da Cobrinha</h1>
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
        <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col items-center gap-2">
          <div className="grid w-full max-w-md grid-cols-4 items-center gap-y-1 border-y border-polis-rule/30 px-2 py-1.5 text-xs text-polis-ink">
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
              Melhor <strong>{formatTime(bestTime)}</strong>
            </span>
          </div>

          <div ref={boardWrapRef} className="flex min-h-0 w-full flex-1 items-center justify-center">
            <div
              className={cn(
                "relative overflow-hidden border-2 border-polis-ink bg-polis-paper-soft touch-none transition-opacity",
                boardBox ? "opacity-100" : "opacity-0"
              )}
              style={{ width: boardBox?.width ?? 0, height: boardBox?.height ?? 0 }}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {snake.map((segment, index) => (
                <div
                  key={index}
                  className={cn("absolute transition-all", index === 0 ? "bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg" : "bg-emerald-500/90")}
                  style={{
                    width: `${100 / COLS}%`,
                    height: `${100 / ROWS}%`,
                    left: `${(segment.x / COLS) * 100}%`,
                    top: `${(segment.y / ROWS) * 100}%`,
                  }}
                />
              ))}

              <div
                className="absolute rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-md ring-2 ring-amber-300/50"
                style={{
                  width: `${100 / COLS}%`,
                  height: `${100 / ROWS}%`,
                  left: `${(food.x / COLS) * 100}%`,
                  top: `${(food.y / ROWS) * 100}%`,
                }}
              />

              {eatenPulse && (
                <div
                  className="motion-safe:animate-ping pointer-events-none absolute rounded-full bg-amber-400/70 shadow-lg"
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
                    status === "gameover"
                      ? `${isChallengeMode && currentTierIndex >= 0
                        ? `Medalha: ${CHALLENGE_TIERS[currentTierIndex].label}. `
                        : ""
                      }Você fez ${score} pontos em ${formatTime(elapsedSeconds)}.`
                      : undefined
                  }
                  actionLabel={status === "idle" ? "Jogar" : status === "paused" ? "Continuar" : "Jogar novamente"}
                  onAction={status === "paused" ? togglePause : startGame}
                  isNewHighScore={status === "gameover" && (isNewHighScore || isNewBestTime || isNewChallengeTier)}
                />
              )}
            </div>
          </div>

          <div className="flex w-full max-w-xs shrink-0 items-center justify-between gap-2 text-[11px] uppercase tracking-[0.1em] text-polis-ink-soft">
            <span>
              Ritmo <strong className="text-polis-ink">{speedCellsPerSecond} c/s</strong>
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => adjustSpeed(SPEED_STEP)}
                disabled={status !== "playing"}
                title="Diminuir velocidade"
                className="border border-polis-ink/30 px-2 py-1 font-semibold text-polis-ink transition-colors hover:border-polis-gold-muted hover:text-polis-gold-ink disabled:opacity-30"
              >
                ⬅
              </button>
              <button
                type="button"
                onClick={() => adjustSpeed(-SPEED_STEP)}
                disabled={status !== "playing"}
                title="Aumentar velocidade"
                className="border border-polis-ink/30 px-2 py-1 font-semibold text-polis-ink transition-colors hover:border-polis-gold-muted hover:text-polis-gold-ink disabled:opacity-30"
              >
                ➜
              </button>
            </div>
          </div>

          <div className="grid w-full max-w-[190px] shrink-0 grid-cols-3 gap-1.5">
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
              aria-label={status === "paused" ? "Continuar" : "Pausar"}
              className="flex aspect-square items-center justify-center border border-polis-ink/30 text-[9px] font-semibold uppercase tracking-wide text-polis-ink-soft transition-colors hover:border-polis-gold-muted hover:text-polis-gold-ink disabled:opacity-30"
            >
              {status === "paused" ? "▶" : "II"}
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
      className="flex aspect-square items-center justify-center border border-polis-ink/30 text-base text-polis-ink transition-colors hover:border-polis-gold-muted hover:text-polis-gold-ink"
    >
      {children}
    </button>
  );
}
