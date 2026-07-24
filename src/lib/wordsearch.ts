export interface WordSearchPuzzle {
  slug: string;
  /** Data de publicação (YYYY-MM-DD) — a edição do dia é sempre a mais recente já publicada. */
  date: string;
  theme: string;
  /** Tamanho do lado da grade (ela é sempre quadrada: size x size). */
  size: number;
  /** MAIÚSCULAS, sem acento/cedilha/espaço — mesma convenção das palavras cruzadas. */
  words: string[];
}

/**
 * Uma edição por dia, como no jornal impresso: para publicar a próxima,
 * basta acrescentar um novo objeto a este array com a data de amanhã — a
 * página de Caça-Palavras sempre exibe a edição mais recente já publicada.
 */
export const WORDSEARCHES: WordSearchPuzzle[] = [
  {
    slug: "democracia",
    date: "2026-07-16",
    theme: "Democracia",
    size: 14,
    words: [
      "DEMOCRACIA",
      "VOTO",
      "ELEICAO",
      "CIDADANIA",
      "REPUBLICA",
      "CONSTITUICAO",
      "SUFRAGIO",
      "PLEBISCITO",
      "LEGISLATIVO",
      "JUDICIARIO",
      "LIBERDADE",
      "SOBERANIA",
    ],
  },
  {
    slug: "pernambuco",
    date: "2026-07-24",
    theme: "Pernambuco",
    size: 14,
    words: [
      "PERNAMBUCO",
      "RECIFE",
      "OLINDA",
      "FREVO",
      "MARACATU",
      "CAPIBARIBE",
      "CARUARU",
      "PETROLINA",
      "FORRO",
      "JANGADA",
      "AGRESTE",
      "SERTAO",
    ],
  },
];

export interface WordSearchCell {
  row: number;
  col: number;
}

export interface WordSearchPlacement {
  word: string;
  cells: WordSearchCell[];
}

export interface WordSearchGrid {
  size: number;
  letters: string[][];
  placements: WordSearchPlacement[];
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** As 8 direções clássicas de um caça-palavras: para a frente e de trás para
 *  frente, nos eixos horizontal, vertical e as duas diagonais. */
const DIRECTIONS: WordSearchCell[] = [
  { row: 0, col: 1 },
  { row: 0, col: -1 },
  { row: 1, col: 0 },
  { row: -1, col: 0 },
  { row: 1, col: 1 },
  { row: -1, col: -1 },
  { row: 1, col: -1 },
  { row: -1, col: 1 },
];

/** Hash determinístico (FNV-1a) de uma string para semente numérica — o
 *  mesmo slug sempre produz a mesma semente, em qualquer ambiente. */
function hashSeed(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Gerador pseudoaleatório determinístico (mulberry32): dada a mesma
 *  semente, produz sempre a mesma sequência de números — essencial para que
 *  a grade renderizada no servidor seja idêntica à do cliente (usar
 *  Math.random() aqui quebraria a hidratação, já que cada ambiente sortearia
 *  um resultado diferente). */
function mulberry32(seed: number): () => number {
  let state = seed;
  return function random() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Monta a grade a partir da lista de palavras: cada uma é posicionada em uma
 * das 8 direções, permitindo cruzamentos quando a letra compartilhada
 * bate — e as casas sobrando são preenchidas com letras aleatórias. Tudo
 * determinístico a partir do `slug` (ver mulberry32 acima).
 */
export function buildWordSearchGrid(puzzle: WordSearchPuzzle): WordSearchGrid {
  const { size } = puzzle;
  const random = mulberry32(hashSeed(puzzle.slug));
  const letters: (string | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));
  const placements: WordSearchPlacement[] = [];

  const words = [...puzzle.words].sort((a, b) => b.length - a.length);

  for (const word of words) {
    let placed = false;

    for (let attempt = 0; attempt < 500 && !placed; attempt++) {
      const direction = DIRECTIONS[Math.floor(random() * DIRECTIONS.length)];
      const row = Math.floor(random() * size);
      const col = Math.floor(random() * size);
      const cells: WordSearchCell[] = [];
      let fits = true;

      for (let i = 0; i < word.length; i++) {
        const r = row + direction.row * i;
        const c = col + direction.col * i;
        if (r < 0 || r >= size || c < 0 || c >= size) {
          fits = false;
          break;
        }
        const existing = letters[r][c];
        if (existing !== null && existing !== word[i]) {
          fits = false;
          break;
        }
        cells.push({ row: r, col: c });
      }

      if (!fits) continue;

      for (let i = 0; i < word.length; i++) {
        letters[cells[i].row][cells[i].col] = word[i];
      }
      placements.push({ word, cells });
      placed = true;
    }

    if (!placed) {
      throw new Error(
        `Não foi possível posicionar "${word}" na grade ${size}x${size} do caça-palavras "${puzzle.slug}". ` +
          "Aumente `size` ou revise a lista de palavras em WORDSEARCHES."
      );
    }
  }

  const finalLetters: string[][] = letters.map((rowCells) =>
    rowCells.map((cell) => cell ?? ALPHABET[Math.floor(random() * ALPHABET.length)])
  );

  return { size, letters: finalLetters, placements };
}

function todayIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Todas as edições já publicadas (data <= referência), da mais recente para a
 *  mais antiga — usado pela página de arquivo para listar e navegar entre as
 *  edições passadas em vez de simplesmente descartá-las quando uma nova sai. */
export function getWordSearchArchive(
  puzzles: WordSearchPuzzle[],
  referenceDate: string = todayIso()
): WordSearchPuzzle[] {
  return puzzles.filter((p) => p.date <= referenceDate).sort((a, b) => b.date.localeCompare(a.date));
}

/** A "edição de hoje" é sempre a publicação mais recente com data <= hoje —
 *  assim ela permanece no ar até a próxima ser publicada, como um jornal real.
 *  Aceita uma data de referência opcional (default: hoje) para casar uma
 *  edição de jornal específica com o caça-palavras que estava no ar naquela data. */
export function getLatestWordSearch(
  puzzles: WordSearchPuzzle[],
  referenceDate: string = todayIso()
): WordSearchPuzzle | null {
  const eligible = getWordSearchArchive(puzzles, referenceDate);
  return eligible[0] ?? puzzles[0] ?? null;
}
