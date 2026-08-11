/**
 * Motor puro do Caça-Palavras: validação vetorial de seleção (8 direções),
 * conversão de coordenadas de ponteiro em casa da grade, e a paleta
 * harmônica por palavra. Nenhuma dependência de DOM/React — funções puras,
 * mesmo espírito de snakeEngine.ts/blocksEngine.ts/crosswordEngine.ts.
 *
 * Não é o mesmo arquivo que `src/lib/wordsearch.ts` (a camada de CONTEÚDO —
 * `WORDSEARCHES`, `buildWordSearchGrid`, documentada no CLAUDE.md como o
 * lugar onde editores publicam edições novas); este arquivo só cuida de
 * COMO interagir com uma grade já montada.
 */

import type { WordSearchCell, WordSearchPlacement } from "@/lib/wordsearch";
import { cellKey as coordsKey } from "@/lib/grid";

export function cellKey(cell: WordSearchCell): string {
  return coordsKey(cell.row, cell.col);
}

export function cellSetKey(cells: WordSearchCell[]): string {
  return cells.map(cellKey).sort().join(",");
}

/**
 * Se `start -> end` forma uma linha reta numa das 8 direções clássicas do
 * caça-palavras (incluindo o caso degenerado de uma única casa), devolve as
 * casas intermediárias em ordem; caso contrário `null` (seleção inválida,
 * ex.: um "L").
 *
 * A validação é vetorial: seja o vetor deslocamento (dRow, dCol) entre as
 * duas casas. Ele aponta para um múltiplo exato de 45° — 0°, 45°, 90°,
 * 135°, 180°, 225°, 270° ou 315° — se e somente se pelo menos um dos eixos
 * for zero (reta horizontal/vertical) OU os dois componentes tiverem a
 * MESMA magnitude (reta diagonal perfeita, já que tan(45°) = 1). Comparar
 * `|dRow| === |dCol|` é equivalente a checar o ângulo via
 * `Math.atan2(dRow, dCol)` e testar se é múltiplo de 45°, mas evita
 * qualquer imprecisão de ponto flutuante de trigonometria — a mesma
 * comparação inteira funciona sempre, em qualquer tamanho de grade.
 */
export function lineCells(start: WordSearchCell, end: WordSearchCell): WordSearchCell[] | null {
  const dRow = end.row - start.row;
  const dCol = end.col - start.col;
  if (dRow === 0 && dCol === 0) return [start];
  if (dRow !== 0 && dCol !== 0 && Math.abs(dRow) !== Math.abs(dCol)) return null;

  const steps = Math.max(Math.abs(dRow), Math.abs(dCol));
  const stepRow = Math.sign(dRow);
  const stepCol = Math.sign(dCol);
  const cells: WordSearchCell[] = [];
  for (let i = 0; i <= steps; i++) {
    cells.push({ row: start.row + stepRow * i, col: start.col + stepCol * i });
  }
  return cells;
}

export interface PlacementIndex {
  byKey: Map<string, WordSearchPlacement>;
  byWord: Map<string, WordSearchPlacement>;
}

export function buildPlacementIndex(placements: WordSearchPlacement[]): PlacementIndex {
  const byKey = new Map<string, WordSearchPlacement>();
  const byWord = new Map<string, WordSearchPlacement>();
  for (const placement of placements) {
    byKey.set(cellSetKey(placement.cells), placement);
    byWord.set(placement.word, placement);
  }
  return { byKey, byWord };
}

/**
 * Converte um ponto do ponteiro (coordenadas de tela) na casa da grade sob
 * ele, por cálculo geométrico puro a partir do retângulo do tabuleiro — em
 * vez de `document.elementFromPoint` (busca por hit-test no DOM). Mais
 * barato a cada `pointermove` (só aritmética, sem percorrer a árvore de
 * render) e imune a qualquer elemento sobreposto (como o SVG do overlay)
 * atrapalhar o hit-test.
 */
export function cellFromClientPoint(
  rect: DOMRect,
  cellPx: number,
  size: number,
  clientX: number,
  clientY: number
): WordSearchCell | null {
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  if (x < 0 || y < 0 || x >= rect.width || y >= rect.height || cellPx <= 0) return null;
  const col = Math.min(size - 1, Math.floor(x / cellPx));
  const row = Math.min(size - 1, Math.floor(y / cellPx));
  return { row, col };
}

/** Ponto médio (em unidades de célula) do início/fim de uma sequência de
 *  casas — usado para desenhar o segmento de reta do overlay SVG, cujo
 *  viewBox usa 1 unidade por célula. */
export function segmentFor(cells: WordSearchCell[]) {
  const start = cells[0];
  const end = cells[cells.length - 1];
  return { x1: start.col + 0.5, y1: start.row + 0.5, x2: end.col + 0.5, y2: end.row + 0.5 };
}

/** Paleta harmônica fixa para colorir cada palavra encontrada com uma cor
 *  distinta — reaproveita os mesmos 7 tons vivos já validados (claro/
 *  escuro) nas peças do Jogo dos Blocos (`--color-blocks-*` em
 *  globals.css) em vez de inventar uma paleta nova: já são visualmente
 *  distintos entre si e legíveis sobre o papel do jornal. Não são
 *  Tailwind utilities (só existem como CSS custom property crua, lidas
 *  aqui via `var()`), porque o Jogo dos Blocos as lê em tempo de execução
 *  num <canvas> — mas funcionam igual de bem como valor de `stroke`/`fill`
 *  num SVG comum, que é como este jogo as usa. */
const WORD_COLOR_VARS = [
  "--color-blocks-i",
  "--color-blocks-o",
  "--color-blocks-t",
  "--color-blocks-s",
  "--color-blocks-z",
  "--color-blocks-j",
  "--color-blocks-l",
] as const;

export function wordColorVar(index: number): string {
  return `var(${WORD_COLOR_VARS[index % WORD_COLOR_VARS.length]})`;
}
