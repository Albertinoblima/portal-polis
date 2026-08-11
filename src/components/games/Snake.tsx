"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { cn, formatTime } from "@/lib/utils";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import { useElementSize } from "@/hooks/useElementSize";
import { useCompactLandscape } from "@/hooks/useCompactLandscape";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useCanvasRafLoop } from "@/hooks/useCanvasRafLoop";
import { GameOverlay } from "@/components/games/GameOverlay";
import { GameInfoDialog, GameSettingsButton } from "@/components/games/GameInfoDialog";
import {
  BOARD_RATIO,
  CHALLENGE_BEST_TIER_KEY,
  CHALLENGE_START_SPEED,
  CHALLENGE_TIERS,
  COLS,
  INITIAL_DIRECTION,
  INITIAL_FOOD,
  INITIAL_SNAKE,
  KEY_TO_DIRECTION,
  MIN_SPEED,
  MODE_KEY,
  OPPOSITE,
  ROWS,
  SPEED_STEP,
  START_SPEED,
  TIME_ACCELERATION_INTERVAL,
  TIME_ACCELERATION_STEP,
  TRAINING_SPEED_DEFAULT,
  TRAINING_SPEED_KEY,
  TRAINING_SPEED_MAX,
  TRAINING_SPEED_MIN,
  TRAINING_SPEED_STEP,
  highScoreKeyForMode,
  highTimeKeyForMode,
  randomFood,
  reachedChallengeTierIndex,
  stepSnake,
  type Direction,
  type Point,
  type SnakeMode,
  type Status,
} from "./snakeEngine";
import { drawBoard, resolveSnakeTheme, type SnakeTheme } from "./snakeRenderer";

/** Gestos de toque/mouse no tabuleiro (Pointer Events — substituem o D-pad
 *  virtual): um arrasto de pelo menos `SWIPE_STEP_PX` na direção dominante
 *  vira uma virada de direção. A base do arrasto é reposicionada a cada
 *  virada detectada (não só no pointerdown), então um arrasto contínuo e
 *  longo pode encadear várias viradas, de forma orgânica. */
const SWIPE_STEP_PX = 24;

export function Snake() {
  const [mode, setMode] = useLocalStorageState<SnakeMode>(MODE_KEY, "competitivo");
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Point>(INITIAL_FOOD);
  const [status, setStatus] = useState<Status>("idle");
  const [score, setScore] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [speedMs, setSpeedMs] = useState(START_SPEED);
  const [trainingSpeedMs, setTrainingSpeedMs] = useLocalStorageState(TRAINING_SPEED_KEY, TRAINING_SPEED_DEFAULT);
  const [highScore, setHighScore] = useLocalStorageState(highScoreKeyForMode(mode), 0);
  const [bestTime, setBestTime] = useLocalStorageState(highTimeKeyForMode(mode), 0);
  const [bestChallengeTier, setBestChallengeTier] = useLocalStorageState(CHALLENGE_BEST_TIER_KEY, -1);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [isNewBestTime, setIsNewBestTime] = useState(false);
  const [isNewChallengeTier, setIsNewChallengeTier] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  const directionRef = useRef<Direction>(INITIAL_DIRECTION);
  const nextDirectionRef = useRef<Direction>(INITIAL_DIRECTION);
  const speedRef = useRef(START_SPEED);
  const scoreRef = useRef(0);
  const elapsedRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<SnakeTheme | null>(null);
  // Instante (mesma base de tempo do loop de desenho) e casa da última
  // comida comida — só alimenta a animação do anel de pulso no Canvas (ver
  // snakeRenderer.ts), então fica numa ref (não em useState): mudar isto
  // não deve, por si só, causar um re-render do React, já que o Canvas já
  // redesenha continuamente a cada frame de qualquer forma.
  const eatenRef = useRef<{ at: number; point: Point } | null>(null);

  const [boardWrapRef, boardWrapSize] = useElementSize<HTMLDivElement>();
  const [desktopBoardWrapRef, desktopBoardWrapSize] = useElementSize<HTMLDivElement>();
  const isCompactLandscape = useCompactLandscape(true);
  // Decide qual dos dois layouts (mobile/tablet empilhado vs. desktop em 3
  // colunas: estatísticas | tabuleiro | modo+guia) efetivamente MONTA no
  // DOM — ver o mesmo raciocínio em Blocks.tsx (isDesktopLayout).
  const isDesktopLayout = useMediaQuery("(min-width: 1024px)");
  const isTrainingMode = mode === "treino";
  const isChallengeMode = mode === "desafio";

  const boardBox = useMemo(() => {
    const { width, height } = boardWrapSize;
    if (width <= 0 || height <= 0) return null;
    const w = Math.floor(Math.min(width, height * BOARD_RATIO));
    return { width: w, height: Math.floor(w / BOARD_RATIO) };
  }, [boardWrapSize]);

  const desktopBoardBox = useMemo(() => {
    const { width, height } = desktopBoardWrapSize;
    if (width <= 0 || height <= 0) return null;
    const w = Math.floor(Math.min(width, height * BOARD_RATIO));
    return { width: w, height: Math.floor(w / BOARD_RATIO) };
  }, [desktopBoardWrapSize]);

  const activeBoardBox = isDesktopLayout ? desktopBoardBox : boardBox;

  const startGame = useCallback(() => {
    setSnake(INITIAL_SNAKE);
    setFood(randomFood(INITIAL_SNAKE));
    setScore(0);
    setElapsedSeconds(0);
    elapsedRef.current = 0;
    scoreRef.current = 0;
    directionRef.current = INITIAL_DIRECTION;
    nextDirectionRef.current = INITIAL_DIRECTION;
    eatenRef.current = null;
    const initialSpeed = isTrainingMode ? trainingSpeedMs : isChallengeMode ? CHALLENGE_START_SPEED : START_SPEED;
    speedRef.current = initialSpeed;
    setSpeedMs(initialSpeed);
    setStatus("playing");
    setIsNewHighScore(false);
    setIsNewBestTime(false);
    setIsNewChallengeTier(false);
    containerRef.current?.focus();
  }, [isChallengeMode, isTrainingMode, trainingSpeedMs]);

  const queueDirection = useCallback((direction: Direction) => {
    if (status !== "playing") return;
    // Trava de eixo: só aceita mudanças ORTOGONAIS à direção que está em
    // execução agora (directionRef, não nextDirectionRef). Comparar contra
    // a direção já em execução — e não a última enfileirada — é o que
    // impede uma reversão de 180°: mesmo que o jogador dispare duas viradas
    // em sequência antes do próximo tick (ex.: cima, depois esquerda),
    // ambas são checadas contra a MESMA direção física atual, então uma
    // combinação que resultaria em "andar para trás sobre o próprio
    // pescoço" nunca passa as duas checagens ao mesmo tempo.
    if (direction === OPPOSITE[directionRef.current]) return;
    nextDirectionRef.current = direction;
  }, [status]);

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

  // No modo treino, o ritmo é sempre o que o jogador escolheu no controle
  // deslizante (ver renderModeSelector) — diferente dos outros modos, aqui
  // não há aceleração automática nenhuma. Chamado direto pelo `onChange` do
  // slider (não por um efeito): além de persistir a preferência, aplica a
  // mudança imediatamente em `speedRef`/`speedMs` sempre que uma partida já
  // está em andamento ou pausada — arrastar o controle no meio do jogo muda
  // o ritmo na hora, sem precisar reiniciar.
  const handleTrainingSpeedChange = useCallback(
    (newSpeedMs: number) => {
      setTrainingSpeedMs(newSpeedMs);
      if (status === "playing" || status === "paused") {
        speedRef.current = newSpeedMs;
        setSpeedMs(newSpeedMs);
      }
    },
    [status, setTrainingSpeedMs]
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

  // Loop de LÓGICA do jogo: avança um passo (tick) a cada `speedRef.current`
  // ms, controlando o ritmo de movimento da cobra. Deliberadamente
  // desacoplado do loop de DESENHO (useCanvasRafLoop abaixo, via
  // requestAnimationFrame) — o desenho roda a taxa de quadros do navegador
  // (suave, permite animar o pulso da comida continuamente), enquanto este
  // efeito só dispara nos instantes em que a cobra de fato se move.
  useEffect(() => {
    if (status !== "playing") return;

    const timer = window.setTimeout(() => {
      directionRef.current = nextDirectionRef.current;
      const result = stepSnake(snake, directionRef.current, food);

      if (result.collided) {
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

      setSnake(result.snake);

      if (result.ateFood) {
        scoreRef.current += 1;
        setScore(scoreRef.current);
        eatenRef.current = { at: performance.now(), point: food };
        setFood(randomFood(result.snake));
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

  // Estado mais recente para o loop de DESENHO ler a cada frame — atualizado
  // a cada render (não a cada frame de requestAnimationFrame). O loop em si
  // (useCanvasRafLoop) só reinicia quando o TAMANHO em pixels do canvas
  // muda; os dados mais recentes chegam através desta ref, então o desenho
  // nunca fica um quadro atrasado.
  const boardDrawStateRef = useRef({ snake, food });
  useEffect(() => {
    boardDrawStateRef.current = { snake, food };
  });

  useEffect(() => {
    if (containerRef.current) themeRef.current = resolveSnakeTheme(containerRef.current);
  });

  const drawBoardFrame = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (!activeBoardBox || !themeRef.current) return;
      const cellSize = activeBoardBox.width / COLS;
      const { snake: currentSnake, food: currentFood } = boardDrawStateRef.current;
      const eaten = eatenRef.current;
      drawBoard(ctx, {
        snake: currentSnake,
        food: currentFood,
        cellSize,
        theme: themeRef.current,
        timeMs: performance.now(),
        eatenAtMs: eaten?.at ?? null,
        eatenAtPoint: eaten?.point ?? null,
      });
    },
    [activeBoardBox]
  );
  const boardCanvasRef = useCanvasRafLoop(activeBoardBox, drawBoardFrame);

  // Controle unificado por Pointer Events no próprio tabuleiro (substitui o
  // D-pad virtual e funciona igual para mouse, caneta e toque): arrastar
  // acompanhando qualquer direção vira a cobra assim que o deslocamento
  // supera `SWIPE_STEP_PX`, podendo encadear várias viradas num arrasto
  // contínuo (ver comentário na constante acima).
  const pointerStateRef = useRef<{ x: number; y: number } | null>(null);

  function handleBoardPointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerStateRef.current = { x: event.clientX, y: event.clientY };
  }

  function handleBoardPointerMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    const state = pointerStateRef.current;
    if (!state || status !== "playing") return;
    const dx = event.clientX - state.x;
    const dy = event.clientY - state.y;

    if (Math.abs(dx) < SWIPE_STEP_PX && Math.abs(dy) < SWIPE_STEP_PX) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      queueDirection(dx > 0 ? "RIGHT" : "LEFT");
      state.x = event.clientX;
      state.y = event.clientY;
    } else {
      queueDirection(dy > 0 ? "DOWN" : "UP");
      state.x = event.clientX;
      state.y = event.clientY;
    }
  }

  function handleBoardPointerUp() {
    pointerStateRef.current = null;
  }

  function handleBoardPointerCancel() {
    pointerStateRef.current = null;
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
  // Antes do primeiro "Jogar" (ou depois de um fim de jogo), `speedMs` ainda
  // guarda o ritmo da ÚLTIMA partida — no treino, mostrar o ritmo que será
  // usado na PRÓXIMA (trainingSpeedMs) é mais útil para calibrar antes de
  // começar. Durante o jogo/pausa, `speedMs` já reflete qualquer ajuste
  // feito no slider (ver handleTrainingSpeedChange), então os dois valores
  // coincidem.
  const displaySpeedMs = isTrainingMode && canChangeMode ? trainingSpeedMs : speedMs;
  const speedCellsPerSecond = (1000 / displaySpeedMs).toFixed(1);
  const currentTierIndex = reachedChallengeTierIndex(elapsedSeconds);
  const nextTier = CHALLENGE_TIERS[currentTierIndex + 1] ?? null;
  const challengeProgress = nextTier ? Math.min(100, (elapsedSeconds / nextTier.seconds) * 100) : 100;
  const bestTierLabel = bestChallengeTier >= 0 ? CHALLENGE_TIERS[bestChallengeTier]?.label : "-";

  function renderBoardSurface(box: { width: number; height: number } | null) {
    return (
      <div
        className={cn(
          "shrink-0 border-2 border-polis-ink bg-polis-ink p-px transition-opacity",
          box ? "opacity-100" : "opacity-0"
        )}
        style={{ width: (box?.width ?? 0) + 2, height: (box?.height ?? 0) + 2 }}
      >
        <div className="relative h-full w-full overflow-hidden">
          <canvas
            ref={boardCanvasRef}
            role="img"
            aria-label={`Tabuleiro do Jogo da Cobrinha, ${score} pontos em ${formatTime(elapsedSeconds)}`}
            className="block h-full w-full touch-none select-none"
            style={{ aspectRatio: `${COLS} / ${ROWS}` }}
            onPointerDown={handleBoardPointerDown}
            onPointerMove={handleBoardPointerMove}
            onPointerUp={handleBoardPointerUp}
            onPointerCancel={handleBoardPointerCancel}
          />

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
    );
  }

  function renderPaceControls(className?: string) {
    // No modo treino o ritmo é controlado pelo slider em "Configurações e
    // Guia" (ver renderModeSelector) — os botões de +/- ficam reservados
    // para competitivo/desafio, onde não existe um controle equivalente.
    if (isTrainingMode) return null;
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
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
    );
  }

  function renderPauseButton(className?: string) {
    return (
      <button
        type="button"
        onClick={togglePause}
        disabled={status === "idle" || status === "gameover"}
        className={cn(
          "border border-polis-ink/30 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-polis-ink transition-colors hover:border-polis-gold-muted hover:text-polis-gold-ink disabled:opacity-30",
          className
        )}
      >
        {status === "paused" ? "Continuar" : "Pausar"}
      </button>
    );
  }

  function renderModeSelector() {
    return (
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
            ? "Modo treino: você define o ritmo abaixo, e pode ajustá-lo a qualquer momento — mesmo com o jogo em andamento."
            : isChallengeMode
              ? "Modo desafio: sobreviva para conquistar medalhas por tempo."
              : "Modo competitivo: aceleração por comida e por tempo."}
        </p>

        {isTrainingMode && (
          <div className="mt-3">
            <label
              htmlFor="cobrinha-velocidade-treino"
              className="flex items-center justify-between text-[11px] uppercase tracking-[0.1em] text-polis-ink-soft"
            >
              <span>Velocidade</span>
              <span className="text-polis-ink">{(1000 / trainingSpeedMs).toFixed(1)} c/s</span>
            </label>
            <input
              id="cobrinha-velocidade-treino"
              type="range"
              min={TRAINING_SPEED_MIN}
              max={TRAINING_SPEED_MAX}
              step={TRAINING_SPEED_STEP}
              // Slider invertido de propósito: arrastar para a direita deve
              // significar "mais rápido" (ritmo maior), mas velocidade aqui é
              // medida em ms por passo — quanto MENOR o ms, mais rápido. Sem
              // inverter, arrastar para a direita deixaria a cobra mais
              // lenta, o oposto do que o rótulo "Lento → Rápido" sugere
              // (mesmo truque de Blocks.tsx). Fica sempre habilitado —
              // inclusive jogando ou pausado — para o jogador poder recalibrar
              // o ritmo em tempo real, não só antes de começar.
              value={TRAINING_SPEED_MAX + TRAINING_SPEED_MIN - trainingSpeedMs}
              onChange={(event) => handleTrainingSpeedChange(TRAINING_SPEED_MAX + TRAINING_SPEED_MIN - Number(event.target.value))}
              className="mt-1.5 w-full accent-polis-gold-muted"
            />
            <div className="mt-0.5 flex justify-between text-[10px] uppercase tracking-wide text-polis-ink-soft/70">
              <span>Lento</span>
              <span>Rápido</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderChallengeCard() {
    if (!isChallengeMode) return null;
    return (
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
    );
  }

  function renderGuide() {
    return (
      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-polis-ink-soft">Guia Rápido</p>
        <ul className="space-y-1.5 text-xs leading-relaxed text-polis-ink-soft">
          <li>Evite as bordas e o próprio corpo da cobra.</li>
          <li>
            {isTrainingMode
              ? "No treino, você controla o ritmo pelo controle deslizante em Modo — pause a qualquer momento para ajustar com calma."
              : isChallengeMode
                ? "No desafio, a velocidade aumenta com o tempo para testar sobrevivência."
                : "Cada comida aumenta os pontos e acelera o ritmo."}
          </li>
          {!isTrainingMode && <li>A aceleração por tempo acontece a cada 20 segundos.</li>}
          <li>
            <strong className="text-polis-ink">Desktop:</strong> Setas (ou WASD) mudam a direção; Espaço, P ou Esc pausam.
          </li>
          <li>
            <strong className="text-polis-ink">Mobile/Mouse:</strong> Arraste sobre o tabuleiro na direção desejada.
          </li>
        </ul>
      </div>
    );
  }

  const settingsContent = (
    <div className="flex flex-col gap-4 text-sm text-polis-ink">
      {renderModeSelector()}
      {renderChallengeCard()}
      {renderGuide()}
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
          {!isDesktopLayout && <GameSettingsButton onClick={openInfo} />}
        </div>
      </div>

      {/* Layout mobile/tablet (< lg) — duas variantes, sem D-pad em nenhuma
          delas (controle é por gesto no próprio tabuleiro, via Pointer
          Events). Montado condicionalmente (não só escondido via CSS) — ver
          isDesktopLayout acima, mesmo raciocínio de Blocks.tsx. */}
      {!isDesktopLayout && isCompactLandscape && (
        // Paisagem compacta (celular deitado): tabuleiro e um painel lateral
        // de estatísticas/controles ficam lado a lado, para caber sem
        // rolagem numa tela de pouca altura (ver useCompactLandscape — este
        // arranjo já corrigiu um overflow real em telas curtas).
        <div className="flex min-h-0 w-full min-w-0 flex-1 flex-row items-stretch justify-center gap-4">
          <div ref={boardWrapRef} className="flex min-h-0 w-auto min-w-0 flex-1 items-center justify-center">
            {renderBoardSurface(boardBox)}
          </div>

          <div className="flex h-full w-[190px] shrink-0 flex-col items-center justify-center gap-2 overflow-y-auto">
            <div className="grid w-full grid-cols-2 items-center gap-x-1 gap-y-1 border-y border-polis-rule/30 py-1.5 text-[10px] text-polis-ink">
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

            <div className="flex w-full shrink-0 flex-col items-stretch gap-1.5 text-[11px] uppercase tracking-[0.1em] text-polis-ink-soft">
              <span>
                Ritmo <strong className="text-polis-ink">{speedCellsPerSecond} c/s</strong>
              </span>
              {renderPaceControls()}
            </div>

            {renderPauseButton("w-full")}
          </div>
        </div>
      )}

      {!isDesktopLayout && !isCompactLandscape && (
        // Retrato (a maioria dos celulares): cabeçalho compacto de
        // estatísticas no topo, tabuleiro central maximizado logo abaixo, e
        // ritmo/pausa num rodapé leve — como pedido: "o Canvas deve ser o
        // elemento central superior, estatísticas num cabeçalho compacto".
        <div className="flex min-h-0 w-full flex-1 flex-col items-center gap-2">
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

          <div ref={boardWrapRef} className="flex min-h-0 w-full min-w-0 flex-1 items-center justify-center">
            {renderBoardSurface(boardBox)}
          </div>

          <div className="flex w-full max-w-xs shrink-0 items-center justify-between gap-2 text-[11px] uppercase tracking-[0.1em] text-polis-ink-soft">
            <span>
              Ritmo <strong className="text-polis-ink">{speedCellsPerSecond} c/s</strong>
            </span>
            {renderPaceControls()}
          </div>

          {renderPauseButton("w-full max-w-xs")}
        </div>
      )}

      {/* Layout desktop (lg+): grade CSS de 3 colunas — estatísticas |
          tabuleiro maximizado | modo + guia. Sem D-pad: no desktop o
          teclado já cobre tudo. */}
      {isDesktopLayout && (
        <div className="grid min-h-0 flex-1 lg:grid-cols-[200px_1fr_260px] lg:gap-8">
          <div className="flex min-h-0 flex-col gap-4 overflow-y-auto border-r border-polis-rule/20 pr-6">
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-polis-ink-soft">Estatísticas</p>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                <dt className="text-polis-ink-soft">Pontos</dt>
                <dd className="text-right font-semibold text-polis-ink">{score}</dd>
                <dt className="text-polis-ink-soft">Tempo</dt>
                <dd className="text-right font-semibold text-polis-ink">{formatTime(elapsedSeconds)}</dd>
              </dl>
            </div>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1 border-t border-polis-rule/20 pt-3 text-xs">
              <dt className="text-polis-ink-soft">Recorde</dt>
              <dd className="text-right font-semibold text-polis-ink">{highScore}</dd>
              <dt className="text-polis-ink-soft">Melhor tempo</dt>
              <dd className="text-right font-semibold text-polis-ink">{formatTime(bestTime)}</dd>
            </dl>
            <div className="flex items-center justify-between border-t border-polis-rule/20 pt-3 text-[11px] uppercase tracking-[0.1em] text-polis-ink-soft">
              <span>Ritmo</span>
              <strong className="text-polis-ink">{speedCellsPerSecond} c/s</strong>
            </div>
            {renderPaceControls()}
            {renderPauseButton()}
          </div>

          {/* min-w-0 é essencial aqui, não decorativo: sem ele, um item de
              grid CSS nunca encolhe abaixo do min-content dos filhos, e o
              filho direto (o quadro do tabuleiro) tem largura FIXA em px,
              vinda da própria medição deste elemento via ResizeObserver
              (useElementSize). Isso cria um ciclo — mede X, aplica X+2px no
              filho, o filho "empurra" o item para X+2px, próxima medição lê
              X+2px, aplica X+4px... — que faz a coluna central crescer sem
              parar e vazar para fora da grade de 3 colunas a cada poucos
              frames. min-w-0 quebra o ciclo: o item passa a respeitar
              apenas o espaço que a grade (1fr) de fato reservou pra ele. */}
          <div ref={desktopBoardWrapRef} className="flex min-h-0 min-w-0 items-center justify-center">
            {renderBoardSurface(desktopBoardBox)}
          </div>

          <div className="flex min-h-0 flex-col gap-4 overflow-y-auto border-l border-polis-rule/20 pl-6">
            {renderModeSelector()}
            {renderChallengeCard()}
            {renderGuide()}
          </div>
        </div>
      )}

      <GameInfoDialog open={infoOpen} onOpenChange={setInfoOpen} title="Configurações e Guia">
        {settingsContent}
      </GameInfoDialog>
    </div>
  );
}
