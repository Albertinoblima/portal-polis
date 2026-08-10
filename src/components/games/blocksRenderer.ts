/**
 * Camada de visualização (Canvas 2D) do Jogo dos Blocos — funções puras de
 * desenho, sem estado próprio: recebem um contexto 2D já dimensionado e os
 * dados prontos do motor (blocksEngine.ts) e pintam o quadro atual. Nada
 * aqui lê nem escreve estado do jogo — só transforma dados em pixels.
 */

import { COLS, ROWS, PIECES, pieceCells, type BoardMatrix, type PieceState, type PieceType } from "./blocksEngine";

export interface PieceColors {
  light: string;
  dark: string;
}

/** Paleta resolvida a partir das CSS Custom Properties do tema atual (ver
 *  `--color-blocks-*` em globals.css) — o Canvas não entende `var(...)`
 *  diretamente, então isto é lido uma vez por render via `getComputedStyle`
 *  e cacheado pelo chamador (não a cada frame do loop de animação). */
export interface BlocksTheme {
  boardBackground: string;
  gridLine: string;
  gold: string;
  pieces: Record<PieceType, PieceColors>;
}

const PIECE_VAR_NAMES: Record<PieceType, string> = {
  I: "i",
  O: "o",
  T: "t",
  S: "s",
  Z: "z",
  J: "j",
  L: "l",
};

export function resolveBlocksTheme(scopeElement: Element): BlocksTheme {
  const style = getComputedStyle(scopeElement);
  const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;

  const pieces = {} as Record<PieceType, PieceColors>;
  (Object.keys(PIECE_VAR_NAMES) as PieceType[]).forEach((type) => {
    const suffix = PIECE_VAR_NAMES[type];
    pieces[type] = {
      light: read(`--color-blocks-${suffix}`, "#888888"),
      dark: read(`--color-blocks-${suffix}-dark`, "#555555"),
    };
  });

  return {
    // Lê os tokens de tema "crus" (--color-paper, não --color-polis-paper):
    // os aliases --color-polis-* só existem dentro do bloco `@theme inline`
    // do Tailwind, que resolve/embute os valores em tempo de BUILD dentro de
    // cada utilitária gerada (por isso o nome "inline") — nunca chegam a
    // existir como custom property de verdade em tempo de execução, então
    // `getComputedStyle` sempre voltaria vazio para eles (foi exatamente
    // isso que deixou as peças cinzas na primeira versão deste arquivo).
    boardBackground: read("--color-paper", "#f4f1e9"),
    gridLine: read("--color-blocks-grid-line", "rgba(0,0,0,0.08)"),
    gold: read("--color-gold", "#c9a227"),
    pieces,
  };
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Bloco preenchido: gradiente diagonal + bisel (aresta clara no topo,
 *  escura embaixo) para dar volume — em vez de uma cor chapada. */
function drawFilledCell(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, colors: PieceColors, flashing: boolean, goldColor: string) {
  const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
  gradient.addColorStop(0, colors.light);
  gradient.addColorStop(1, colors.dark);
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, size, size);

  const bevel = Math.max(1, size * 0.06);
  ctx.lineWidth = bevel;
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.beginPath();
  ctx.moveTo(x + bevel / 2, y + size - bevel / 2);
  ctx.lineTo(x + bevel / 2, y + bevel / 2);
  ctx.lineTo(x + size - bevel / 2, y + bevel / 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(0,0,0,0.28)";
  ctx.beginPath();
  ctx.moveTo(x + size - bevel / 2, y + bevel / 2);
  ctx.lineTo(x + size - bevel / 2, y + size - bevel / 2);
  ctx.lineTo(x + bevel / 2, y + size - bevel / 2);
  ctx.stroke();

  if (flashing) {
    const ring = Math.max(2, size * 0.1);
    ctx.lineWidth = ring;
    ctx.strokeStyle = goldColor;
    ctx.strokeRect(x + ring / 2, y + ring / 2, size - ring, size - ring);
  }
}

/** Peça-fantasma (ghost): projeção translúcida na cor da peça atual,
 *  mostrando exatamente onde ela vai pousar. */
function drawGhostCell(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, colors: PieceColors) {
  ctx.fillStyle = hexToRgba(colors.light, 0.16);
  ctx.fillRect(x, y, size, size);
  const stroke = Math.max(1.5, size * 0.07);
  ctx.lineWidth = stroke;
  ctx.strokeStyle = hexToRgba(colors.light, 0.55);
  ctx.strokeRect(x + stroke / 2, y + stroke / 2, size - stroke, size - stroke);
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

export interface DrawBoardParams {
  board: BoardMatrix;
  current: PieceState | null;
  ghostCells: { row: number; col: number }[];
  clearFlash: boolean;
  /** Tamanho lógico (px CSS, já descontado o devicePixelRatio) de cada célula. */
  cellSize: number;
  theme: BlocksTheme;
}

/** Desenha o tabuleiro inteiro (fundo, grade, fantasma, peças) no contexto
 *  2D — chamado a cada frame do loop de animação (ver useBoardCanvas em
 *  Blocks.tsx), sempre a partir dos dados mais recentes. */
export function drawBoard(ctx: CanvasRenderingContext2D, params: DrawBoardParams) {
  const { board, current, ghostCells, clearFlash, cellSize, theme } = params;
  const widthPx = COLS * cellSize;
  const heightPx = ROWS * cellSize;

  ctx.clearRect(0, 0, widthPx, heightPx);
  ctx.fillStyle = theme.boardBackground;
  ctx.fillRect(0, 0, widthPx, heightPx);
  drawGridLines(ctx, COLS, ROWS, cellSize, theme.gridLine);

  const ghostSet = new Set(ghostCells.map(({ row, col }) => `${row}:${col}`));

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const locked = board[r][c];
      if (locked) {
        drawFilledCell(ctx, c * cellSize, r * cellSize, cellSize, theme.pieces[locked], clearFlash, theme.gold);
      } else if (ghostSet.has(`${r}:${c}`) && current) {
        drawGhostCell(ctx, c * cellSize, r * cellSize, cellSize, theme.pieces[current.type]);
      }
    }
  }

  if (current) {
    for (const { row, col } of pieceCells(current)) {
      if (row < 0) continue;
      drawFilledCell(ctx, col * cellSize, row * cellSize, cellSize, theme.pieces[current.type], clearFlash, theme.gold);
    }
  }
}

/** Desenha a miniatura da "Próxima" peça, centralizada no quadro-guia dela. */
export function drawNextPreview(ctx: CanvasRenderingContext2D, type: PieceType | null, cellSize: number, theme: BlocksTheme) {
  const shape = type ? PIECES[type] : null;
  const size = shape ? shape.size : 4;
  const widthPx = size * cellSize;
  const heightPx = size * cellSize;
  ctx.clearRect(0, 0, widthPx, heightPx);
  if (!type || !shape) return;

  for (const [r, c] of shape.cells) {
    drawFilledCell(ctx, c * cellSize, r * cellSize, cellSize, theme.pieces[type], false, theme.gold);
  }
}
