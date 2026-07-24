export interface CrosswordEntry {
  number: number;
  direction: "across" | "down";
  row: number;
  col: number;
  answer: string;
  clue: string;
}

export interface CrosswordPuzzle {
  slug: string;
  /** Data de publicação (YYYY-MM-DD) — a edição do dia é sempre a mais recente já publicada. */
  date: string;
  theme: string;
  entries: CrosswordEntry[];
}

/**
 * Uma edição por dia, como no jornal impresso: para publicar a próxima,
 * basta acrescentar um novo objeto a este array com a data de amanhã — a
 * página de Palavras Cruzadas sempre exibe a edição mais recente já publicada.
 */
export const CROSSWORDS: CrosswordPuzzle[] = [
  {
    slug: "politicas-publicas",
    date: "2026-07-16",
    theme: "Políticas Públicas",
    entries: [
      {
        number: 1,
        direction: "down",
        row: 0,
        col: 0,
        answer: "IMPOSTO",
        clue: "Tributo cobrado pelo Estado sobre renda, consumo ou patrimônio.",
      },
      {
        number: 2,
        direction: "down",
        row: 0,
        col: 2,
        answer: "EDUCACAO",
        clue: "Direito social garantido pela Constituição, da creche à universidade.",
      },
      {
        number: 3,
        direction: "down",
        row: 0,
        col: 8,
        answer: "DEMOCRACIA",
        clue: "Regime em que o poder emana do povo, exercido direta ou indiretamente.",
      },
      {
        number: 4,
        direction: "down",
        row: 1,
        col: 6,
        answer: "SANEAMENTO",
        clue: "Política de água tratada e coleta de esgoto, essencial à saúde pública.",
      },
      {
        number: 5,
        direction: "across",
        row: 3,
        col: 0,
        answer: "ORCAMENTO",
        clue: "Peça que prevê receitas e despesas do governo para o ano.",
      },
      {
        number: 6,
        direction: "down",
        row: 3,
        col: 4,
        answer: "MUNICIPIO",
        clue: "Menor ente federativo, governado por um prefeito.",
      },
      {
        number: 7,
        direction: "across",
        row: 4,
        col: 0,
        answer: "SUA",
        clue: 'Pronome possessivo: "É ___ opinião que importa."',
      },
    ],
  },
  {
    slug: "pernambuco",
    date: "2026-07-24",
    theme: "Pernambuco",
    entries: [
      {
        number: 1,
        direction: "down",
        row: 0,
        col: 7,
        answer: "CARUARU",
        clue: "Cidade do Agreste famosa pela festa de São João e pelo Alto do Moura.",
      },
      {
        number: 2,
        direction: "down",
        row: 1,
        col: 0,
        answer: "CAPIBARIBE",
        clue: "Rio que corta a cidade do Recife, cenário do Carnaval sobre as águas.",
      },
      {
        number: 3,
        direction: "down",
        row: 1,
        col: 1,
        answer: "FREVO",
        clue: "Ritmo acelerado ao som de metais, dançado com passos rápidos e sombrinha no Carnaval do Recife.",
      },
      {
        number: 4,
        direction: "down",
        row: 1,
        col: 3,
        answer: "JANGADA",
        clue: "Embarcação tradicional de pescadores do litoral nordestino, feita de troncos amarrados.",
      },
      {
        number: 5,
        direction: "across",
        row: 3,
        col: 0,
        answer: "PERNAMBUCO",
        clue: "Estado nordestino cuja capital é o Recife.",
      },
      {
        number: 6,
        direction: "down",
        row: 3,
        col: 5,
        answer: "MARACATU",
        clue: "Manifestação afro-brasileira com cortejo de realeza, ao som de alfaias, típica de Pernambuco.",
      },
      {
        number: 7,
        direction: "down",
        row: 3,
        col: 9,
        answer: "OLINDA",
        clue: "Cidade histórica vizinha do Recife, Patrimônio Mundial da Unesco, famosa pelos bonecos gigantes de Carnaval.",
      },
    ],
  },
];

export interface CrosswordCell {
  letter: string | null;
  number: number | null;
}

export interface CrosswordGrid {
  rows: number;
  cols: number;
  cells: CrosswordCell[][];
}

export function buildCrosswordGrid(puzzle: CrosswordPuzzle): CrosswordGrid {
  let rows = 0;
  let cols = 0;
  for (const entry of puzzle.entries) {
    const endRow = entry.direction === "down" ? entry.row + entry.answer.length - 1 : entry.row;
    const endCol = entry.direction === "across" ? entry.col + entry.answer.length - 1 : entry.col;
    rows = Math.max(rows, endRow + 1);
    cols = Math.max(cols, endCol + 1);
  }

  const cells: CrosswordCell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ letter: null, number: null }))
  );

  for (const entry of puzzle.entries) {
    for (let i = 0; i < entry.answer.length; i++) {
      const r = entry.direction === "down" ? entry.row + i : entry.row;
      const c = entry.direction === "across" ? entry.col + i : entry.col;
      cells[r][c].letter = entry.answer[i];
    }
    const start = cells[entry.row][entry.col];
    if (start.number === null || entry.number < start.number) {
      start.number = entry.number;
    }
  }

  return { rows, cols, cells };
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
export function getCrosswordArchive(
  puzzles: CrosswordPuzzle[],
  referenceDate: string = todayIso()
): CrosswordPuzzle[] {
  return puzzles.filter((p) => p.date <= referenceDate).sort((a, b) => b.date.localeCompare(a.date));
}

/** A "edição de hoje" é sempre a publicação mais recente com data <= hoje —
 *  assim ela permanece no ar até a próxima ser publicada, como um jornal real.
 *  Aceita uma data de referência opcional (default: hoje) para casar uma
 *  edição de jornal específica com a cruzada que estava no ar naquela data. */
export function getLatestCrossword(
  puzzles: CrosswordPuzzle[],
  referenceDate: string = todayIso()
): CrosswordPuzzle | null {
  const eligible = getCrosswordArchive(puzzles, referenceDate);
  return eligible[0] ?? puzzles[0] ?? null;
}
