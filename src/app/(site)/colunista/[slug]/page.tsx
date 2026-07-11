import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { Newspaper, type NewspaperBlock } from "@/components/newspaper/Newspaper";
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

  const blocks: NewspaperBlock[] = [
    {
      type: "node",
      dense: true,
      node: (
        <header className="flex h-full flex-col items-center justify-center gap-4 text-center">
          <Image
            src={author.avatarUrl ?? "/brand/LOGO_MARCA.png"}
            alt={author.name}
            width={96}
            height={96}
            className="h-24 w-24 rounded-full object-cover grayscale"
          />
          <div>
            <h1 className="font-serif text-3xl font-bold text-polis-ink">{author.name}</h1>
            <p className="mt-1 max-w-xl text-polis-ink-soft">{author.bio}</p>
          </div>
        </header>
      ),
    },
    {
      type: "grid",
      items: articles.map((article) => (
        <ArticleCard key={article.id} article={article} editoria={getEditoriaById(article.editoriaId)} />
      )),
      itemsPerPage: { mobile: 2, desktop: 4 },
      gridClassName: "grid h-full grid-cols-1 content-center gap-6 sm:grid-cols-2",
      emptyState: <p className="text-polis-ink-soft">Nenhuma matéria publicada ainda.</p>,
    },
  ];

  return <Newspaper sectionLabel="Colunistas" runningTitle={author.name} showMasthead blocks={blocks} />;
}
