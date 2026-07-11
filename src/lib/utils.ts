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
