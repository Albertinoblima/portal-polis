import { describe, expect, it } from "vitest";
import {
  getArticleBySlug,
  getArticlesByEditoria,
  getEditoriaBySlug,
  getEditorias,
  getPublishedArticles,
  getRelatedArticles,
  searchArticles,
} from "@/lib/content";

describe("getEditorias / getEditoriaBySlug", () => {
  it("only returns active editorias", () => {
    expect(getEditorias().every((e) => e.isActive)).toBe(true);
  });

  it("finds the 'politica' editoria by slug", () => {
    expect(getEditoriaBySlug("politica")?.slug).toBe("politica");
  });

  it("returns undefined for an unknown slug", () => {
    expect(getEditoriaBySlug("nao-existe")).toBeUndefined();
  });
});

describe("getPublishedArticles", () => {
  it("returns articles sorted by publishedAt, most recent first", () => {
    const articles = getPublishedArticles();
    const timestamps = articles.map((a) => new Date(a.publishedAt).getTime());
    const sorted = [...timestamps].sort((a, b) => b - a);
    expect(timestamps).toEqual(sorted);
  });

  it("only includes articles with status 'published'", () => {
    expect(getPublishedArticles().every((a) => a.status === "published")).toBe(true);
  });
});

describe("getArticleBySlug", () => {
  it("finds a published article by slug", () => {
    const [first] = getPublishedArticles();
    expect(getArticleBySlug(first.slug)?.id).toBe(first.id);
  });

  it("returns undefined for an unknown slug", () => {
    expect(getArticleBySlug("materia-que-nao-existe")).toBeUndefined();
  });
});

describe("getArticlesByEditoria", () => {
  it("only returns articles belonging to that editoria", () => {
    const editoria = getEditorias()[0];
    const articles = getArticlesByEditoria(editoria.slug);
    expect(articles.every((a) => a.editoriaId === editoria.id)).toBe(true);
  });

  it("returns an empty array for an unknown editoria slug", () => {
    expect(getArticlesByEditoria("nao-existe")).toEqual([]);
  });
});

describe("getRelatedArticles", () => {
  it("excludes the article itself and only includes the same editoria", () => {
    const [article] = getPublishedArticles();
    const related = getRelatedArticles(article);
    expect(related.every((a) => a.id !== article.id && a.editoriaId === article.editoriaId)).toBe(
      true
    );
  });
});

describe("searchArticles", () => {
  it("returns an empty array for a blank query", () => {
    expect(searchArticles("   ")).toEqual([]);
  });

  it("matches by title, subtitle or content case-insensitively", () => {
    const [article] = getPublishedArticles();
    const term = article.title.split(" ")[0];
    const results = searchArticles(term.toUpperCase());
    expect(results.some((a) => a.id === article.id)).toBe(true);
  });
});
