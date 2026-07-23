import type { Article, Edition } from "@/types";
import { getPublishedArticles } from "@/lib/content";
import { CROSSWORDS, getLatestCrossword, type CrosswordPuzzle } from "@/lib/crosswords";
import { WORDSEARCHES, getLatestWordSearch, type WordSearchPuzzle } from "@/lib/wordsearch";

function dateKey(publishedAt: string): string {
  return publishedAt.slice(0, 10);
}

/**
 * Agrupa as matérias publicadas pelo dia de publicação: cada dia com matéria
 * nova vira uma edição numerada, do mais antigo (edição nº 1) para o mais
 * recente — como um jornal real, onde a primeira matéria publicada abre a
 * primeira edição.
 */
export function getAllEditionsAscending(): Edition[] {
  const byDate = new Map<string, Edition["articles"]>();
  for (const article of getPublishedArticles()) {
    const key = dateKey(article.publishedAt);
    const bucket = byDate.get(key);
    if (bucket) bucket.push(article);
    else byDate.set(key, [article]);
  }

  return [...byDate.keys()]
    .sort()
    .map((date, index) => ({ number: index + 1, date, articles: byDate.get(date)! }));
}

/** Da edição mais recente para a mais antiga — ordem de exibição na Home e na Biblioteca. */
export function getAllEditions(): Edition[] {
  return [...getAllEditionsAscending()].reverse();
}

export function getEditionByNumber(number: number): Edition | null {
  return getAllEditionsAscending().find((edition) => edition.number === number) ?? null;
}

export function getLatestEdition(): Edition | null {
  const editions = getAllEditionsAscending();
  return editions[editions.length - 1] ?? null;
}

/** Encontra a edição (dia) à qual uma matéria pertence, pela data de publicação. */
export function getEditionForArticle(article: Article): Edition | null {
  const key = dateKey(article.publishedAt);
  return getAllEditionsAscending().find((edition) => edition.date === key) ?? null;
}

/** Casa a edição com a cruzada que estava no ar na data de publicação dela. */
export function getCrosswordForEdition(edition: Edition): CrosswordPuzzle | null {
  return getLatestCrossword(CROSSWORDS, edition.date);
}

/** Casa a edição com o caça-palavras que estava no ar na data de publicação dela. */
export function getWordSearchForEdition(edition: Edition): WordSearchPuzzle | null {
  return getLatestWordSearch(WORDSEARCHES, edition.date);
}
