import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { getArticlesByAuthor, getAuthorBySlug, getAuthors, getEditoriaById } from "@/lib/content";
import { withPlaceholderParam } from "@/lib/utils";

interface AuthorPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const params = getAuthors().map((author) => ({ slug: author.id }));
  return withPlaceholderParam(params, { slug: "_placeholder" });
}

export async function generateMetadata({ params }: AuthorPageProps): Promise<Metadata> {
  const { slug } = await params;
  const author = getAuthorBySlug(slug);
  if (!author) return {};
  return { title: author.name, description: author.bio };
}

export default async function AuthorPage({ params }: AuthorPageProps) {
  const { slug } = await params;
  const author = getAuthorBySlug(slug);
  if (!author) notFound();

  const articles = getArticlesByAuthor(author.id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <header className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <Image
          src={author.avatarUrl ?? "/brand/LOGO_MARCA.png"}
          alt={author.name}
          width={96}
          height={96}
          className="h-24 w-24 rounded-full object-cover"
        />
        <div>
          <h1 className="font-sans text-3xl font-bold text-polis-navy">{author.name}</h1>
          <p className="mt-1 max-w-xl text-polis-slate">{author.bio}</p>
        </div>
      </header>

      <section className="mt-10">
        <h2 className="mb-6 border-b-2 border-polis-gold pb-2 font-sans text-xl font-bold text-polis-navy">
          Publicações
        </h2>
        {articles.length === 0 ? (
          <p className="text-polis-slate">Nenhuma matéria publicada ainda.</p>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} editoria={getEditoriaById(article.editoriaId)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
