"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GameRegistrationForm, type GameRegistrationSlot } from "@/components/forms/GameRegistrationForm";
import { cn } from "@/lib/utils";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import { useElementSize } from "@/hooks/useElementSize";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { GameOverlay } from "@/components/games/GameOverlay";
import { GameInfoDialog, GameSettingsButton } from "@/components/games/GameInfoDialog";
import { XMark, OMark } from "@/components/games/TicTacToeMarks";
import {
  applyMove,
  calculateWinner,
  createEmptyState,
  findBestMove,
  oldestPieceIndex,
  type BoardState,
  type Difficulty,
  type Mode,
  type Player,
} from "./tictactoeEngine";

type Stage = "mode" | "registration" | "playing";

interface Score {
  x: number;
  o: number;
}

const EMPTY_SCORE: Score = { x: 0, o: 0 };
const DIFFICULTY_KEY = "polis:tictactoe:dificuldade";
const CPU_THINK_MS = 450;

function scoreKey(mode: Mode, nameX: string, nameO: string): string {
  return `polis:tictactoe:${mode}:${nameX.toLowerCase()}:${nameO.toLowerCase()}`;
}

export function TicTacToe() {
  const [stage, setStage] = useState<Stage>("mode");
  const [mode, setMode] = useState<Mode | null>(null);
  const [nameX, setNameX] = useState("Jogador 1");
  const [nameO, setNameO] = useState("Jogador 2");
  const [boardState, setBoardState] = useState<BoardState>(createEmptyState);
  const [currentPlayer, setCurrentPlayer] = useState<Player>("X");
  const [startingPlayer, setStartingPlayer] = useState<Player>("X");
  const [infoOpen, setInfoOpen] = useState(false);
  const [difficulty, setDifficulty] = useLocalStorageState<Difficulty>(DIFFICULTY_KEY, "medio");

  const [boardWrapRef, boardWrapSize] = useElementSize<HTMLDivElement>();
  const [desktopBoardWrapRef, desktopBoardWrapSize] = useElementSize<HTMLDivElement>();
  const isDesktopLayout = useMediaQuery("(min-width: 1024px)");

  const boardBox = useMemo(() => {
    const side = Math.floor(Math.min(boardWrapSize.width, boardWrapSize.height));
    return side > 0 ? side : null;
  }, [boardWrapSize]);
  const desktopBoardBox = useMemo(() => {
    const side = Math.floor(Math.min(desktopBoardWrapSize.width, desktopBoardWrapSize.height));
    return side > 0 ? side : null;
  }, [desktopBoardWrapSize]);

  // A chave só fica "real" depois do cadastro (quando mode/nomes são
  // definidos) — o hook recarrega sozinho sempre que a chave muda.
  const [score, setScore] = useLocalStorageState<Score>(scoreKey(mode ?? "local", nameX, nameO), EMPTY_SCORE);

  const outcome = calculateWinner(boardState.board);
  // Sem empate possível: com no máximo 3 peças ativas por jogador, o
  // tabuleiro nunca fica cheio (sempre sobra pelo menos 1 casa livre uma
  // vez que os dois já colocaram sua 4ª peça ou mais) — a única forma de a
  // partida terminar é alguém completar uma linha.
  const gameOver = Boolean(outcome);
  const isCpuTurn = stage === "playing" && mode === "cpu" && currentPlayer === "O" && !gameOver;
  // Peça que vai sumir se o jogador da vez jogar de novo — mostrada com
  // opacidade reduzida e pulsando, para ajudar no planejamento tático.
  const fadingIndex = oldestPieceIndex(boardState, currentPlayer);

  function selectMode(selected: Mode) {
    setMode(selected);
    setStage("registration");
  }

  function handleRegistered(names: string[]) {
    const x = names[0]?.trim() || "Jogador 1";
    const o = mode === "cpu" ? "Computador" : names[1]?.trim() || "Jogador 2";
    setNameX(x);
    setNameO(o);
    // Mudar nameX/nameO muda a chave usada por useLocalStorageState acima,
    // que recarrega sozinho o placar salvo para este par assim que a chave
    // muda — não precisa carregar manualmente aqui.
    setStartingPlayer("X");
    setCurrentPlayer("X");
    setBoardState(createEmptyState());
    setStage("playing");
  }

  function registerResult(winner: Player) {
    setScore((prev) => (winner === "X" ? { ...prev, x: prev.x + 1 } : { ...prev, o: prev.o + 1 }));
  }

  function commitMove(index: number, player: Player) {
    if (boardState.board[index] !== null) return;
    const { state: nextState } = applyMove(boardState, index, player);
    setBoardState(nextState);

    const result = calculateWinner(nextState.board);
    if (result) {
      registerResult(result.winner);
    } else {
      setCurrentPlayer(player === "X" ? "O" : "X");
    }
  }

  function handleCellClick(index: number) {
    if (stage !== "playing" || gameOver || isCpuTurn) return;
    commitMove(index, currentPlayer);
  }

  function playAgain() {
    const nextStarter = startingPlayer === "X" ? "O" : "X";
    setStartingPlayer(nextStarter);
    setCurrentPlayer(nextStarter);
    setBoardState(createEmptyState());
  }

  function changePlayers() {
    setStage("mode");
    setMode(null);
    setBoardState(createEmptyState());
    // Não zera `score` aqui: como ele agora também persiste em localStorage,
    // isso sobrescreveria o placar salvo do par com zeros. O placar da tela
    // de "mode" nem é exibido; o par seguinte recarrega o dele sozinho.
  }

  useEffect(() => {
    if (!isCpuTurn) return;

    const timer = window.setTimeout(() => {
      const index = findBestMove(boardState, "O", difficulty);
      if (index >= 0) commitMove(index, "O");
    }, CPU_THINK_MS);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCpuTurn, boardState, difficulty]);

  if (stage === "mode") {
    return (
      <div className="mx-auto flex h-full max-w-xl flex-col items-center justify-center gap-6 text-center">
        <h1 className="font-serif text-4xl font-bold text-polis-ink">Jogo da Velha</h1>
        <p className="max-w-md text-polis-ink-soft">Escolha como deseja jogar esta partida.</p>
        <div className="flex w-full flex-col gap-4 sm:flex-row">
          <button
            type="button"
            onClick={() => selectMode("cpu")}
            className="flex-1 border border-polis-ink/30 bg-polis-paper-soft/20 px-6 py-5 font-serif text-lg font-semibold text-polis-ink transition-colors hover:border-polis-gold-muted hover:text-polis-gold-ink"
          >
            Contra o computador
          </button>
          <button
            type="button"
            onClick={() => selectMode("local")}
            className="flex-1 border border-polis-ink/30 bg-polis-paper-soft/20 px-6 py-5 font-serif text-lg font-semibold text-polis-ink transition-colors hover:border-polis-gold-muted hover:text-polis-gold-ink"
          >
            Com outra pessoa
          </button>
        </div>
      </div>
    );
  }

  if (stage === "registration") {
    const slots: GameRegistrationSlot[] =
      mode === "cpu"
        ? [{ label: "Seu nome", symbol: "X" }]
        : [
          { label: "Jogador 1", symbol: "X" },
          { label: "Jogador 2", symbol: "O" },
        ];

    return (
      <div className="mx-auto flex h-full max-w-md flex-col justify-center gap-6">
        <div className="text-center">
          <h1 className="font-serif text-3xl font-bold text-polis-ink">Cadastro de Jogadores</h1>
          <p className="mt-1 text-sm text-polis-ink-soft">
            Antes de começar, identifique quem vai jogar.
          </p>
        </div>
        <GameRegistrationForm slots={slots} onRegistered={handleRegistered} />
        <button
          type="button"
          onClick={() => setStage("mode")}
          className="mx-auto text-xs uppercase tracking-wide text-polis-ink-soft underline hover:text-polis-gold-ink"
        >
          Voltar
        </button>
      </div>
    );
  }

  const statusText = outcome
    ? `${outcome.winner === "X" ? nameX : nameO} venceu esta partida!`
    : isCpuTurn
      ? "Computador pensando..."
      : `Vez de ${currentPlayer === "X" ? nameX : nameO} (${currentPlayer})`;

  function renderScore(className?: string) {
    return (
      <dl className={cn("grid grid-cols-2 gap-x-3 gap-y-2 text-sm", className)}>
        <dt className="text-polis-ink-soft">{nameX} (X)</dt>
        <dd className="text-right font-semibold text-polis-ink">{score.x}</dd>
        <dt className="text-polis-ink-soft">{nameO} (O)</dt>
        <dd className="text-right font-semibold text-polis-ink">{score.o}</dd>
      </dl>
    );
  }

  function renderBoard(box: number | null) {
    return (
      <div
        className={cn("relative shrink-0 transition-opacity", box ? "opacity-100" : "opacity-0")}
        style={{ width: box ?? 0, height: box ?? 0 }}
      >
        {/* Sem linhas pretas duras: o fundo do contêiner é levemente
            escurecido e cada casa tem fundo claro — as divisórias nascem do
            próprio espaço vazio do gap, não de bordas desenhadas. */}
        <div className="grid h-full w-full grid-cols-3 grid-rows-3 gap-[3px] bg-polis-ink/15 p-[3px]">
          {boardState.board.map((cell, index) => {
            const fading = index === fadingIndex;
            const interactive = cell === null && !gameOver && !isCpuTurn;
            return (
              <button
                key={index}
                type="button"
                onClick={() => handleCellClick(index)}
                disabled={cell !== null || gameOver || isCpuTurn}
                aria-label={`Casa ${index + 1}${cell ? `, ${cell}` : ""}`}
                className={cn(
                  "flex items-center justify-center bg-polis-paper transition-colors",
                  outcome?.line.includes(index) ? "bg-polis-gold/20" : interactive && "hover:bg-polis-paper-soft"
                )}
              >
                <AnimatePresence>
                  {cell && (
                    <motion.div
                      key="mark"
                      className={cn(
                        "flex h-full w-full items-center justify-center",
                        cell === "X" ? "text-polis-ink" : "text-polis-gold-ink"
                      )}
                      initial={{ opacity: 0, scale: 0.5 }}
                      // A transição de CADA estado vive DENTRO do próprio
                      // objeto (`animate.transition`/`exit.transition`), não
                      // num `transition` único compartilhado no topo — se
                      // ficasse compartilhado, a saída (exit) de uma peça
                      // que estava pulsando herdaria o `repeat: Infinity`
                      // da pulsação e nunca terminaria de fato: a peça
                      // removida ficava presa piscando pra sempre em vez de
                      // desaparecer (bug real, pego ao testar visualmente).
                      animate={
                        fading
                          ? {
                            opacity: [0.25, 0.55, 0.25],
                            scale: 1,
                            transition: { opacity: { duration: 1.6, repeat: Infinity, ease: "easeInOut" }, scale: { duration: 0.2 } },
                          }
                          : { opacity: 1, scale: 1, transition: { duration: 0.2 } }
                      }
                      exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.2 } }}
                    >
                      {cell === "X" ? <XMark /> : <OMark />}
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </div>

        {outcome && (
          <GameOverlay
            title={statusText}
            subtitle={`${nameX} ${score.x} × ${score.o} ${nameO}`}
            actionLabel="Jogar novamente"
            onAction={playAgain}
          />
        )}
      </div>
    );
  }

  function renderDifficultySelector() {
    if (mode !== "cpu") return null;
    return (
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-polis-ink-soft">Dificuldade</p>
        <div className="flex gap-2">
          {(["facil", "medio", "impossivel"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setDifficulty(option)}
              className={cn(
                "flex-1 border px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors",
                difficulty === option
                  ? "border-polis-gold-muted bg-polis-paper-soft text-polis-ink"
                  : "border-polis-ink/30 text-polis-ink-soft hover:border-polis-gold-muted hover:text-polis-gold-ink"
              )}
            >
              {option === "facil" ? "Fácil" : option === "medio" ? "Médio" : "Impossível"}
            </button>
          ))}
        </div>
      </div>
    );
  }

  function renderGuide() {
    return (
      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-polis-ink-soft">Guia Rápido</p>
        <ul className="space-y-1.5 text-xs leading-relaxed text-polis-ink-soft">
          <li>Cada jogador só mantém 3 peças no tabuleiro — a 4ª jogada remove a mais antiga.</li>
          <li>A peça pulsando e mais apagada é a próxima a desaparecer se o dono jogar de novo.</li>
          <li>Sem empate: o jogo só termina quando alguém completa uma linha.</li>
        </ul>
      </div>
    );
  }

  const settingsContent = (
    <div className="flex flex-col gap-4 text-sm text-polis-ink">
      {renderDifficultySelector()}
      {renderGuide()}
      <button
        type="button"
        onClick={changePlayers}
        className="self-start text-xs uppercase tracking-wide text-polis-ink-soft underline hover:text-polis-gold-ink"
      >
        Trocar jogadores
      </button>
    </div>
  );

  return (
    <div className="relative flex h-full w-full flex-col gap-2 overflow-hidden">
      <div className="flex shrink-0 items-center justify-between gap-2">
        <h1 className="font-serif text-lg font-bold text-polis-ink sm:text-xl">Jogo da Velha</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={playAgain}
            disabled={!gameOver}
            className="border border-polis-ink/30 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-polis-ink transition-colors hover:border-polis-gold-muted hover:text-polis-gold-ink disabled:opacity-30"
          >
            Jogar novamente
          </button>
          {!isDesktopLayout && <GameSettingsButton onClick={() => setInfoOpen(true)} />}
        </div>
      </div>

      {/* Mobile/tablet (< lg): placar em cabeçalho compacto, tabuleiro
          central maximizado, status abaixo — configurações/guia atrás da
          engrenagem (GameInfoDialog). */}
      {!isDesktopLayout && (
        <div className="flex min-h-0 w-full flex-1 flex-col items-center gap-3">
          <div className="flex w-full max-w-md items-center justify-around border-y border-polis-rule/30 py-1.5 text-sm">
            <span className="text-polis-ink">
              {nameX} (X) <strong>{score.x}</strong>
            </span>
            <span className="text-polis-ink">
              {nameO} (O) <strong>{score.o}</strong>
            </span>
          </div>

          <div ref={boardWrapRef} className="flex min-h-0 w-full min-w-0 flex-1 items-center justify-center">
            {renderBoard(boardBox)}
          </div>

          <p className="min-h-5 shrink-0 text-center text-sm text-polis-ink-soft">{statusText}</p>
        </div>
      )}

      {/* Desktop (lg+): grade CSS de 3 colunas — placar | tabuleiro | modo e
          guia. min-w-0 na coluna central é essencial (não decorativo): sem
          ele, o item de grid nunca encolhe abaixo do min-content do filho
          de largura fixa (o tabuleiro, dimensionado via ResizeObserver), o
          que cria um ciclo de realimentação que faz a coluna vazar pra fora
          da grade a cada poucos frames — mesmo bug já corrigido em
          Snake.tsx/Blocks.tsx. */}
      {isDesktopLayout && (
        <div className="grid min-h-0 flex-1 lg:grid-cols-[220px_1fr_260px] lg:gap-8">
          <div className="flex min-h-0 flex-col gap-4 overflow-y-auto border-r border-polis-rule/20 pr-6">
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-polis-ink-soft">Placar</p>
              {renderScore()}
            </div>
            <p className="border-t border-polis-rule/20 pt-3 text-sm text-polis-ink-soft">{statusText}</p>
          </div>

          <div ref={desktopBoardWrapRef} className="flex min-h-0 min-w-0 items-center justify-center">
            {renderBoard(desktopBoardBox)}
          </div>

          <div className="flex min-h-0 flex-col gap-4 overflow-y-auto border-l border-polis-rule/20 pl-6">
            {settingsContent}
          </div>
        </div>
      )}

      <GameInfoDialog open={infoOpen} onOpenChange={setInfoOpen} title="Configurações e Guia">
        {settingsContent}
      </GameInfoDialog>
    </div>
  );
}
