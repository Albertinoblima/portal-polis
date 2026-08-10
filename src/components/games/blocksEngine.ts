/**
 * Motor puro do Jogo dos Blocos (estilo Tetris): matriz do tabuleiro,
 * formas/rotação das peças, colisão, encaixe de linhas e pontuação. Nenhuma
 * dependência de DOM, Canvas ou React — só estruturas de dados e funções
 * puras, para que a camada de visualização (Blocks.tsx, via Canvas) possa
 * mudar livremente sem tocar nesta lógica, e para que ela seja testável
 * isoladamente.
 */

export type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";
export type BlocksMode = "competitivo" | "treino" | "desafio";
export type Status = "idle" | "playing" | "paused" | "gameover";

export interface PieceShape {
  /** Lado do quadro-guia (bounding box) onde a peça gira. */
  size: number;
  /** Casas ocupadas na rotação 0, como [linha, coluna] dentro do quadro-guia. */
  cells: [number, number][];
}

export interface PieceState {
  type: PieceType;
  rotation: number;
  /** Posição do canto superior esquerdo do quadro-guia no tabuleiro. */
  row: number;
  col: number;
}

export type BoardMatrix = (PieceType | null)[][];

export const ROWS = 20;
export const COLS = 10;
export const BOARD_RATIO = COLS / ROWS;

export const LINES_PER_LEVEL = 10;
export const LINE_SCORE = [0, 100, 300, 500, 800];

export const START_SPEED = 800;
export const CHALLENGE_START_SPEED = 760;
const COMPETITIVE_MIN_SPEED = 140;
const COMPETITIVE_SPEED_STEP = 55;
const CHALLENGE_MIN_SPEED = 170;
export const CHALLENGE_TIME_ACCELERATION_INTERVAL = 22;
const CHALLENGE_TIME_ACCELERATION_STEP = 20;
const CHALLENGE_LINE_ACCELERATION_STEP = 12;

/** Progressão clássica do modo competitivo: cada nível acelera a queda,
 *  com piso para não virar impossível de jogar. */
export function competitiveSpeedForLevel(level: number): number {
  return Math.max(COMPETITIVE_MIN_SPEED, START_SPEED - (level - 1) * COMPETITIVE_SPEED_STEP);
}

/** Modo desafio: acelera tanto por linhas limpas quanto por tempo decorrido
 *  (ver CHALLENGE_TIME_ACCELERATION_INTERVAL, chamado à parte por um timer). */
export function challengeSpeedAfterClear(currentSpeedMs: number, clearedLines: number): number {
  return Math.max(CHALLENGE_MIN_SPEED, currentSpeedMs - clearedLines * CHALLENGE_LINE_ACCELERATION_STEP);
}

export function challengeSpeedAfterTime(currentSpeedMs: number): number {
  return Math.max(CHALLENGE_MIN_SPEED, currentSpeedMs - CHALLENGE_TIME_ACCELERATION_STEP);
}

export const PIECES: Record<PieceType, PieceShape> = {
  I: { size: 4, cells: [[1, 0], [1, 1], [1, 2], [1, 3]] },
  O: { size: 2, cells: [[0, 0], [0, 1], [1, 0], [1, 1]] },
  T: { size: 3, cells: [[0, 1], [1, 0], [1, 1], [1, 2]] },
  S: { size: 3, cells: [[0, 1], [0, 2], [1, 0], [1, 1]] },
  Z: { size: 3, cells: [[0, 0], [0, 1], [1, 1], [1, 2]] },
  J: { size: 3, cells: [[0, 0], [1, 0], [1, 1], [1, 2]] },
  L: { size: 3, cells: [[0, 2], [1, 0], [1, 1], [1, 2]] },
};

export const PIECE_TYPES: PieceType[] = ["I", "O", "T", "S", "Z", "J", "L"];

export const CHALLENGE_TIERS = [
  { label: "Bronze", lines: 14 },
  { label: "Prata", lines: 30 },
  { label: "Ouro", lines: 46 },
] as const;

/** Gira as casas 90° no sentido horário dentro do quadro-guia, `times` vezes. */
export function rotateCells(cells: [number, number][], size: number, times: number): [number, number][] {
  let result = cells;
  const normalized = ((times % 4) + 4) % 4;
  for (let i = 0; i < normalized; i++) {
    result = result.map(([r, c]) => [c, size - 1 - r] as [number, number]);
  }
  return result;
}

export function pieceCells(piece: PieceState): { row: number; col: number }[] {
  const shape = PIECES[piece.type];
  return rotateCells(shape.cells, shape.size, piece.rotation).map(([r, c]) => ({
    row: piece.row + r,
    col: piece.col + c,
  }));
}

export function spawnPosition(type: PieceType): { row: number; col: number } {
  const shape = PIECES[type];
  return { row: 0, col: Math.floor((COLS - shape.size) / 2) };
}

export function emptyBoard(): BoardMatrix {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

export function canPlace(board: BoardMatrix, cells: { row: number; col: number }[]): boolean {
  return cells.every(({ row, col }) => {
    if (col < 0 || col >= COLS || row >= ROWS) return false;
    if (row < 0) return true;
    return board[row][col] === null;
  });
}

/** Ponto de encaixe final da peça caindo em linha reta a partir da posição
 *  atual — usado tanto pela queda instantânea quanto pela peça-fantasma. */
export function dropToLanding(board: BoardMatrix, piece: PieceState): PieceState {
  let landed = piece;
  while (canPlace(board, pieceCells({ ...landed, row: landed.row + 1 }))) {
    landed = { ...landed, row: landed.row + 1 };
  }
  return landed;
}

/** Sorteio "7-bag", como nos Tetris modernos: cada sequência de 7 peças contém
 *  exatamente uma de cada tipo, embaralhada — evita sequências de má sorte
 *  (ex.: cinco peças "S" seguidas). Só deve ser chamado a partir de eventos
 *  do jogador (começar/repor o saco durante a partida), nunca durante a
 *  renderização inicial — sortear no render quebraria a hidratação. */
export function shuffledBag(): PieceType[] {
  const bag = [...PIECE_TYPES];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

export function takeFromBag(bagRef: { current: PieceType[] }): PieceType {
  if (bagRef.current.length === 0) bagRef.current = shuffledBag();
  return bagRef.current.shift() as PieceType;
}

export function peekBag(bagRef: { current: PieceType[] }): PieceType {
  if (bagRef.current.length === 0) bagRef.current = shuffledBag();
  return bagRef.current[0];
}

export function highScoreKeyForMode(mode: BlocksMode): string {
  return `polis:blocos:recorde:${mode}`;
}

export function bestLinesKeyForMode(mode: BlocksMode): string {
  return `polis:blocos:melhor-linhas:${mode}`;
}

export function reachedChallengeTierIndex(lines: number): number {
  for (let i = CHALLENGE_TIERS.length - 1; i >= 0; i--) {
    if (lines >= CHALLENGE_TIERS[i].lines) return i;
  }
  return -1;
}

export interface LockResult {
  board: BoardMatrix;
  gameOver: boolean;
  cleared: number;
}

/** Fixa a peça no tabuleiro e resolve linhas completas. `gameOver` quando a
 *  peça trava com parte dela ainda acima do topo visível (linha < 0). */
export function lockPiece(piece: PieceState, board: BoardMatrix): LockResult {
  const next = board.map((row) => [...row]);
  for (const { row, col } of pieceCells(piece)) {
    if (row < 0) return { board: next, gameOver: true, cleared: 0 };
    next[row][col] = piece.type;
  }

  const remaining = next.filter((row) => row.some((cell) => cell === null));
  const cleared = ROWS - remaining.length;
  const cleaned = [...Array.from({ length: cleared }, () => Array(COLS).fill(null)), ...remaining];

  return { board: cleaned, gameOver: false, cleared };
}

/** Tenta girar a peça no lugar; se não couber, tenta pequenos deslocamentos
 *  horizontais ("wall kick" simplificado) antes de desistir — evita que
 *  rotações perto da parede sejam sempre negadas. Retorna `null` se nenhuma
 *  posição couber. */
export function tryRotatePiece(board: BoardMatrix, piece: PieceState): PieceState | null {
  const rotated: PieceState = { ...piece, rotation: (piece.rotation + 1) % 4 };
  for (const kick of [0, -1, 1, -2, 2]) {
    const attempt: PieceState = { ...rotated, col: rotated.col + kick };
    if (canPlace(board, pieceCells(attempt))) return attempt;
  }
  return null;
}
