import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ArticleCard } from "@/components/articles/ArticleCard";
import type { Article, Editoria } from "@/types";

const article: Article = {
  id: "art-1",
  title: "Reforma tributária avança no Congresso",
  slug: "reforma-tributaria-avanca",
  subtitle: "Entenda os próximos passos da votação.",
  content: "<p>Conteúdo completo da matéria.</p>",
  featuredImage: "/content/placeholder.jpg",
  featuredImageAlt: "Plenário do Congresso",
  editoriaId: "ed-politica",
  authorId: "au-1",
  categoryIds: [],
  tagIds: [],
  status: "published",
  publishedAt: "2026-03-01T12:00:00.000Z",
  readingTimeMinutes: 5,
  viewCount: 10,
  createdAt: "2026-03-01T12:00:00.000Z",
  updatedAt: "2026-03-01T12:00:00.000Z",
};

const editoria: Editoria = {
  id: "ed-politica",
  name: "Política",
  slug: "politica",
  color: "#0A192F",
  description: "",
  isActive: true,
};

describe("ArticleCard", () => {
  it("renders the article title, subtitle and editoria badge", () => {
    render(<ArticleCard article={article} editoria={editoria} />);

    expect(screen.getByText(article.title)).toBeInTheDocument();
    expect(screen.getByText(article.subtitle)).toBeInTheDocument();
    expect(screen.getByText("Política")).toBeInTheDocument();
  });

  it("links to the article page", () => {
    render(<ArticleCard article={article} editoria={editoria} />);

    expect(screen.getByRole("link")).toHaveAttribute("href", `/materia/${article.slug}`);
  });
});
