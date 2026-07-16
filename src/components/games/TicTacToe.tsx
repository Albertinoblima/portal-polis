"use client";

import { useEffect, useState } from "react";
import { GameRegistrationForm, type GameRegistrationSlot } from "@/components/forms/GameRegistrationForm";
import { cn } from "@/lib/utils";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";

type Cell = "X" | "O" | null;
type Mode = "cpu" | "local";
type Stage = "mode" | "registration" | "playing";

interface Score {
  x: number;
  o: number;
  draws: number;
}

const EMPTY_BOARD: Cell[] = Array(9).fill(null);
const EMPTY_SCORE: Score = { x: 0, o: 0, draws: 0 };

const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function calculateWinner(board: Cell[]): { winner: "X" | "O"; line: number[] } | null {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a] as "X" | "O", line };
    }
  }
  return null;
}

function isDraw(board: Cell[]): boolean {
  return board.every((cell) => cell !== null);
}

/** Minimax clássico: o computador (O) sempre joga com perfeição, o que
 *  torna a IA imbatível — no pior caso, o desafiante empata. */
function minimax(board: Cell[], player: "X" | "O"): { score: number; index: number | null } {
  const outcome = calculateWinner(board);
  if (outcome) return { score: outcome.winner === "O" ? 1 : -1, index: null };
  if (isDraw(board)) return { score: 0, index: null };

  const available = board.reduce<number[]>((acc, cell, i) => (cell === null ? [...acc, i] : acc), []);
  let best = player === "O" ? -Infinity : Infinity;
  let bestIndex = available[0];

  for (const index of available) {
    const next = [...board];
    next[index] = player;
    const { score } = minimax(next, player === "O" ? "X" : "O");
    if (player === "O" ? score > best : score < best) {
      best = score;
      bestIndex = index;
    }
  }

  return { score: best, index: bestIndex };
}

function scoreKey(mode: Mode, nameX: string, nameO: string): string {
  return `polis:tictactoe:${mode}:${nameX.toLowerCase()}:${nameO.toLowerCase()}`;
}

export function TicTacToe() {
  const [stage, setStage] = useState<Stage>("mode");
  const [mode, setMode] = useState<Mode | null>(null);
  const [nameX, setNameX] = useState("Jogador 1");
  const [nameO, setNameO] = useState("Jogador 2");
  const [board, setBoard] = useState<Cell[]>(EMPTY_BOARD);
  const [currentPlayer, setCurrentPlayer] = useState<"X" | "O">("X");
  const [startingPlayer, setStartingPlayer] = useState<"X" | "O">("X");
  // A chave só fica "real" depois do cadastro (quando mode/nomes são
  // definidos) — o hook recarrega sozinho sempre que a chave muda.
  const [score, setScore] = useLocalStorageState<Score>(scoreKey(mode ?? "local", nameX, nameO), EMPTY_SCORE);

  const outcome = calculateWinner(board);
  const draw = !outcome && isDraw(board);
  const gameOver = Boolean(outcome) || draw;
  const isCpuTurn = stage === "playing" && mode === "cpu" && currentPlayer === "O" && !gameOver;

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
    setBoard(EMPTY_BOARD);
    setStage("playing");
  }

  function registerResult(result: "X" | "O" | "draw") {
    setScore((prev) =>
      result === "draw"
        ? { ...prev, draws: prev.draws + 1 }
        : result === "X"
          ? { ...prev, x: prev.x + 1 }
          : { ...prev, o: prev.o + 1 }
    );
  }

  function commitMove(index: number, player: "X" | "O") {
    if (board[index] !== null) return;
    const next = [...board];
    next[index] = player;
    setBoard(next);

    const result = calculateWinner(next);
    if (result) {
      registerResult(result.winner);
    } else if (isDraw(next)) {
      registerResult("draw");
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
    setBoard(EMPTY_BOARD);
  }

  function changePlayers() {
    setStage("mode");
    setMode(null);
    setBoard(EMPTY_BOARD);
    // Não zera `score` aqui: como ele agora também persiste em localStorage,
    // isso sobrescreveria o placar salvo do par com zeros. O placar da tela
    // de "mode" nem é exibido; o par seguinte recarrega o dele sozinho.
  }

  useEffect(() => {
    if (!isCpuTurn) return;

    const timer = window.setTimeout(() => {
      const { index } = minimax(board, "O");
      if (index !== null) commitMove(index, "O");
    }, 450);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCpuTurn, board]);

  if (stage === "mode") {
    return (
      <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center gap-6 text-center">
        <h1 className="font-serif text-4xl font-bold text-polis-ink">Jogo da Velha</h1>
        <p className="text-polis-ink-soft">Escolha como deseja jogar esta partida.</p>
        <div className="flex w-full flex-col gap-4 sm:flex-row">
          <button
            type="button"
            onClick={() => selectMode("cpu")}
            className="flex-1 border border-polis-ink/30 px-6 py-5 font-serif text-lg font-semibold text-polis-ink transition-colors hover:border-polis-gold-muted hover:text-polis-gold-ink"
          >
            Contra o computador
          </button>
          <button
            type="button"
            onClick={() => selectMode("local")}
            className="flex-1 border border-polis-ink/30 px-6 py-5 font-serif text-lg font-semibold text-polis-ink transition-colors hover:border-polis-gold-muted hover:text-polis-gold-ink"
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

  return (
    <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center gap-5">
      <h1 className="font-serif text-3xl font-bold text-polis-ink">Jogo da Velha</h1>

      <div className="flex w-full items-center justify-around border-y border-polis-rule/30 py-2 text-sm">
        <span className="text-polis-ink">
          {nameX} (X) <strong>{score.x}</strong>
        </span>
        <span className="text-polis-ink-soft">
          Empates <strong>{score.draws}</strong>
        </span>
        <span className="text-polis-ink">
          {nameO} (O) <strong>{score.o}</strong>
        </span>
      </div>

      <div className="grid w-full max-w-xs grid-cols-3 gap-[3px] border-2 border-polis-ink bg-polis-ink sm:max-w-sm">
        {board.map((cell, index) => (
          <button
            key={index}
            type="button"
            onClick={() => handleCellClick(index)}
            disabled={cell !== null || gameOver || isCpuTurn}
            aria-label={`Casa ${index + 1}${cell ? `, ${cell}` : ""}`}
            className={cn(
              "flex aspect-square items-center justify-center bg-polis-paper font-serif text-5xl font-bold transition-colors",
              outcome?.line.includes(index) ? "bg-polis-gold/15" : "hover:bg-polis-paper-soft",
              cell === "X" && "text-polis-ink",
              cell === "O" && "text-polis-gold-ink"
            )}
          >
            {cell}
          </button>
        ))}
      </div>

      <p className="min-h-5 text-center text-sm text-polis-ink-soft">
        {outcome
          ? `${outcome.winner === "X" ? nameX : nameO} venceu esta partida!`
          : draw
            ? "Empate!"
            : isCpuTurn
              ? "Computador pensando..."
              : `Vez de ${currentPlayer === "X" ? nameX : nameO} (${currentPlayer})`}
      </p>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={playAgain}
          disabled={!gameOver}
          className="border border-polis-ink/30 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-polis-ink transition-colors hover:border-polis-gold-muted hover:text-polis-gold-ink disabled:opacity-30"
        >
          Jogar novamente
        </button>
        <button
          type="button"
          onClick={changePlayers}
          className="text-xs uppercase tracking-wide text-polis-ink-soft underline hover:text-polis-gold-ink"
        >
          Trocar jogadores
        </button>
      </div>
    </div>
  );
}
