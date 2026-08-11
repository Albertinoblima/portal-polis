/**
 * Camada de visualização (Canvas 2D) do Jogo da Cobrinha — funções puras de
 * desenho, sem estado próprio: recebem um contexto 2D já dimensionado e os
 * dados prontos do motor (snakeEngine.ts) e pintam o quadro atual. Nada
 * aqui lê nem escreve estado do jogo — só transforma dados em pixels (mesmo
 * espírito de blocksRenderer.ts).
 */

import { COLS, ROWS, type Point } from "./snakeEngine";

export interface ColorPair {
  light: string;
  dark: string;
}

/** Paleta resolvida a partir das CSS Custom Properties do tema atual (ver
 *  `--color-snake-*` em globals.css) — o Canvas não entende `var(...)`
 *  diretamente, então isto é lido uma vez por render via `getComputedStyle`
 *  e cacheado pelo chamador (não a cada frame do loop de animação). */
export interface SnakeTheme {
  boardBackground: string;
  gridLine: string;
  head: ColorPair;
  body: ColorPair;
  food: ColorPair;
}

export function resolveSnakeTheme(scopeElement: Element): SnakeTheme {
  const style = getComputedStyle(scopeElement);
  const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;

  return {
    boardBackground: read("--color-paper-soft", "#ece7da"),
    gridLine: read("--color-snake-grid-line", "rgba(26, 24, 21, 0.08)"),
    head: { light: read("--color-snake-head", "#059669"), dark: read("--color-snake-head-dark", "#065f46") },
    body: { light: read("--color-snake-body", "#34d399"), dark: read("--color-snake-body-dark", "#10b981") },
    food: { light: read("--color-snake-food", "#fbbf24"), dark: read("--color-snake-food-dark", "#f59e0b") },
  };
}

function drawGridLines(ctx: CanvasRenderingContext2D, cols: number, rows: number, cellSize: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  for (let c = 0; c <= cols; c++) {
    const x = Math.round(c * cellSize) + 0.5;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, rows * cellSize);
    ctx.stroke();
  }
  for (let r = 0; r <= rows; r++) {
    const y = Math.round(r * cellSize) + 0.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(cols * cellSize, y);
    ctx.stroke();
  }
}

function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radius: number) {
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  // Fallback manual para ambientes sem CanvasRenderingContext2D.roundRect.
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Desenha um segmento do corpo (ou a cabeça) como um quadrado arredondado
 *  com leve gradiente diagonal — a cabeça usa raio maior e uma paleta
 *  própria (ver SnakeTheme.head) para se diferenciar visualmente do resto
 *  do corpo, como pedido: cabeça e corpo nunca usam a mesma cor exata. */
function drawSegment(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, colors: ColorPair, isHead: boolean) {
  const pad = size * (isHead ? 0.04 : 0.1);
  const radius = size * (isHead ? 0.4 : 0.22);
  const w = size - pad * 2;
  const h = size - pad * 2;

  const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
  gradient.addColorStop(0, colors.light);
  gradient.addColorStop(1, colors.dark);
  ctx.fillStyle = gradient;
  roundedRectPath(ctx, x + pad, y + pad, w, h, radius);
  ctx.fill();

  if (isHead) {
    // Leve brilho no topo-esquerda para dar volume à cabeça sem depender de
    // sombra (shadowBlur é reservado para o destaque da comida, ver abaixo).
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    roundedRectPath(ctx, x + pad, y + pad, w, h * 0.4, radius);
    ctx.fill();
  }
}

export interface DrawBoardParams {
  snake: Point[];
  food: Point;
  /** Tamanho lógico (px CSS, já descontado o devicePixelRatio) de cada célula. */
  cellSize: number;
  theme: SnakeTheme;
  /** Relógio contínuo (ex.: performance.now()) usado só para animar o pulso
   *  da comida — independente do "tick" do jogo, que controla apenas a
   *  velocidade de movimento da cobra. */
  timeMs: number;
  /** Instante (mesma base de `timeMs`) em que a última comida foi comida, e
   *  em que casa — usado para desenhar o anel de "pulso ao comer" que se
   *  expande e desaparece. `null` quando nenhuma comida foi comida ainda ou
   *  a animação já terminou. */
  eatenAtMs: number | null;
  eatenAtPoint: Point | null;
}

const EATEN_PULSE_DURATION_MS = 320;

/** Desenha o tabuleiro inteiro (fundo, grade, cobra, comida) no contexto 2D
 *  — chamado a cada frame do loop de animação (ver useCanvasRafLoop em
 *  Snake.tsx), sempre a partir dos dados mais recentes. */
export function drawBoard(ctx: CanvasRenderingContext2D, params: DrawBoardParams) {
  const { snake, food, cellSize, theme, timeMs, eatenAtMs, eatenAtPoint } = params;
  const widthPx = COLS * cellSize;
  const heightPx = ROWS * cellSize;

  ctx.clearRect(0, 0, widthPx, heightPx);
  ctx.fillStyle = theme.boardBackground;
  ctx.fillRect(0, 0, widthPx, heightPx);
  drawGridLines(ctx, COLS, ROWS, cellSize, theme.gridLine);

  // Corpo primeiro, cabeça por cima — evita que a cabeça fique coberta pelo
  // primeiro segmento do corpo quando eles se sobrepõem visualmente nas
  // bordas arredondadas.
  for (let i = snake.length - 1; i >= 1; i--) {
    const segment = snake[i];
    drawSegment(ctx, segment.x * cellSize, segment.y * cellSize, cellSize, theme.body, false);
  }
  const head = snake[0];
  drawSegment(ctx, head.x * cellSize, head.y * cellSize, cellSize, theme.head, true);

  // Comida: brilho vibrante com leve pulsação contínua (independente do
  // ritmo do jogo — puramente visual, calculada a partir do relógio do
  // próprio loop de desenho).
  const pulse = 0.86 + 0.14 * Math.sin(timeMs / 260);
  const cx = food.x * cellSize + cellSize / 2;
  const cy = food.y * cellSize + cellSize / 2;
  const radius = (cellSize / 2) * 0.72 * pulse;

  ctx.save();
  ctx.shadowColor = theme.food.light;
  ctx.shadowBlur = cellSize * 0.55 * pulse;
  const foodGradient = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.3, radius * 0.1, cx, cy, radius);
  foodGradient.addColorStop(0, theme.food.light);
  foodGradient.addColorStop(1, theme.food.dark);
  ctx.fillStyle = foodGradient;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (eatenAtMs !== null && eatenAtPoint) {
    const elapsed = timeMs - eatenAtMs;
    if (elapsed >= 0 && elapsed <= EATEN_PULSE_DURATION_MS) {
      const progress = elapsed / EATEN_PULSE_DURATION_MS;
      const ex = eatenAtPoint.x * cellSize + cellSize / 2;
      const ey = eatenAtPoint.y * cellSize + cellSize / 2;
      const ringRadius = (cellSize / 2) * (0.6 + progress * 1.2);

      ctx.save();
      ctx.globalAlpha = 1 - progress;
      ctx.strokeStyle = theme.food.light;
      ctx.lineWidth = Math.max(1.5, cellSize * 0.08);
      ctx.beginPath();
      ctx.arc(ex, ey, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}
