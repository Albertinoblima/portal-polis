export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/**
 * Formata uma data "YYYY-MM-DD" pura (sem horário), como as de `Edition`,
 * `CrosswordPuzzle` e `WordSearchPuzzle`. `new Date("YYYY-MM-DD")` (usado por
 * `formatDate`) interpreta a string como meia-noite UTC — em fusos com offset
 * negativo isso volta um dia na hora de exibir. Construir a data a partir dos
 * componentes locais evita essa conversão.
 */
export function formatDateOnly(dateOnly: string): string {
  const [year, month, day] = dateOnly.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/** Formata segundos como "MM:SS", para cronômetros de jogos (Palavras Cruzadas, Caça-Palavras). */
export function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Com output: "export", o Next.js trata generateStaticParams() retornando um
 * array vazio como se a função nem existisse, e quebra o build inteiro. Um
 * Pólis recém-criado (ainda sem nenhuma matéria/editoria/colunista publicado)
 * cai exatamente nesse caso — este helper garante ao menos um parâmetro
 * "morto" (que nunca é linkado e resulta em 404) só para o export funcionar.
 */
export function withPlaceholderParam<T extends Record<string, string>>(params: T[], placeholder: T): T[] {
  return params.length > 0 ? params : [placeholder];
}
