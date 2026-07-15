import type { MetadataRoute } from "next";
import { getAuthors, getEditorias, getPublishedArticles } from "@/lib/content";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-static";

const staticPaths = [
  "",
  "sobre",
  "contato",
  "newsletter",
  "busca",
  "colunistas",
  "entretenimento",
  "entretenimento/jogos",
  "entretenimento/jogos/jogo-da-velha",
  "entretenimento/palavras-cruzadas",
  "lgpd",
  "politica-de-privacidade",
  "politica-de-cookies",
  "termos-de-uso",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = staticPaths.map((path) => ({
    url: path ? `${SITE_URL}/${path}/` : `${SITE_URL}/`,
    lastModified: new Date(),
  }));

  const articleRoutes = getPublishedArticles().map((article) => ({
    url: `${SITE_URL}/materia/${article.slug}/`,
    lastModified: new Date(article.updatedAt),
  }));

  const editoriaRoutes = getEditorias().map((editoria) => ({
    url: `${SITE_URL}/editoria/${editoria.slug}/`,
    lastModified: new Date(),
  }));

  const authorRoutes = getAuthors().map((author) => ({
    url: `${SITE_URL}/colunista/${author.id}/`,
    lastModified: new Date(),
  }));

  return [...staticRoutes, ...articleRoutes, ...editoriaRoutes, ...authorRoutes];
}
