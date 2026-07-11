import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { ListenButton } from "@/components/articles/ListenButton";
import { ShareButtons } from "@/components/articles/ShareButtons";
import { EditoriaBadge } from "@/components/ui/Badge";
import {
  getArticleBySlug,
  getAuthors,
  getEditoriaById,
  getPublishedArticles,
  getRelatedArticles,
} from "@/lib/content";
import { formatDate, withPlaceholderParam } from "@/lib/utils";

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

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <Link
        href={editoria ? `/editoria/${editoria.slug}` : "/"}
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-polis-slate hover:text-polis-gold"
      >
        ← Voltar
      </Link>

      {editoria && (
        <div className="mb-4">
          <EditoriaBadge name={editoria.name} color={editoria.color} />
        </div>
      )}

      <h1 className="font-sans text-3xl font-bold leading-tight text-polis-navy md:text-5xl">
        {article.title}
      </h1>
      <p className="mt-4 text-lg text-polis-slate">{article.subtitle}</p>

      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-polis-navy/10 py-4 text-sm text-polis-gray">
        {author && (
          <Link href={`/colunista/${author.id}`} className="font-semibold text-polis-navy hover:text-polis-gold">
            {author.name}
          </Link>
        )}
        <span>{formatDate(article.publishedAt)}</span>
        <span>{article.readingTimeMinutes} min de leitura</span>
      </div>

      <div className="relative mt-8 aspect-[16/9] w-full overflow-hidden rounded-sm bg-polis-navy/5">
        <Image
          src={article.featuredImage}
          alt={article.featuredImageAlt}
          fill
          sizes="(min-width: 768px) 768px, 100vw"
          className="object-contain p-10"
          priority
        />
      </div>

      <div
        className="prose prose-lg prose-headings:font-sans prose-headings:text-polis-navy prose-p:text-polis-navy/90 prose-blockquote:border-l-4 prose-blockquote:border-polis-gold prose-blockquote:font-serif prose-blockquote:italic mt-8 max-w-none leading-relaxed"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-polis-navy/10 pt-6">
        <ListenButton text={plainTextContent} />
        <ShareButtons url={`https://portalpolis.com.br/materia/${article.slug}`} title={article.title} />
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 border-b-2 border-polis-gold pb-2 font-sans text-xl font-bold text-polis-navy">
            Matérias Relacionadas
          </h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {related.map((relatedArticle) => (
              <ArticleCard
                key={relatedArticle.id}
                article={relatedArticle}
                editoria={getEditoriaById(relatedArticle.editoriaId)}
              />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
