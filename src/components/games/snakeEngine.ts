/**
 * Motor puro do Jogo da Cobrinha: matriz de estado (posições da cobra,
 * comida, direção) e as regras de movimento/colisão. Nenhuma dependência de
 * DOM, Canvas ou React — só estruturas de dados e funções puras, para que a
 * camada de visualização (Snake.tsx, via Canvas) possa mudar livremente sem
 * tocar nesta lógica, e para que ela seja testável isoladamente (mesmo
 * espírito de blocksEngine.ts).
 */

export interface Point {
  x: number;
  y: number;
}

export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
export type Status = "idle" | "playing" | "paused" | "gameover";
export type SnakeMode = "competitivo" | "treino" | "desafio";

export const COLS = 20;
export const ROWS = 12;
export const BOARD_RATIO = COLS / ROWS;

export const START_SPEED = 160;
export const TRAINING_SPEED = 180;
export const CHALLENGE_START_SPEED = 150;
export const MIN_SPEED = 70;
export const SPEED_STEP = 4;
export const TIME_ACCELERATION_INTERVAL = 20;
export const TIME_ACCELERATION_STEP = 2;

export const HIGH_SCORE_KEY = "polis:cobrinha:recorde";
export const HIGH_TIME_KEY = "polis:cobrinha:melhor-tempo";
export const MODE_KEY = "polis:cobrinha:modo";
export const CHALLENGE_BEST_TIER_KEY = "polis:cobrinha:desafio:melhor-tier";

export const CHALLENGE_TIERS = [
  { label: "Bronze", seconds: 120 },
  { label: "Prata", seconds: 240 },
  { label: "Ouro", seconds: 360 },
] as const;

export const INITIAL_SNAKE: Point[] = [
  { x: 8, y: 6 },
  { x: 7, y: 6 },
  { x: 6, y: 6 },
];
export const INITIAL_DIRECTION: Direction = "RIGHT";
// Posição fixa (não randômica) para não divergir entre o HTML renderizado no
// servidor e a primeira renderização no cliente — randomizar aqui causaria
// hydration mismatch. A comida só é sorteada de fato a partir de startGame(),
// que só roda no cliente (evento de clique).
export const INITIAL_FOOD: Point = { x: 14, y: 3 };

export const DIRECTION_VECTORS: Record<Direction, Point> = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

export const OPPOSITE: Record<Direction, Direction> = {
  UP: "DOWN",
  DOWN: "UP",
  LEFT: "RIGHT",
  RIGHT: "LEFT",
};

export const KEY_TO_DIRECTION: Record<string, Direction> = {
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

export function randomFood(snake: Point[]): Point {
  let candidate: Point;
  do {
    candidate = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
  } while (snake.some((segment) => segment.x === candidate.x && segment.y === candidate.y));
  return candidate;
}

export function highScoreKeyForMode(mode: SnakeMode): string {
  return `${HIGH_SCORE_KEY}:${mode}`;
}

export function highTimeKeyForMode(mode: SnakeMode): string {
  return `${HIGH_TIME_KEY}:${mode}`;
}

export function reachedChallengeTierIndex(seconds: number): number {
  for (let i = CHALLENGE_TIERS.length - 1; i >= 0; i--) {
    if (seconds >= CHALLENGE_TIERS[i].seconds) return i;
  }
  return -1;
}

export interface StepResult {
  snake: Point[];
  ateFood: boolean;
  collided: boolean;
}

/** Avança um único passo (tick) do jogo: move a cabeça na `direction` dada,
 *  resolve colisão com borda/próprio corpo e cresce a cauda se comer.
 *  Função pura — não lê nem escreve nenhum estado fora dos parâmetros, então
 *  o chamador decide o que fazer com o resultado (atualizar React state,
 *  agendar o próximo tick, etc.). Em colisão, devolve a cobra inalterada
 *  (o chamador decide encerrar o jogo). */
export function stepSnake(snake: Point[], direction: Direction, food: Point): StepResult {
  const vector = DIRECTION_VECTORS[direction];
  const head = snake[0];
  const newHead: Point = { x: head.x + vector.x, y: head.y + vector.y };
  // Fiel ao jogo original: bater na borda da tela é fim de jogo, sem
  // "atravessar" para o outro lado.
  const hitWall = newHead.x < 0 || newHead.x >= COLS || newHead.y < 0 || newHead.y >= ROWS;
  const ateFood = newHead.x === food.x && newHead.y === food.y;
  const body = ateFood ? snake : snake.slice(0, -1);
  const collided = hitWall || body.some((segment) => segment.x === newHead.x && segment.y === newHead.y);

  if (collided) return { snake, ateFood: false, collided: true };
  return { snake: [newHead, ...body], ateFood, collided: false };
}
