/**
 * Paginador DOM: fatia HTML de formato livre (parágrafos, títulos, citações, imagens)
 * em folhas ("páginas") que cabem numa área de N colunas × altura fixa, usando o
 * próprio layout de `columns` do navegador como fonte de verdade (mede overflow
 * horizontal de colunas implícitas via scrollWidth/clientWidth), em vez de recalcular
 * a altura manualmente. Componentes React interativos nunca passam por aqui — só
 * marcação estática (ver Newspaper.tsx).
 */

import { ARTICLE_PROSE_CLASSNAME } from "./proseClassName";

export interface PaginateOptions {
  /** Largura da área de conteúdo da página (todas as colunas juntas), em px. */
  pageWidthPx: number;
  /** Altura disponível para o texto fluir, em px. */
  columnHeightPx: number;
  columnsPerPage: number;
  columnGapPx?: number;
}

const TEXT_SPLITTABLE_TAGS = new Set(["P", "LI", "BLOCKQUOTE", "DIV", "TD", "TH"]);
const LIST_TAGS = new Set(["UL", "OL"]);

export function paginateHtml(html: string, options: PaginateOptions): string[] {
  if (typeof document === "undefined" || !html.trim()) return [html];

  // 36px = 2.25rem, precisa bater com o columnGap hardcoded em PageChrome.tsx
  // (o container que de fato renderiza o fragmento) — divergir aqui reintroduz
  // o mesmo tipo de subestimação de altura corrigido em createProbe().
  const { pageWidthPx, columnHeightPx, columnsPerPage, columnGapPx = 36 } = options;

  const source = document.createElement("div");
  source.innerHTML = html;
  const queue: HTMLElement[] = Array.from(source.children) as HTMLElement[];
  if (queue.length === 0) return [html];

  const probe = createProbe(pageWidthPx, columnHeightPx, columnsPerPage, columnGapPx);
  document.body.appendChild(probe);

  const overflowed = () => probe.scrollWidth > probe.clientWidth + 1;
  const rebuildProbe = (nodes: HTMLElement[]) => {
    probe.innerHTML = "";
    for (const node of nodes) probe.appendChild(node.cloneNode(true));
  };

  const pages: string[] = [];
  let current: HTMLElement[] = [];

  while (queue.length > 0) {
    const block = queue.shift() as HTMLElement;
    current.push(block);
    rebuildProbe(current);

    if (!overflowed()) continue;

    current.pop();

    if (current.length === 0) {
      const { fitted, rest } = splitBlock(block, probe, overflowed);
      if (fitted) current.push(fitted);
      if (rest) queue.unshift(rest);
      pages.push(serialize(current));
      current = [];
    } else {
      pages.push(serialize(current));
      current = [];
      queue.unshift(block);
    }
  }

  if (current.length > 0) pages.push(serialize(current));

  document.body.removeChild(probe);
  return pages.length > 0 ? pages : [html];
}

function serialize(nodes: HTMLElement[]): string {
  return nodes.map((node) => node.outerHTML).join("");
}

function createProbe(
  pageWidthPx: number,
  columnHeightPx: number,
  columnsPerPage: number,
  columnGapPx: number
): HTMLDivElement {
  const probe = document.createElement("div");
  probe.setAttribute("aria-hidden", "true");
  probe.style.position = "fixed";
  probe.style.visibility = "hidden";
  probe.style.pointerEvents = "none";
  probe.style.left = "-99999px";
  probe.style.top = "0";
  probe.style.width = `${pageWidthPx}px`;
  probe.style.height = `${columnHeightPx}px`;
  probe.style.columnWidth = "auto";
  probe.style.columnCount = String(columnsPerPage);
  probe.style.columnGap = `${columnGapPx}px`;
  probe.style.overflow = "hidden";
  // Importado de proseClassName.ts (mesma constante usada no render real do
  // fragmento, em Newspaper.tsx) de propósito — ver o comentário lá para o
  // porquê de nunca poder haver duas cópias divergentes dessa string.
  probe.className = ARTICLE_PROSE_CLASSNAME;
  return probe;
}

/**
 * Tenta encaixar o máximo possível de `block` (sozinho) numa página vazia.
 * Blocos não-textuais (imagem, tabela, etc.) que não cabem sozinhos são aceitos
 * inteiros mesmo se ultrapassarem a coluna — perder a imagem seria pior.
 * Para blocos textuais, faz busca binária por número de palavras; o fragmento
 * que "sobra" perde formatação inline (negrito/links) nessa única quebra,
 * troca deliberada de fidelidade tipográfica por robustez do algoritmo.
 * `<ul>`/`<ol>` têm sua própria busca binária por `<li>` (ver splitListBlock)
 * — sem isso, uma lista mais alta que uma página inteira era tratada como
 * bloco não-divisível (como uma imagem) e forçada inteira numa única página,
 * e o `overflow-hidden` real cortava os itens/o texto que não coubessem, sem
 * aviso nenhum.
 */
function splitBlock(
  block: HTMLElement,
  probe: HTMLElement,
  overflowed: () => boolean
): { fitted: HTMLElement | null; rest: HTMLElement | null } {
  if (LIST_TAGS.has(block.tagName)) {
    return splitListBlock(block, probe, overflowed);
  }

  if (!TEXT_SPLITTABLE_TAGS.has(block.tagName)) {
    return { fitted: block, rest: null };
  }

  const words = (block.textContent ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length <= 1) {
    return { fitted: block, rest: null };
  }

  let lo = 1;
  let hi = words.length;
  let best = 0;

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const candidate = block.cloneNode(false) as HTMLElement;
    candidate.textContent = words.slice(0, mid).join(" ");
    probe.innerHTML = "";
    probe.appendChild(candidate);
    if (overflowed()) {
      hi = mid - 1;
    } else {
      best = mid;
      lo = mid + 1;
    }
  }

  probe.innerHTML = "";

  if (best === 0) {
    return { fitted: block, rest: null };
  }

  const fitted = block.cloneNode(false) as HTMLElement;
  fitted.textContent = words.slice(0, best).join(" ");

  if (best >= words.length) {
    return { fitted, rest: null };
  }

  const rest = block.cloneNode(false) as HTMLElement;
  rest.textContent = words.slice(best).join(" ");

  return { fitted, rest };
}

/**
 * Mesma ideia de `splitBlock` (busca binária pelo máximo que cabe sozinho
 * numa página vazia), mas contando `<li>` inteiros em vez de palavras — cada
 * item preserva sua formatação interna intacta (nada de negrito/link
 * perdido, ao contrário do fallback textual de parágrafo). Se nem o primeiro
 * `<li>` sozinho couber, aceita a lista inteira (mesma política de "bloco
 * não-divisível" usada para imagens).
 */
function splitListBlock(
  block: HTMLElement,
  probe: HTMLElement,
  overflowed: () => boolean
): { fitted: HTMLElement | null; rest: HTMLElement | null } {
  const items = Array.from(block.children).filter((child) => child.tagName === "LI") as HTMLElement[];
  if (items.length <= 1) {
    return { fitted: block, rest: null };
  }

  let lo = 1;
  let hi = items.length;
  let best = 0;

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const candidate = block.cloneNode(false) as HTMLElement;
    for (const item of items.slice(0, mid)) candidate.appendChild(item.cloneNode(true));
    probe.innerHTML = "";
    probe.appendChild(candidate);
    if (overflowed()) {
      hi = mid - 1;
    } else {
      best = mid;
      lo = mid + 1;
    }
  }

  probe.innerHTML = "";

  if (best === 0) {
    return { fitted: block, rest: null };
  }

  const fitted = block.cloneNode(false) as HTMLElement;
  for (const item of items.slice(0, best)) fitted.appendChild(item.cloneNode(true));

  if (best >= items.length) {
    return { fitted, rest: null };
  }

  const rest = block.cloneNode(false) as HTMLElement;
  for (const item of items.slice(best)) rest.appendChild(item.cloneNode(true));
  // <ol> precisa continuar a numeração de onde parou na página anterior, não
  // reiniciar em 1 — soma o que já tinha em `start` (se a lista já vinha
  // fatiada de uma quebra anterior) com o nº de itens que ficaram em `fitted`.
  if (rest.tagName === "OL") {
    const previousStart = Number(block.getAttribute("start") ?? "1");
    rest.setAttribute("start", String(previousStart + best));
  }

  return { fitted, rest };
}
