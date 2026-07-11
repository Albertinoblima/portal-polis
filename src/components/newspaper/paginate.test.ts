import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { paginateHtml } from "@/components/newspaper/paginate";

/**
 * jsdom não faz layout real (scrollWidth/clientWidth sempre 0), então simulamos
 * o "estouro de coluna" com uma regra determinística baseada no tamanho do texto
 * dentro da sonda, em vez de medir pixels reais. Isso testa a lógica de
 * fatiamento/paginação isoladamente do motor de layout do navegador.
 */
const CAPACITY = 40;

function mockLayout() {
  Object.defineProperty(HTMLElement.prototype, "clientWidth", {
    configurable: true,
    get() {
      return 1000;
    },
  });
  Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
    configurable: true,
    get() {
      const length = (this.textContent ?? "").length;
      return length > CAPACITY ? 1000 + (length - CAPACITY) * 10 : 1000;
    },
  });
}

function textOf(pages: string[]): string {
  const div = document.createElement("div");
  div.innerHTML = pages.join("");
  return Array.from(div.children)
    .map((el) => (el.textContent ?? "").trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ");
}

describe("paginateHtml", () => {
  beforeEach(() => {
    mockLayout();
  });

  afterEach(() => {
    Reflect.deleteProperty(HTMLElement.prototype, "clientWidth");
    Reflect.deleteProperty(HTMLElement.prototype, "scrollWidth");
  });

  it("returns a single page when content fits within capacity", () => {
    const html = "<p>Curto.</p><p>Também curto.</p>";
    const pages = paginateHtml(html, { pageWidthPx: 600, columnHeightPx: 400, columnsPerPage: 2 });
    expect(pages).toHaveLength(1);
    expect(textOf(pages)).toBe("Curto. Também curto.");
  });

  it("splits across multiple pages without losing content", () => {
    const paragraphs = Array.from({ length: 6 }, (_, i) => `<p>Parágrafo número ${i} com algumas palavras.</p>`);
    const html = paragraphs.join("");
    const pages = paginateHtml(html, { pageWidthPx: 600, columnHeightPx: 400, columnsPerPage: 2 });

    expect(pages.length).toBeGreaterThan(1);
    expect(textOf(pages)).toBe(textOf(paragraphs));
  });

  it("splits a single oversized paragraph at word boundaries across pages", () => {
    const words = Array.from({ length: 60 }, (_, i) => `palavra${i}`);
    const html = `<p>${words.join(" ")}</p>`;
    const pages = paginateHtml(html, { pageWidthPx: 600, columnHeightPx: 400, columnsPerPage: 2 });

    expect(pages.length).toBeGreaterThan(1);
    expect(textOf(pages)).toBe(words.join(" "));
  });

  it("keeps a non-splittable block (image) intact even if it alone overflows", () => {
    const html = `<p>Texto antes.</p><img src="/foto.jpg" alt="Foto" /><p>Texto depois.</p>`;
    const pages = paginateHtml(html, { pageWidthPx: 600, columnHeightPx: 400, columnsPerPage: 2 });

    const div = document.createElement("div");
    div.innerHTML = pages.join("");
    expect(div.querySelectorAll("img")).toHaveLength(1);
  });

  it("returns the original html untouched when empty or whitespace-only", () => {
    expect(paginateHtml("", { pageWidthPx: 600, columnHeightPx: 400, columnsPerPage: 2 })).toEqual([""]);
    expect(paginateHtml("   ", { pageWidthPx: 600, columnHeightPx: 400, columnsPerPage: 2 })).toEqual(["   "]);
  });
});
