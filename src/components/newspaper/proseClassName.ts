// Classe Tailwind Typography do corpo da matéria — usada tanto no render
// real (Newspaper.tsx) quanto na sonda invisível do paginador
// (paginate.ts/createProbe). As duas PRECISAM ficar idênticas: se
// divergirem, a sonda mede a altura do texto num tamanho de fonte diferente
// do que é renderizado de verdade, o cálculo de quanto conteúdo cabe por
// página fica errado, e o fim do texto estoura silenciosamente a página
// (`overflow-hidden`), sem nenhum aviso — foi exatamente assim que o bug de
// texto sumindo aconteceu antes. Um único ponto de verdade, importado nos
// dois lugares, elimina esse jeito de quebrar por divergência de cópias.
export const ARTICLE_PROSE_CLASSNAME =
  "prose prose-base max-w-none prose-headings:font-sans prose-blockquote:font-serif prose-blockquote:italic";
