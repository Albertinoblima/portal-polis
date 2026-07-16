import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { Comments } from "@/components/articles/Comments";
import { ShareButtons } from "@/components/articles/ShareButtons";
import { Newspaper, type NewspaperBlock } from "@/components/newspaper/Newspaper";
import { buildArticleBlocks } from "@/components/newspaper/editionBlocks";
import {
  getArticleBySlug,
  getAuthors,
  getEditoriaById,
  getPublishedArticles,
  getRelatedArticles,
} from "@/lib/content";
import { withPlaceholderParam } from "@/lib/utils";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const params = getPublishedArticles().map((article) => ({ slug: article.slug }));
  return withPlaceholderParam(params, { slug: "_placeholder" });
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};

  const articleUrl = `${SITE_URL}/materia/${article.slug}/`;

  return {
    title: article.seoTitle ?? article.title,
    description: article.seoDescription ?? article.subtitle,
    alternates: {
      canonical: articleUrl,
    },
    openGraph: {
      type: "article",
      siteName: SITE_NAME,
      locale: "pt_BR",
      url: articleUrl,
      title: article.title,
      description: article.subtitle,
      // WhatsApp/Facebook exigem width/height para renderizar a prévia de
      // forma confiável — sem eles, o crawler às vezes falha silenciosamente
      // mesmo com a imagem acessível. 1200x630 é a proporção padrão de
      // mercado (1.91:1); não precisa bater pixel a pixel com o arquivo real.
      images: [
        {
          url: article.featuredImage,
          width: 1200,
          height: 630,
          alt: article.featuredImageAlt || article.title,
        },
      ],
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const editoria = getEditoriaById(article.editoriaId);
  const author = getAuthors().find((a) => a.id === article.authorId);
  const related = getRelatedArticles(article);
  const articleUrl = `${SITE_URL}/materia/${article.slug}/`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.subtitle,
    image: [article.featuredImage],
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: author ? { "@type": "Person", name: author.name } : undefined,
    publisher: {
      "@type": "Organization",
      name: "Portal Pólis",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/brand/LOGO_MARCA.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
  };

  const blocks: NewspaperBlock[] = [
    ...buildArticleBlocks(article, { editoria, author }),
    {
      type: "node",
      node: (
        <div className="flex h-full flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-polis-rule/20 pb-6">
            <ShareButtons url={articleUrl} title={article.title} />
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            <Comments articleId={article.id} />
          </div>
        </div>
      ),
    },
  ];

  if (related.length > 0) {
    blocks.push({
      type: "grid",
      items: related.map((relatedArticle) => (
        <ArticleCard
          key={relatedArticle.id}
          article={relatedArticle}
          editoria={getEditoriaById(relatedArticle.editoriaId)}
        />
      )),
      itemsPerPage: { mobile: 2, desktop: 3 },
      gridClassName: "grid h-full grid-cols-1 content-center gap-6 sm:grid-cols-2 lg:grid-cols-3",
    });
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Newspaper sectionLabel={editoria?.name ?? "Matéria"} runningTitle={article.title} showMasthead blocks={blocks} />
    </>
  );
}
