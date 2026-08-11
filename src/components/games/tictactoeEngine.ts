/**
 * Motor puro do Jogo da Velha "infinito" (Shift Tic-Tac-Toe): estado do
 * tabuleiro, a regra de 3 peças ativas por jogador (a 4ª jogada remove a 1ª
 * peça colocada), detecção de vitória e a IA (minimax com poda alfa-beta,
 * adaptado para uma árvore sem estado terminal garantido). Nenhuma
 * dependência de DOM ou React — só estruturas de dados e funções puras,
 * mesmo espírito de snakeEngine.ts/blocksEngine.ts.
 */

export type Cell = "X" | "O" | null;
export type Player = "X" | "O";
export type Mode = "cpu" | "local";
export type Difficulty = "facil" | "medio" | "impossivel";

/** Cada jogador só pode ter, no máximo, esta quantidade de peças no
 *  tabuleiro ao mesmo tempo — é o que torna o jogo "infinito" (nunca
 *  empata, o tabuleiro nunca fica cheio: sempre sobra pelo menos 1 casa
 *  livre quando os dois jogadores já colocaram sua 4ª peça ou mais). */
export const MAX_ACTIVE_PIECES = 3;

/** A fila (`queues`) é o coração da mecânica: para cada jogador, guarda os
 *  índices das casas ocupadas em ORDEM DE COLOCAÇÃO (o índice 0 do array é
 *  sempre a peça mais antiga desse jogador ainda no tabuleiro). É o que
 *  permite saber, a qualquer momento, qual peça vai sumir na próxima
 *  jogada — tanto para desenhar o indicativo visual de "prestes a
 *  desaparecer" quanto para a IA simular corretamente as consequências de
 *  cada lance durante a busca. */
export interface BoardState {
  board: Cell[];
  queues: Record<Player, number[]>;
}

export function createEmptyState(): BoardState {
  return { board: Array(9).fill(null), queues: { X: [], O: [] } };
}

export const WIN_LINES: readonly (readonly [number, number, number])[] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export interface WinResult {
  winner: Player;
  line: number[];
}

export function calculateWinner(board: Cell[]): WinResult | null {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a] as Player, line: [...line] };
    }
  }
  return null;
}

/** Índice da peça mais antiga de `player`, SE esse jogador já estiver no
 *  limite de peças ativas — ou seja, a peça que será removida assim que ele
 *  jogar de novo. Devolve `null` quando ele ainda tem espaço livre (a
 *  próxima jogada dele não remove nada). Usada tanto pela UI (indicativo
 *  visual pulsante) quanto, indiretamente, pela IA (via `applyMove`). */
export function oldestPieceIndex(state: BoardState, player: Player): number | null {
  const queue = state.queues[player];
  return queue.length >= MAX_ACTIVE_PIECES ? queue[0] : null;
}

export interface MoveResult {
  state: BoardState;
  removedIndex: number | null;
}

/** Aplica a jogada de `player` em `index`: se o jogador já tem
 *  `MAX_ACTIVE_PIECES` no tabuleiro, a peça mais antiga da fila dele é
 *  removida ANTES da nova entrar (fiel à regra: "a 4ª jogada remove a 1ª").
 *  Função pura — devolve um estado novo, nunca muta `state`. Usada tanto
 *  pelo jogo real quanto por cada nó da busca do minimax abaixo, o que
 *  garante que a IA "enxerga" corretamente quais peças (inclusive as
 *  dela mesma) vão sumir em jogadas futuras simuladas. */
export function applyMove(state: BoardState, index: number, player: Player): MoveResult {
  const board = [...state.board];
  const queue = [...state.queues[player]];
  let removedIndex: number | null = null;

  if (queue.length >= MAX_ACTIVE_PIECES) {
    removedIndex = queue.shift() as number;
    board[removedIndex] = null;
  }

  queue.push(index);
  board[index] = player;

  return {
    state: { board, queues: { ...state.queues, [player]: queue } },
    removedIndex,
  };
}

export function getValidMoves(board: Cell[]): number[] {
  const moves: number[] = [];
  for (let i = 0; i < board.length; i++) {
    if (board[i] === null) moves.push(i);
  }
  return moves;
}

/** Peso por quantidade de marcas de um mesmo jogador numa linha (1 ou 2 —
 *  3 já é vitória, tratada à parte por `calculateWinner`). Crescimento
 *  exponencial faz duas marcas na mesma linha valerem muito mais que duas
 *  marcas espalhadas em linhas separadas, priorizando ameaças concretas. */
const LINE_WEIGHT = [0, 1, 12];

/** Heurística usada quando a busca do minimax atinge o limite de
 *  profundidade sem nenhum vencedor. Necessária porque o jogo infinito não
 *  tem estado terminal garantido (o tabuleiro nunca enche, então não dá
 *  pra buscar "até o fim" como no jogo da velha clássico) — a busca precisa
 *  de um critério de qualidade posicional para cortar a árvore em algum
 *  ponto. Para cada uma das 8 linhas: se só um jogador tem marcas nela,
 *  soma pontos a favor dele (positivo favorece O, o maximizador); linhas
 *  vazias ou já bloqueadas (com marcas dos dois) valem 0. */
function evaluateBoard(board: Cell[]): number {
  let score = 0;
  for (const [a, b, c] of WIN_LINES) {
    const cells = [board[a], board[b], board[c]];
    const oCount = cells.filter((cell) => cell === "O").length;
    const xCount = cells.filter((cell) => cell === "X").length;
    if (oCount > 0 && xCount > 0) continue;
    if (oCount > 0) score += LINE_WEIGHT[oCount];
    else if (xCount > 0) score -= LINE_WEIGHT[xCount];
  }
  return score;
}

/** Profundidade (em jogadas/plies à frente) por nível de dificuldade —
 *  quanto maior, mais "impossível" a IA fica, já que enxerga mais lances à
 *  frente (inclusive as próprias peças que vão sumir pelo caminho). */
export const DIFFICULTY_DEPTH: Record<Difficulty, number> = {
  facil: 2,
  medio: 4,
  impossivel: 6,
};

/** Chance de a dificuldade "Fácil" ignorar a melhor jogada do minimax e
 *  escolher uma casa válida aleatória — sem isso, mesmo a busca rasa (2
 *  plies) já bloqueia toda ameaça óbvia e vira uma IA frustrante para
 *  iniciantes. Mantém alguma reatividade (só entra uma fração das vezes),
 *  não uma IA totalmente sem noção. */
const EASY_RANDOM_CHANCE = 0.35;

interface SearchResult {
  score: number;
  index: number | null;
}

/** Minimax com poda alfa-beta, adaptado para a regra das 3 peças ativas: em
 *  cada nó da árvore, os lances de ambos os jogadores passam por
 *  `applyMove` (não por uma simples atribuição de casa), então a busca
 *  considera corretamente quais peças — inclusive da própria IA — vão
 *  desaparecer em jogadas futuras simuladas, não só o tabuleiro atual. O
 *  computador sempre joga com "O" (maximiza o placar), o desafiante com
 *  "X" (minimiza) — mesma convenção do jogo clássico original. */
function minimax(state: BoardState, depth: number, player: Player, alpha: number, beta: number): SearchResult {
  const outcome = calculateWinner(state.board);
  if (outcome) {
    // Soma `depth` (plies restantes) ao valor bruto: entre duas vitórias
    // encontradas pela IA, prefere a mais RÁPIDA (mais plies restantes =
    // vitória mais próxima); entre duas derrotas, prefere adiar o quanto
    // der. Sem isso o minimax é indiferente entre "vencer agora" e "vencer
    // daqui a 5 jogadas", o que produz lances tacanhos.
    const base = outcome.winner === "O" ? 1000 : -1000;
    return { score: base + (outcome.winner === "O" ? depth : -depth), index: null };
  }
  if (depth === 0) {
    return { score: evaluateBoard(state.board), index: null };
  }

  const moves = getValidMoves(state.board);
  if (moves.length === 0) {
    // Não deveria acontecer em regime permanente (sempre sobra casa livre
    // com no máximo 6 das 9 ocupadas), mas evita quebrar a busca se algum
    // dia acontecer.
    return { score: evaluateBoard(state.board), index: null };
  }

  const maximizing = player === "O";
  let best = maximizing ? -Infinity : Infinity;
  let bestIndex = moves[0];
  let currentAlpha = alpha;
  let currentBeta = beta;

  for (const index of moves) {
    const { state: nextState } = applyMove(state, index, player);
    const { score } = minimax(nextState, depth - 1, player === "O" ? "X" : "O", currentAlpha, currentBeta);

    if (maximizing ? score > best : score < best) {
      best = score;
      bestIndex = index;
    }

    if (maximizing) currentAlpha = Math.max(currentAlpha, best);
    else currentBeta = Math.min(currentBeta, best);
    if (currentBeta <= currentAlpha) break;
  }

  return { score: best, index: bestIndex };
}

/** Ponto de entrada da IA: escolhe a jogada de `player` para o estado
 *  atual, na profundidade correspondente a `difficulty`. Único lugar que
 *  injeta aleatoriedade (só no nível "Fácil") — a busca em si é sempre
 *  determinística. */
export function findBestMove(state: BoardState, player: Player, difficulty: Difficulty): number {
  const moves = getValidMoves(state.board);
  if (moves.length === 0) return -1;

  if (difficulty === "facil" && Math.random() < EASY_RANDOM_CHANCE) {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  const depth = DIFFICULTY_DEPTH[difficulty];
  const { index } = minimax(state, depth, player, -Infinity, Infinity);
  return index ?? moves[0];
}
