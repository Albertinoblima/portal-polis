import type { Article, Editoria, User } from "@/types";
import editoriasData from "@/content/editorias.json";
import authorsData from "@/content/authors.json";
import articlesData from "@/content/articles.json";

const editorias = editoriasData as Editoria[];
const authors = authorsData as User[];
const articles = articlesData as Article[];

function isPublished(article: Article): boolean {
  return article.status === "published" && new Date(article.publishedAt) <= new Date();
}

export function getEditorias(): Editoria[] {
  return editorias.filter((e) => e.isActive);
}

export function getEditoriaBySlug(slug: string): Editoria | undefined {
  return editorias.find((e) => e.slug === slug);
}

export function getEditoriaById(id: string): Editoria | undefined {
  return editorias.find((e) => e.id === id);
}

export function getAuthors(): User[] {
  return authors;
}

export function getAuthorBySlug(slug: string): User | undefined {
  return authors.find((a) => a.id === slug || slugify(a.name) === slug);
}

export function getPublishedArticles(): Article[] {
  return [...articles]
    .filter(isPublished)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug && isPublished(a));
}

export function getArticlesByEditoria(editoriaSlug: string): Article[] {
  const editoria = getEditoriaBySlug(editoriaSlug);
  if (!editoria) return [];
  return getPublishedArticles().filter((a) => a.editoriaId === editoria.id);
}

export function getArticlesByAuthor(authorId: string): Article[] {
  return getPublishedArticles().filter((a) => a.authorId === authorId);
}

export function getRelatedArticles(article: Article, limit = 3): Article[] {
  return getPublishedArticles()
    .filter((a) => a.id !== article.id && a.editoriaId === article.editoriaId)
    .slice(0, limit);
}

export function searchArticles(query: string): Article[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return getPublishedArticles().filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.subtitle.toLowerCase().includes(q) ||
      a.content.toLowerCase().includes(q)
  );
}

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
