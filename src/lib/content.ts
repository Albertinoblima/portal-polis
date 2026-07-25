import type { Article, Editoria, User } from "@/types";
import editoriasData from "@/content/editorias.json";
import authorsData from "@/content/authors.json";
import articlesData from "@/content/articles.json";
import { slugify } from "@/lib/utils";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Gerado por scripts/generate-audio.mjs (Piper TTS) em CI, antes do `next
// build`. Lido via fs (em vez de `import ... from "@/content/audio-manifest.json"`)
// porque esse arquivo só existe depois da primeira rodada do script — um
// import estático quebraria o build antes disso.
function loadAudioManifest(): Record<string, { file: string }> {
  try {
    const manifestPath = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "..",
      "content",
      "audio-manifest.json"
    );
    return JSON.parse(readFileSync(manifestPath, "utf-8"));
  } catch {
    return {};
  }
}

const audioManifest = loadAudioManifest();

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

export function getArticleAudioUrl(slug: string): string | undefined {
  return audioManifest[slug]?.file;
}
