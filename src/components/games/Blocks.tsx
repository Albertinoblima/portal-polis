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
  CHALLENGE_START_SPEED,
  CHALLENGE_TIERS,
  CHALLENGE_TIME_ACCELERATION_INTERVAL,
  COLS,
  LINES_PER_LEVEL,
  LINE_SCORE,
  ROWS,
  START_SPEED,
  bestLinesKeyForMode,
  canPlace,
  challengeSpeedAfterClear,
  challengeSpeedAfterTime,
  competitiveSpeedForLevel,
  dropToLanding,
  emptyBoard,
  highScoreKeyForMode,
  lockPiece,
  pieceCells,
  reachedChallengeTierIndex,
  spawnPosition,
  takeFromBag,
  tryRotatePiece,
  type BlocksMode,
  type BoardMatrix,
  type PieceState,
  type PieceType,
  type Status,
} from "./blocksEngine";
import { drawBoard, drawNextPreview, resolveBlocksTheme, type BlocksTheme } from "./blocksRenderer";

const MODE_KEY = "polis:blocos:modo";
const CHALLENGE_BEST_TIER_KEY = "polis:blocos:desafio:melhor-tier";

/** Modo treino: velocidade fixa e ajustável pelo jogador (ms por queda de 1 linha). */
const TRAINING_SPEED_KEY = "polis:blocos:treino:velocidade";
const TRAINING_SPEED_MIN = 200;
const TRAINING_SPEED_MAX = 1100;
const TRAINING_SPEED_STEP = 25;
const TRAINING_SPEED_DEFAULT = 650;

/** DAS (Delayed Auto-Shift) e ARR (Auto-Repeat Rate) — padrão de Tetris
 *  moderno: o primeiro movimento é imediato ao pressionar, e só depois de
 *  `DAS_MS` segurando é que a peça passa a se repetir a cada `ARR_MS`. Sem
 *  isso, mover repetidamente depende do auto-repeat do sistema operacional
 *  (inconsistente entre navegadores/SO e geralmente lento demais para Tetris). */
const DAS_MS = 170;
const ARR_MS = 45;
const SOFT_DROP_ARR_MS = 35;

/** Gestos de toque no tabuleiro (substituem o D-pad virtual): arrastar move a
 *  peça acompanhando o dedo, toque rápido sem deslocamento gira, e um swipe
 *  rápido para cima derruba na hora. */
const SWIPE_STEP_PX = 24;
const TAP_SLOP_PX = 12;
const HARD_DROP_SWIPE_DIST_PX = 70;
const HARD_DROP_SWIPE_MAX_MS = 260;

/** Controlador genérico de "segurar para repetir" (DAS/ARR): a primeira
 *  chamada de `action` é imediata; se ainda segurando após `DAS_MS`, passa a
 *  repetir a cada `arrMs` até `stop()`. Usado tanto pelo teclado (setas
 *  seguradas) quanto pelos gestos de toque. */
function useHeldRepeat() {
  const dasRef = useRef<number | null>(null);
  const arrRef = useRef<number | null>(null);
  const tokenRef = useRef<symbol | null>(null);

  const stop = useCallback(() => {
    if (dasRef.current !== null) {
      window.clearTimeout(dasRef.current);
      dasRef.current = null;
    }
    if (arrRef.current !== null) {
      window.clearInterval(arrRef.current);
      arrRef.current = null;
    }
    tokenRef.current = null;
  }, []);

  const start = useCallback(
    (action: () => void, arrMs: number) => {
      stop();
      const token = Symbol();
      tokenRef.current = token;
      action();
      dasRef.current = window.setTimeout(() => {
        if (tokenRef.current !== token) return;
        arrRef.current = window.setInterval(action, arrMs);
      }, DAS_MS);
    },
    [stop]
  );

  useEffect(() => stop, [stop]);

  return { start, stop };
}

export function Blocks() {
  const [mode, setMode] = useLocalStorageState<BlocksMode>(MODE_KEY, "competitivo");
  const [trainingSpeedMs, setTrainingSpeedMs] = useLocalStorageState(TRAINING_SPEED_KEY, TRAINING_SPEED_DEFAULT);
  const [board, setBoard] = useState<BoardMatrix>(() => emptyBoard());
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
  const themeRef = useRef<BlocksTheme | null>(null);

  // Medidos juntos (não só o board isolado): o tabuleiro dos Blocos é alto e
  // estreito, então sobra muita largura no wrap — se centralizássemos só o
  // board dentro dela, o painel "Próxima" (que fica ao lado) ia parar
  // encostado na borda direita, longe do tabuleiro. Medindo a fileira toda e
  // descontando a largura real do painel, o conjunto board+"Próxima" fica
  // centralizado como um bloco só. Só usado no layout mobile/tablet — no
  // desktop o board tem coluna própria (ver desktopBoardWrapRef).
  const [rowRef, rowSize] = useElementSize<HTMLDivElement>();
  const [nextPanelRef, nextPanelSize] = useElementSize<HTMLDivElement>();
  const [desktopBoardWrapRef, desktopBoardWrapSize] = useElementSize<HTMLDivElement>();
  const isCompactLandscape = useCompactLandscape(true);
  // Decide qual dos dois layouts (mobile/tablet empilhado vs. desktop em 3
  // colunas) efetivamente MONTA no DOM — não basta escondê-los via classe
  // `lg:hidden`/`hidden lg:grid`: os dois ficariam presentes ao mesmo tempo
  // (só um visível), duplicando textos como "Próxima"/"Pausado" e quebrando
  // buscas por texto (inclusive nos testes e2e, que não filtram por
  // visibilidade). 1024px casa com o breakpoint `lg` do Tailwind e com
  // DESKTOP_BREAKPOINT usado no restante do site (ver Newspaper.tsx).
  const isDesktopLayout = useMediaQuery("(min-width: 1024px)");
  const isTrainingMode = mode === "treino";
  const isChallengeMode = mode === "desafio";

  const ROW_GAP_PX = 12;
  const boardBox = useMemo(() => {
    const { width, height } = rowSize;
    if (width <= 0 || height <= 0) return null;
    const reserved = nextPanelSize.width > 0 ? nextPanelSize.width + ROW_GAP_PX : 0;
    const availableWidth = Math.max(width - reserved, 0);
    const w = Math.floor(Math.min(availableWidth, height * BOARD_RATIO));
    return { width: w, height: Math.floor(w / BOARD_RATIO) };
  }, [rowSize, nextPanelSize]);

  // Layout desktop (lg+): o board ocupa uma coluna própria da grade de 3
  // colunas, sem disputar espaço com "Próxima"/estatísticas — por isso aqui
  // não precisa descontar largura de painel nenhum, só encaixar no maior
  // quadrado 10:20 que cabe na coluna central.
  const desktopBoardBox = useMemo(() => {
    const { width, height } = desktopBoardWrapSize;
    if (width <= 0 || height <= 0) return null;
    const w = Math.floor(Math.min(width, height * BOARD_RATIO));
    return { width: w, height: Math.floor(w / BOARD_RATIO) };
  }, [desktopBoardWrapSize]);

  const activeBoardBox = isDesktopLayout ? desktopBoardBox : boardBox;

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
    [isChallengeMode, highScore, bestLines, bestChallengeTier, setHighScore, setBestLines, setBestChallengeTier]
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
          speedRef.current = competitiveSpeedForLevel(newLevel);
          setSpeedMs(speedRef.current);
        }
        if (isChallengeMode) {
          speedRef.current = challengeSpeedAfterClear(speedRef.current, result.cleared);
          setSpeedMs(speedRef.current);
        }
      }
      if (newScore !== score) setScore(newScore);

      const type = nextType ?? takeFromBag(bagRef);
      const preview = takeFromBag(bagRef);
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
    const initialSpeed = isTrainingMode ? trainingSpeedMs : isChallengeMode ? CHALLENGE_START_SPEED : START_SPEED;
    speedRef.current = initialSpeed;
    setSpeedMs(initialSpeed);

    const type = takeFromBag(bagRef);
    const preview = takeFromBag(bagRef);
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
    const rotated = tryRotatePiece(board, current);
    if (rotated) setCurrent(rotated);
  }, [status, current, board]);

  const hardDrop = useCallback(() => {
    if (status !== "playing" || !current) return;
    const landed = dropToLanding(board, current);
    const distance = landed.row - current.row;
    advanceAfterLock(landed, distance * 2);
  }, [status, current, board, advanceAfterLock]);

  // Referências "sempre atuais" para as ações usadas dentro de repetições
  // (DAS/ARR) e gestos de toque: `tryMove`/`tryRotate`/`hardDrop` são
  // recriadas a cada jogada (dependem de `board`/`current`), mas o
  // temporizador do useHeldRepeat só é (re)criado quando o jogador
  // pressiona — sem isto, segurar uma tecla continuaria repetindo a
  // jogada com o tabuleiro "congelado" do momento em que começou a segurar.
  const latestRef = useRef({ tryMove, tryRotate, hardDrop });
  useEffect(() => {
    latestRef.current = { tryMove, tryRotate, hardDrop };
  });

  const horizontalRepeat = useHeldRepeat();
  const softDropRepeat = useHeldRepeat();
  const heldDirRef = useRef<-1 | 0 | 1>(0);

  const startHorizontal = useCallback(
    (dir: -1 | 1) => {
      heldDirRef.current = dir;
      horizontalRepeat.start(() => latestRef.current.tryMove(0, dir), ARR_MS);
    },
    [horizontalRepeat]
  );
  const stopHorizontal = useCallback(
    (dir: -1 | 1) => {
      if (heldDirRef.current !== dir) return;
      heldDirRef.current = 0;
      horizontalRepeat.stop();
    },
    [horizontalRepeat]
  );
  const startSoftDrop = useCallback(() => {
    softDropRepeat.start(() => latestRef.current.tryMove(1, 0), SOFT_DROP_ARR_MS);
  }, [softDropRepeat]);

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
        speedRef.current = challengeSpeedAfterTime(speedRef.current);
        setSpeedMs(speedRef.current);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [status, isChallengeMode]);

  useEffect(() => {
    // Sempre que o jogo sai de "playing" (pausa, fim de jogo), cancela
    // qualquer DAS/ARR em andamento — sem isto, pausar com uma seta
    // segurada deixava o repeat "fantasma" agendado, e a peça pulava
    // sozinha assim que o jogo despausasse.
    if (status !== "playing") {
      horizontalRepeat.stop();
      softDropRepeat.stop();
      heldDirRef.current = 0;
    }
  }, [status, horizontalRepeat, softDropRepeat]);

  useEffect(() => {
    // Escuta no contêiner do jogo (não em `window`) para que os controles não
    // "vazem" para outros campos da página — ver o mesmo raciocínio em Snake.tsx.
    const container = containerRef.current;
    if (!container) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "p" || event.key === "P" || event.key === "Escape") {
        if (event.repeat) return;
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
          if (!event.repeat && heldDirRef.current !== -1) startHorizontal(-1);
          break;
        case "ArrowRight":
        case "d":
        case "D":
          event.preventDefault();
          if (!event.repeat && heldDirRef.current !== 1) startHorizontal(1);
          break;
        case "ArrowDown":
        case "s":
        case "S":
          event.preventDefault();
          if (!event.repeat) startSoftDrop();
          break;
        case "ArrowUp":
        case "w":
        case "W":
          if (!event.repeat) {
            event.preventDefault();
            tryRotate();
          }
          break;
        case " ":
          if (!event.repeat) {
            event.preventDefault();
            hardDrop();
          }
          break;
      }
    }

    function handleKeyUp(event: KeyboardEvent) {
      switch (event.key) {
        case "ArrowLeft":
        case "a":
        case "A":
          stopHorizontal(-1);
          break;
        case "ArrowRight":
        case "d":
        case "D":
          stopHorizontal(1);
          break;
        case "ArrowDown":
        case "s":
        case "S":
          softDropRepeat.stop();
          break;
      }
    }

    container.addEventListener("keydown", handleKeyDown);
    container.addEventListener("keyup", handleKeyUp);
    return () => {
      container.removeEventListener("keydown", handleKeyDown);
      container.removeEventListener("keyup", handleKeyUp);
    };
  }, [status, togglePause, tryRotate, hardDrop, startHorizontal, stopHorizontal, startSoftDrop, softDropRepeat]);

  useEffect(() => {
    if (!clearFlash) return;
    const timer = window.setTimeout(() => setClearFlash(false), 250);
    return () => window.clearTimeout(timer);
  }, [clearFlash]);

  const ghostCells = useMemo(() => {
    if (!current || status !== "playing") return [];
    return pieceCells(dropToLanding(board, current));
  }, [current, board, status]);

  // Controle unificado por Pointer Events no próprio tabuleiro (substituem
  // o D-pad virtual e funcionam igual para mouse, caneta e toque — ao
  // contrário de Touch Events, que só disparam para dedo/toque real e
  // deixam desktop-sem-touch sem forma nenhuma de jogar sem teclado):
  // arrastar move a peça acompanhando o ponteiro (um passo a cada
  // `SWIPE_STEP_PX` percorridos), clique/toque rápido sem deslocamento
  // gira, e um arrasto rápido para cima derruba na hora.
  const pointerStateRef = useRef<{ x: number; y: number; startX: number; startY: number; startTime: number; moved: boolean } | null>(null);

  function handleBoardPointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    // Captura o ponteiro: garante que os eventos de move/up continuem
    // chegando a este elemento mesmo se o cursor sair da área do canvas
    // durante o arrasto (comportamento padrão de drag baseado em Pointer
    // Events).
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerStateRef.current = { x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, startTime: Date.now(), moved: false };
  }

  function handleBoardPointerMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    const state = pointerStateRef.current;
    if (!state || status !== "playing") return;
    const dx = event.clientX - state.x;
    const dy = event.clientY - state.y;

    if (Math.abs(dx) >= SWIPE_STEP_PX) {
      tryMove(0, dx > 0 ? 1 : -1);
      state.x += dx > 0 ? SWIPE_STEP_PX : -SWIPE_STEP_PX;
      state.moved = true;
    }
    if (dy >= SWIPE_STEP_PX) {
      tryMove(1, 0);
      state.y += SWIPE_STEP_PX;
      state.moved = true;
    }
  }

  function handleBoardPointerUp(event: ReactPointerEvent<HTMLCanvasElement>) {
    const state = pointerStateRef.current;
    pointerStateRef.current = null;
    if (!state || status !== "playing") return;

    const totalDx = event.clientX - state.startX;
    const totalDy = event.clientY - state.startY;
    const elapsedMs = Date.now() - state.startTime;

    if (!state.moved && Math.abs(totalDx) < TAP_SLOP_PX && Math.abs(totalDy) < TAP_SLOP_PX) {
      tryRotate();
      return;
    }
    // Arrasto rápido para baixo = queda instantânea (ver Guia Rápido). Um
    // arrasto lento para baixo já move a peça uma casa por vez durante o
    // próprio movimento (handleBoardPointerMove) — isto só entra quando o
    // gesto é rápido e comprido o bastante para ser claramente intencional.
    if (totalDy > HARD_DROP_SWIPE_DIST_PX && elapsedMs < HARD_DROP_SWIPE_MAX_MS) {
      hardDrop();
    }
  }

  function handleBoardPointerCancel() {
    pointerStateRef.current = null;
  }

  const overlayMessage =
    status === "idle" ? "Pronto para jogar?" : status === "paused" ? "Pausado" : status === "gameover" ? "Fim de jogo!" : null;
  const canChangeMode = status === "idle" || status === "gameover";
  const speedCellsPerSecond = (1000 / speedMs).toFixed(1);
  const challengeTierIndex = reachedChallengeTierIndex(lines);
  const bestTierLabel = bestChallengeTier >= 0 ? CHALLENGE_TIERS[bestChallengeTier]?.label : "-";
  const nextTier = CHALLENGE_TIERS[challengeTierIndex + 1] ?? null;
  const challengeProgress = nextTier ? Math.min(100, (lines / nextTier.lines) * 100) : 100;

  // Referência "sempre atual" com tudo que o loop de desenho do Canvas
  // precisa — atualizada a cada render (não a cada frame). O loop em si (ver
  // useCanvasRafLoop) só reinicia quando o TAMANHO em pixels muda; a cor/
  // conteúdo mais recentes chegam através desta ref a cada frame de
  // requestAnimationFrame, então nunca fica desenhando um quadro obsoleto.
  const boardDrawStateRef = useRef({ board, current, ghostCells, clearFlash });
  useEffect(() => {
    boardDrawStateRef.current = { board, current, ghostCells, clearFlash };
  });

  useEffect(() => {
    if (containerRef.current) themeRef.current = resolveBlocksTheme(containerRef.current);
  });

  const drawBoardFrame = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (!activeBoardBox || !themeRef.current) return;
      const cellSize = activeBoardBox.width / COLS;
      const { board: b, current: c, ghostCells: g, clearFlash: f } = boardDrawStateRef.current;
      drawBoard(ctx, { board: b, current: c, ghostCells: g, clearFlash: f, cellSize, theme: themeRef.current });
    },
    [activeBoardBox]
  );
  const boardCanvasRef = useCanvasRafLoop(activeBoardBox, drawBoardFrame);

  const NEXT_PREVIEW_CELL_PX = 14;
  const nextPreviewBox = useMemo(() => ({ width: NEXT_PREVIEW_CELL_PX * 4, height: NEXT_PREVIEW_CELL_PX * 4 }), []);
  const drawNextFrame = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (!themeRef.current) return;
      drawNextPreview(ctx, nextType, NEXT_PREVIEW_CELL_PX, themeRef.current);
    },
    [nextType]
  );
  const nextCanvasRef = useCanvasRafLoop(nextPreviewBox, drawNextFrame);

  function renderBoardSurface(box: { width: number; height: number } | null) {
    return (
      <div
        className={cn(
          "shrink-0 border-2 bg-polis-ink p-px transition-colors duration-200",
          clearFlash ? "border-polis-gold" : "border-polis-ink",
          box ? "opacity-100" : "opacity-0"
        )}
        style={{ width: (box?.width ?? 0) + 2, height: (box?.height ?? 0) + 2 }}
      >
        <div className="relative h-full w-full overflow-hidden">
          <canvas
            ref={boardCanvasRef}
            role="img"
            aria-label={`Tabuleiro do Jogo dos Blocos, ${score} pontos, nível ${level}`}
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
    );
  }

  function renderNextPreview() {
    return (
      <div className="flex flex-col items-center gap-1.5">
        <p className="text-[10px] uppercase tracking-wide text-polis-ink-soft">Próxima</p>
        <div className="flex h-14 w-14 items-center justify-center border-2 border-polis-ink/20 bg-polis-paper-soft">
          <canvas
            ref={nextCanvasRef}
            role="img"
            aria-label="Próxima peça"
            width={nextPreviewBox.width}
            height={nextPreviewBox.height}
            style={{ width: nextPreviewBox.width, height: nextPreviewBox.height }}
          />
        </div>
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
            ? "Modo treino: você define o ritmo abaixo, fixo durante a partida."
            : isChallengeMode
              ? "Modo desafio: metas de linhas com aceleração temporal."
              : "Modo competitivo: progressão clássica por nível."}
        </p>

        {isTrainingMode && (
          <div className="mt-3">
            <label htmlFor="blocos-velocidade-treino" className="flex items-center justify-between text-[11px] uppercase tracking-[0.1em] text-polis-ink-soft">
              <span>Velocidade</span>
              <span className="text-polis-ink">{(1000 / trainingSpeedMs).toFixed(1)} c/s</span>
            </label>
            <input
              id="blocos-velocidade-treino"
              type="range"
              disabled={!canChangeMode}
              min={TRAINING_SPEED_MIN}
              max={TRAINING_SPEED_MAX}
              step={TRAINING_SPEED_STEP}
              // Slider invertido de propósito: arrastar para a direita deve
              // significar "mais rápido" (ritmo maior), mas velocidade aqui é
              // medida em ms por queda — quanto MENOR o ms, mais rápido. Sem
              // inverter, arrastar para a direita deixaria o jogo mais lento,
              // o oposto do que o rótulo "Lento → Rápido" sugere.
              value={TRAINING_SPEED_MAX + TRAINING_SPEED_MIN - trainingSpeedMs}
              onChange={(event) => setTrainingSpeedMs(TRAINING_SPEED_MAX + TRAINING_SPEED_MIN - Number(event.target.value))}
              className="mt-1.5 w-full accent-polis-gold-muted disabled:opacity-40"
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
    );
  }

  function renderGuide() {
    return (
      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-polis-ink-soft">Guia Rápido</p>
        <ul className="space-y-1.5 text-xs leading-relaxed text-polis-ink-soft">
          <li>
            <strong className="text-polis-ink">Desktop:</strong> Setas (ou WASD) movem e giram; Segure para repetir;
            Espaço derruba na hora; P pausa.
          </li>
          <li>
            <strong className="text-polis-ink">Mobile/Mouse:</strong> Arraste para os lados para mover; Toque simples
            para girar; Arraste rápido para baixo para derrubar.
          </li>
        </ul>
      </div>
    );
  }

  const settingsContent = (
    <div className="flex flex-col gap-4 text-sm text-polis-ink">
      {renderModeSelector()}
      {renderChallengeCard()}
      <dl className="grid grid-cols-2 gap-x-2 gap-y-1 border-y border-polis-rule/20 py-2 text-xs">
        <dt className="text-polis-ink-soft">Recorde</dt>
        <dd className="text-right font-semibold">{highScore}</dd>
        <dt className="text-polis-ink-soft">Melhor linhas</dt>
        <dd className="text-right font-semibold">{bestLines}</dd>
      </dl>
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
        <h1 className="font-serif text-lg font-bold text-polis-ink sm:text-xl">Jogo dos Blocos</h1>
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

      {/* Layout mobile/tablet (< lg): board+"Próxima" lado a lado, estatísticas
          e controles empilhados abaixo (sem D-pad — controle é por gesto no
          próprio tabuleiro); em paisagem compacta (celular deitado), board e
          controles viram colunas lado a lado (ver isCompactLandscape).
          Montado condicionalmente (não só escondido via CSS) — ver
          isDesktopLayout acima. */}
      {!isDesktopLayout && (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div
            className={cn(
              "flex min-h-0 w-full min-w-0 flex-1",
              isCompactLandscape ? "flex-row items-stretch justify-center gap-4" : "flex-col items-center gap-2"
            )}
          >
            <div ref={rowRef} className={cn("flex min-h-0 flex-1 items-center justify-center gap-3", isCompactLandscape ? "w-auto" : "w-full")}>
              {renderBoardSurface(boardBox)}
              <div ref={nextPanelRef}>{renderNextPreview()}</div>
            </div>

            <div
              className={cn(
                "flex shrink-0 flex-col items-center gap-2",
                isCompactLandscape ? "h-full w-[190px] justify-center overflow-y-auto" : "w-full max-w-md"
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

              {renderPauseButton(isCompactLandscape ? "w-full" : "w-full max-w-xs")}
            </div>
          </div>
        </div>
      )}

      {/* Layout desktop (lg+): 3 colunas — estatísticas | tabuleiro maximizado |
          próxima peça + modo + velocidade + guia. Sem D-pad nem gestos: em
          telas grandes o teclado já cobre tudo (setas seguradas repetem via
          DAS/ARR). */}
      {isDesktopLayout && (
        <div className="grid min-h-0 flex-1 lg:grid-cols-[200px_1fr_260px] lg:gap-8">
          <div className="flex min-h-0 flex-col gap-4 overflow-y-auto border-r border-polis-rule/20 pr-6">
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-polis-ink-soft">Estatísticas</p>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                <dt className="text-polis-ink-soft">Nível</dt>
                <dd className="text-right font-semibold text-polis-ink">{level}</dd>
                <dt className="text-polis-ink-soft">Pontos</dt>
                <dd className="text-right font-semibold text-polis-ink">{score}</dd>
                <dt className="text-polis-ink-soft">Linhas</dt>
                <dd className="text-right font-semibold text-polis-ink">{lines}</dd>
                <dt className="text-polis-ink-soft">Tempo</dt>
                <dd className="text-right font-semibold text-polis-ink">{formatTime(elapsedSeconds)}</dd>
              </dl>
            </div>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1 border-t border-polis-rule/20 pt-3 text-xs">
              <dt className="text-polis-ink-soft">Recorde</dt>
              <dd className="text-right font-semibold text-polis-ink">{highScore}</dd>
              <dt className="text-polis-ink-soft">Melhor linhas</dt>
              <dd className="text-right font-semibold text-polis-ink">{bestLines}</dd>
            </dl>
            <div className="flex items-center justify-between border-t border-polis-rule/20 pt-3 text-[11px] uppercase tracking-[0.1em] text-polis-ink-soft">
              <span>Ritmo</span>
              <strong className="text-polis-ink">{speedCellsPerSecond} c/s</strong>
            </div>
            <button
              type="button"
              onClick={hardDrop}
              disabled={status !== "playing"}
              className="border border-polis-ink/30 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-polis-ink transition-colors hover:border-polis-gold-muted hover:text-polis-gold-ink disabled:opacity-30"
            >
              Queda rápida (espaço)
            </button>
            {renderPauseButton()}
          </div>

          <div ref={desktopBoardWrapRef} className="flex min-h-0 items-center justify-center">
            {renderBoardSurface(desktopBoardBox)}
          </div>

          <div className="flex min-h-0 flex-col gap-4 overflow-y-auto border-l border-polis-rule/20 pl-6">
            {renderNextPreview()}
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
