import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { Comments } from "@/components/articles/Comments";
import { ListenButton } from "@/components/articles/ListenButton";
import { ShareButtons } from "@/components/articles/ShareButtons";
import { EditoriaBadge } from "@/components/ui/Badge";
import { Newspaper, type NewspaperBlock } from "@/components/newspaper/Newspaper";
import {
  getArticleBySlug,
  getAuthors,
  getEditoriaById,
  getPublishedArticles,
  getRelatedArticles,
} from "@/lib/content";
import { formatDate, withPlaceholderParam } from "@/lib/utils";
import { SITE_URL } from "@/lib/seo";

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

  return {
    title: article.seoTitle ?? article.title,
    description: article.seoDescription ?? article.subtitle,
    openGraph: {
      type: "article",
      title: article.title,
      description: article.subtitle,
      images: [article.featuredImage],
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
  const plainTextContent = article.content.replace(/<[^>]+>/g, " ");
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
    {
      type: "node",
      dense: true,
      node: (
        <div className="flex h-full flex-col">
          <Link
            href={editoria ? `/editoria/${editoria.slug}` : "/"}
            className="mb-3 inline-flex w-fit items-center gap-2 text-xs font-semibold text-polis-ink-soft hover:text-polis-gold-muted"
          >
            ← Voltar
          </Link>

          {editoria && (
            <div className="mb-3">
              <EditoriaBadge name={editoria.name} color={editoria.color} />
            </div>
          )}

          <h1 className="font-serif text-2xl font-bold leading-tight text-polis-ink md:text-4xl">
            {article.title}
          </h1>

          <div className="mt-3">
            <ListenButton text={plainTextContent} />
          </div>

          <p className="mt-3 font-serif text-base italic text-polis-ink-soft md:text-lg">{article.subtitle}</p>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-y border-polis-rule/20 py-3 text-xs text-polis-ink-soft">
            {author && (
              <Link href={`/colunista/${author.id}`} className="font-semibold text-polis-ink hover:text-polis-gold-muted">
                {author.name}
              </Link>
            )}
            <span>{formatDate(article.publishedAt)}</span>
            <span>{article.readingTimeMinutes} min de leitura</span>
          </div>

          <div className="relative mt-4 min-h-0 flex-1 overflow-hidden rounded-sm bg-polis-ink/5">
            <Image
              src={article.featuredImage}
              alt={article.featuredImageAlt}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-contain p-6 grayscale"
              priority
            />
          </div>
        </div>
      ),
    },
    { type: "html", html: article.content },
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
