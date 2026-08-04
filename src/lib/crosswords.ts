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
  {
    slug: "cidades-de-pernambuco",
    date: "2026-07-26",
    theme: "Cidades de Pernambuco",
    entries: [
      {
        number: 1,
        direction: "down",
        row: 2,
        col: 0,
        answer: "IGARASSU",
        clue: "Cidade da Grande Recife considerada uma das mais antigas do Brasil, com o primeiro convento franciscano do país.",
      },
      {
        number: 2,
        direction: "down",
        row: 2,
        col: 1,
        answer: "PAULISTA",
        clue: "Cidade da Região Metropolitana do Recife, com longas praias urbanas como Janga e Maria Farinha.",
      },
      {
        number: 3,
        direction: "down",
        row: 2,
        col: 2,
        answer: "TRIUNFO",
        clue: "Cidade do Sertão, no Vale do Pajeú, uma das mais altas de Pernambuco e conhecida pelo clima frio.",
      },
      {
        number: 4,
        direction: "across",
        row: 3,
        col: 0,
        answer: "GARANHUNS",
        clue: 'Cidade do Agreste apelidada de "Suíça Pernambucana", sede do tradicional Festival de Inverno.',
      },
      {
        number: 5,
        direction: "down",
        row: 3,
        col: 3,
        answer: "ARCOVERDE",
        clue: "Cidade do Sertão, historicamente um dos principais entroncamentos rodoferroviários de Pernambuco.",
      },
      {
        number: 6,
        direction: "down",
        row: 3,
        col: 7,
        answer: "NORDESTE",
        clue: "Região do Brasil onde fica Pernambuco, ao lado de estados como Bahia e Ceará.",
      },
      {
        number: 7,
        direction: "down",
        row: 3,
        col: 8,
        answer: "SALGUEIRO",
        clue: 'Cidade do Sertão pernambucano, polo comercial conhecido como a "Capital do Sertão".',
      },
    ],
  },
  {
    slug: "democracia-e-soberania",
    date: "2026-07-27",
    theme: "Democracia e Soberania",
    entries: [
      {
        number: 1,
        direction: "down",
        row: 0,
        col: 6,
        answer: "SOBERANIA",
        clue: "Poder supremo de uma nação para decidir seus próprios rumos, sem interferência de outros países.",
      },
      {
        number: 2,
        direction: "down",
        row: 3,
        col: 5,
        answer: "TERRITORIO",
        clue: "Extensão de terra sob a jurisdição de um Estado — um dos elementos que sustentam a soberania nacional.",
      },
      {
        number: 3,
        direction: "down",
        row: 4,
        col: 3,
        answer: "GOVERNO",
        clue: "Conjunto de poderes e instituições que administram o Estado e executam suas políticas.",
      },
      {
        number: 4,
        direction: "down",
        row: 4,
        col: 8,
        answer: "CIDADANIA",
        clue: "Conjunto de direitos e deveres que ligam a pessoa ao Estado democrático.",
      },
      {
        number: 5,
        direction: "down",
        row: 4,
        col: 9,
        answer: "NACAO",
        clue: "Comunidade de um povo organizada politicamente sob um Estado soberano.",
      },
      {
        number: 6,
        direction: "across",
        row: 5,
        col: 0,
        answer: "DEMOCRACIA",
        clue: "Regime em que o poder emana do povo, exercido direta ou indiretamente.",
      },
      {
        number: 7,
        direction: "down",
        row: 5,
        col: 1,
        answer: "ESTADO",
        clue: "Ente político dotado de território, povo e governo próprio, reconhecido por outras nações.",
      },
    ],
  },
  {
    slug: "cultura-de-pernambuco",
    date: "2026-07-28",
    theme: "Cultura de Pernambuco",
    entries: [
      {
        number: 1,
        direction: "down",
        row: 1,
        col: 6,
        answer: "VITALINO",
        clue: "Mestre ceramista do Alto do Moura, em Caruaru, famoso pelas esculturas de barro do cotidiano nordestino.",
      },
      {
        number: 2,
        direction: "down",
        row: 2,
        col: 2,
        answer: "FREVO",
        clue: "Dança e ritmo símbolo do Carnaval de Pernambuco, com passos acelerados e o uso da sombrinha.",
      },
      {
        number: 3,
        direction: "across",
        row: 3,
        col: 0,
        answer: "MARACATU",
        clue: "Cortejo afro-brasileiro de realeza negra, ao som das alfaias, um dos maiores símbolos culturais de Pernambuco.",
      },
      {
        number: 3,
        direction: "down",
        row: 3,
        col: 0,
        answer: "MANGUEBEAT",
        clue: "Movimento musical surgido no Recife nos anos 1990, que misturou ritmos regionais a guitarras e rock.",
      },
      {
        number: 4,
        direction: "down",
        row: 3,
        col: 3,
        answer: "ARTESANATO",
        clue: "Produção manual de objetos como cerâmica e renda, tradição forte no Agreste pernambucano.",
      },
      {
        number: 5,
        direction: "down",
        row: 3,
        col: 4,
        answer: "CORDEL",
        clue: "Literatura popular em versos, geralmente ilustrada com xilogravura e vendida em folhetos de capa colorida.",
      },
    ],
  },
  {
    slug: "xadrez-politico",
    date: "2026-08-01",
    theme: "Xadrez Político",
    entries: [
      {
        number: 1,
        direction: "down",
        row: 1,
        col: 1,
        answer: "BASTIDORES",
        clue: "Onde ocorrem as negociações e articulações políticas, longe dos holofotes públicos.",
      },
      {
        number: 2,
        direction: "across",
        row: 3,
        col: 0,
        answer: "ESTRATEGIA",
        clue: "Plano de ação cuidadosamente arquitetado para vencer uma disputa, como num jogo de xadrez.",
      },
      {
        number: 2,
        direction: "down",
        row: 3,
        col: 0,
        answer: "ESQUEMA",
        clue: "Arranjo, muitas vezes velado, para articular apoios ou vantagens políticas.",
      },
      {
        number: 3,
        direction: "down",
        row: 3,
        col: 3,
        answer: "REI",
        clue: "Peça mais importante do tabuleiro de xadrez — na política, a figura central que concentra o poder.",
      },
      {
        number: 4,
        direction: "down",
        row: 3,
        col: 4,
        answer: "ALIANCA",
        clue: "Acordo entre partidos ou lideranças para somar forças em uma disputa eleitoral.",
      },
      {
        number: 5,
        direction: "down",
        row: 3,
        col: 7,
        answer: "GOVERNO",
        clue: "Conjunto de poderes e instituições que administram o Estado e executam suas políticas.",
      },
    ],
  },
  {
    slug: "ariano-suassuna",
    date: "2026-08-04",
    theme: "Ariano Suassuna",
    entries: [
      {
        number: 1,
        direction: "across",
        row: 3,
        col: 0,
        answer: "ARMORIAL",
        clue: "Movimento cultural criado por Ariano Suassuna em 1970, unindo cordel, xilogravura e repente à erudição.",
      },
      {
        number: 1,
        direction: "down",
        row: 3,
        col: 0,
        answer: "ARIANO",
        clue: "Primeiro nome do escritor paraibano criador do Auto da Compadecida, radicado no Recife.",
      },
      {
        number: 2,
        direction: "down",
        row: 3,
        col: 3,
        answer: "OBRA",
        clue: "Conjunto dos trabalhos literários e teatrais deixados por um autor.",
      },
      {
        number: 3,
        direction: "down",
        row: 3,
        col: 4,
        answer: "ROMANCE",
        clue: "Gênero narrativo do livro 'A Pedra do Reino', magnum opus de Suassuna.",
      },
      {
        number: 4,
        direction: "down",
        row: 3,
        col: 6,
        answer: "AUTO",
        clue: "Peça teatral popular de origem medieval — a mais famosa de Suassuna é 'da Compadecida'.",
      },
      {
        number: 5,
        direction: "down",
        row: 3,
        col: 7,
        answer: "LITERATURA",
        clue: "Arte da palavra escrita, que Suassuna enriqueceu ao valorizar a cultura popular nordestina.",
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
