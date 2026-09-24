// Matérias do painel administrativo, gravadas 100% via GitHub Contents API —
// sem Supabase. Cada criação/edição/arquivamento é um commit direto na
// branch de produção (dispara o workflow de deploy existente), então não
// precisa de nenhum gatilho de rebuild separado (ver
// .github/workflows/deploy.yml), ao contrário do antigo triggerSiteRebuild()
// (Edge Function do Supabase).
//
// O manifesto (`src/content/articles.json`) agora é gerenciado só por aqui —
// `scripts/sync-content.mjs` não sincroniza mais a tabela `articles` do
// Supabase, então este arquivo nunca é sobrescrito no build. Ele guarda
// TODAS as matérias (qualquer status), e o site público filtra as
// publicadas em src/lib/content.ts (getPublishedArticles), então salvar um
// rascunho aqui é seguro e não aparece no site.
import type { Article, ArticleStatus } from "@/types";
import { getFile, putFile } from "./client";

const MANIFEST_PATH = "src/content/articles.json";

export interface ArticleInput {
    title: string;
    slug: string;
    subtitle: string;
    content: string;
    featuredImage: string;
    featuredImageAlt: string;
    editoriaId: string;
    authorId: string;
    status: ArticleStatus;
    scheduledAt: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
    readingTimeMinutes: number;
    tagIds: string[];
}

async function readManifest(token: string): Promise<{ items: Article[]; sha: string | null }> {
    const file = await getFile(token, MANIFEST_PATH);
    if (!file) return { items: [], sha: null };
    try {
        return { items: JSON.parse(file.text) as Article[], sha: file.sha };
    } catch {
        return { items: [], sha: file.sha };
    }
}

async function writeManifest(
    token: string,
    items: Article[],
    sha: string | null,
    message: string
): Promise<void> {
    const text = `${JSON.stringify(items, null, 2)}\n`;
    await putFile(token, MANIFEST_PATH, text, message, sha ?? undefined);
}

export async function listArticles(token: string): Promise<Article[]> {
    const { items } = await readManifest(token);
    return [...items].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export async function getArticleById(token: string, id: string): Promise<Article | null> {
    const { items } = await readManifest(token);
    return items.find((article) => article.id === id) ?? null;
}

export async function createArticle(token: string, input: ArticleInput): Promise<Article> {
    const { items, sha } = await readManifest(token);
    const now = new Date().toISOString();

    const article: Article = {
        id: crypto.randomUUID(),
        title: input.title,
        slug: input.slug,
        subtitle: input.subtitle,
        content: input.content,
        featuredImage: input.featuredImage,
        featuredImageAlt: input.featuredImageAlt,
        editoriaId: input.editoriaId,
        authorId: input.authorId,
        categoryIds: [],
        tagIds: input.tagIds,
        status: input.status,
        publishedAt: input.status === "published" ? now : (input.scheduledAt ?? now),
        scheduledAt: input.scheduledAt ?? undefined,
        seoTitle: input.seoTitle ?? undefined,
        seoDescription: input.seoDescription ?? undefined,
        readingTimeMinutes: input.readingTimeMinutes,
        viewCount: 0,
        createdAt: now,
        updatedAt: now,
    };

    await writeManifest(token, [article, ...items], sha, `content(article): cria "${input.title}"`);
    return article;
}

export async function updateArticle(token: string, id: string, input: ArticleInput): Promise<Article> {
    const { items, sha } = await readManifest(token);
    const existing = items.find((article) => article.id === id);
    if (!existing) throw new Error("Matéria não encontrada.");

    const now = new Date().toISOString();
    const updated: Article = {
        ...existing,
        title: input.title,
        slug: input.slug,
        subtitle: input.subtitle,
        content: input.content,
        featuredImage: input.featuredImage,
        featuredImageAlt: input.featuredImageAlt,
        editoriaId: input.editoriaId,
        authorId: input.authorId,
        tagIds: input.tagIds,
        status: input.status,
        publishedAt: input.status === "published" ? now : existing.publishedAt,
        scheduledAt: input.scheduledAt ?? undefined,
        seoTitle: input.seoTitle ?? undefined,
        seoDescription: input.seoDescription ?? undefined,
        readingTimeMinutes: input.readingTimeMinutes,
        updatedAt: now,
    };

    const next = items.map((article) => (article.id === id ? updated : article));
    await writeManifest(token, next, sha, `content(article): atualiza "${input.title}"`);
    return updated;
}

export async function setArticleStatus(token: string, id: string, status: ArticleStatus): Promise<void> {
    const { items, sha } = await readManifest(token);
    const now = new Date().toISOString();
    const next = items.map((article) =>
        article.id === id
            ? {
                ...article,
                status,
                publishedAt: status === "published" ? now : article.publishedAt,
                updatedAt: now,
            }
            : article
    );
    await writeManifest(token, next, sha, `content(article): altera status para "${status}"`);
}
