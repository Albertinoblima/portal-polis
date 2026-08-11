/**
 * Motor puro de interação das Palavras Cruzadas: índice célula → palavra(s),
 * navegação (digitação sequencial, teclas de seta "pulando" blocos pretos,
 * dica seguinte/anterior) e verificação de conclusão. Nenhuma dependência de
 * DOM ou React — só estruturas de dados e funções puras, mesmo espírito de
 * snakeEngine.ts/blocksEngine.ts/tictactoeEngine.ts.
 *
 * Importante: isto NÃO é o mesmo arquivo que `src/lib/crosswords.ts` (a
 * camada de CONTEÚDO — tipos da edição, `CROSSWORDS`, `buildCrosswordGrid`).
 * Este arquivo só cuida de COMO navegar/interagir com uma grade já montada;
 * o CLAUDE.md documenta `crosswords.ts` como a camada que editores tocam
 * para publicar edições novas, então ela fica intocada por este trabalho.
 */

import type { CrosswordCell, CrosswordEntry } from "@/lib/crosswords";
import { cellKey } from "@/lib/grid";

export type Direction = "across" | "down";

export interface Position {
  row: number;
  col: number;
}

export type EntryIndex = Map<string, Partial<Record<Direction, CrosswordEntry>>>;

/** Índice célula → entrada(s) que passam por ela (no máximo uma "across" e
 *  uma "down" por célula). `buildCrosswordGrid` (crosswords.ts) não expõe
 *  isso — só devolve letras/números crus — então é remontado aqui a partir
 *  da lista de entradas, uma vez por quebra-cabeça. */
export function buildEntryIndex(entries: CrosswordEntry[]): EntryIndex {
  const map: EntryIndex = new Map();
  for (const entry of entries) {
    for (let i = 0; i < entry.answer.length; i++) {
      const r = entry.direction === "down" ? entry.row + i : entry.row;
      const c = entry.direction === "across" ? entry.col + i : entry.col;
      const key = cellKey(r, c);
      const existing = map.get(key) ?? {};
      existing[entry.direction] = entry;
      map.set(key, existing);
    }
  }
  return map;
}

export function entryAt(index: EntryIndex, pos: Position, dir: Direction): CrosswordEntry | undefined {
  return index.get(cellKey(pos.row, pos.col))?.[dir];
}

/** Todas as casas ocupadas por uma entrada, em ordem — usada para destacar
 *  a palavra inteira no tabuleiro. */
export function wordCells(entry: CrosswordEntry): Position[] {
  return Array.from({ length: entry.answer.length }, (_, i) => ({
    row: entry.direction === "down" ? entry.row + i : entry.row,
    col: entry.direction === "across" ? entry.col + i : entry.col,
  }));
}

export function isFullyCorrect(cells: CrosswordCell[][], answers: string[][]): boolean {
  for (let r = 0; r < cells.length; r++) {
    for (let c = 0; c < cells[r].length; c++) {
      const cell = cells[r][c];
      if (cell.letter && answers[r]?.[c] !== cell.letter) return false;
    }
  }
  return true;
}

/** Um passo na direção indicada, SEM pular blocos: para (devolve `null`) se
 *  a próxima casa for bloqueada ou sair da grade. Usada para o avanço
 *  automático ao digitar e para o Backspace-recua — os dois devem ficar
 *  contidos dentro da palavra atual, nunca "vazar" pra outra. */
export function moveOneStep(cells: CrosswordCell[][], pos: Position, dir: Direction, delta: 1 | -1): Position | null {
  const row = dir === "down" ? pos.row + delta : pos.row;
  const col = dir === "across" ? pos.col + delta : pos.col;
  if (row < 0 || row >= cells.length || col < 0 || col >= (cells[0]?.length ?? 0)) return null;
  if (!cells[row][col].letter) return null;
  return { row, col };
}

/** Navegação por seta "inteligente": ao contrário de `moveOneStep`, continua
 *  varrendo na mesma direção por cima de blocos pretos até achar a próxima
 *  casa de letra (ou sair da grade, devolvendo `null`) — é o comportamento
 *  padrão de apps de palavras cruzadas modernos (ex.: NYT), onde a seta
 *  nunca fica "presa" contra um bloco no meio do caminho. */
export function moveArrowSmart(cells: CrosswordCell[][], pos: Position, dir: Direction, delta: 1 | -1): Position | null {
  const rows = cells.length;
  const cols = cells[0]?.length ?? 0;
  let row = pos.row;
  let col = pos.col;

  for (;;) {
    row = dir === "down" ? row + delta : row;
    col = dir === "across" ? col + delta : col;
    if (row < 0 || row >= rows || col < 0 || col >= cols) return null;
    if (cells[row][col].letter) return { row, col };
  }
}

/** Lista combinada de todas as entradas (horizontais + verticais) na ordem
 *  de resolução padrão: por número e, dentro do mesmo número, horizontal
 *  antes de vertical. Base para "próxima dica"/"dica anterior". */
export function orderedEntries(entries: CrosswordEntry[]): CrosswordEntry[] {
  return [...entries].sort((a, b) => a.number - b.number || (a.direction === "across" ? -1 : 1));
}

/** Dica seguinte/anterior na ordem de resolução, com wraparound — usada
 *  pela barra de dica ativa (mobile) para navegar sem precisar tocar
 *  diretamente numa casa do tabuleiro. */
export function neighborEntry(all: CrosswordEntry[], current: CrosswordEntry | undefined, delta: 1 | -1): CrosswordEntry | undefined {
  if (all.length === 0) return undefined;
  if (!current) return all[0];
  const index = all.findIndex((e) => e.number === current.number && e.direction === current.direction);
  if (index === -1) return all[0];
  return all[(index + delta + all.length) % all.length];
}
