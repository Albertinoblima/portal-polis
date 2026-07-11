/**
 * Paginador DOM: fatia HTML de formato livre (parágrafos, títulos, citações, imagens)
 * em folhas ("páginas") que cabem numa área de N colunas × altura fixa, usando o
 * próprio layout de `columns` do navegador como fonte de verdade (mede overflow
 * horizontal de colunas implícitas via scrollWidth/clientWidth), em vez de recalcular
 * a altura manualmente. Componentes React interativos nunca passam por aqui — só
 * marcação estática (ver Newspaper.tsx).
 */

export interface PaginateOptions {
  /** Largura da área de conteúdo da página (todas as colunas juntas), em px. */
  pageWidthPx: number;
  /** Altura disponível para o texto fluir, em px. */
  columnHeightPx: number;
  columnsPerPage: number;
  columnGapPx?: number;
}

const SPLITTABLE_TAGS = new Set(["P", "LI", "BLOCKQUOTE", "DIV", "TD", "TH"]);

export function paginateHtml(html: string, options: PaginateOptions): string[] {
  if (typeof document === "undefined" || !html.trim()) return [html];

  const { pageWidthPx, columnHeightPx, columnsPerPage, columnGapPx = 32 } = options;

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
  probe.className = "prose prose-sm max-w-none";
  return probe;
}

/**
 * Tenta encaixar o máximo possível de `block` (sozinho) numa página vazia.
 * Blocos não-textuais (imagem, tabela, etc.) que não cabem sozinhos são aceitos
 * inteiros mesmo se ultrapassarem a coluna — perder a imagem seria pior.
 * Para blocos textuais, faz busca binária por número de palavras; o fragmento
 * que "sobra" perde formatação inline (negrito/links) nessa única quebra,
 * troca deliberada de fidelidade tipográfica por robustez do algoritmo.
 */
function splitBlock(
  block: HTMLElement,
  probe: HTMLElement,
  overflowed: () => boolean
): { fitted: HTMLElement | null; rest: HTMLElement | null } {
  if (!SPLITTABLE_TAGS.has(block.tagName)) {
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
