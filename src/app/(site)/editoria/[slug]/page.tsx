import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { Newspaper, type NewspaperBlock } from "@/components/newspaper/Newspaper";
import { getArticlesByEditoria, getEditorias, getEditoriaBySlug } from "@/lib/content";
import { withPlaceholderParam } from "@/lib/utils";

interface EditoriaPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const params = getEditorias().map((editoria) => ({ slug: editoria.slug }));
  return withPlaceholderParam(params, { slug: "_placeholder" });
}

export async function generateMetadata({ params }: EditoriaPageProps): Promise<Metadata> {
  const { slug } = await params;
  const editoria = getEditoriaBySlug(slug);
  if (!editoria) return {};
  return { title: editoria.name, description: editoria.description };
}

export default async function EditoriaPage({ params }: EditoriaPageProps) {
  const { slug } = await params;
  const editoria = getEditoriaBySlug(slug);
  if (!editoria) notFound();

  const articles = getArticlesByEditoria(slug);

  const blocks: NewspaperBlock[] = [
    {
      type: "node",
      dense: true,
      node: (
        <header
          className="flex h-full flex-col justify-center border-b-4 pb-4"
          style={{ borderColor: editoria.color }}
        >
          <h1 className="font-serif text-4xl font-bold text-polis-ink">{editoria.name}</h1>
          <p className="mt-2 max-w-2xl text-polis-ink-soft">{editoria.description}</p>
        </header>
      ),
    },
    {
      type: "grid",
      items: articles.map((article) => <ArticleCard key={article.id} article={article} editoria={editoria} />),
      itemsPerPage: { mobile: 2, desktop: 4 },
      gridClassName: "grid h-full grid-cols-1 content-center gap-6 sm:grid-cols-2",
      emptyState: <p className="text-polis-ink-soft">Nenhuma matéria publicada nesta editoria ainda.</p>,
    },
  ];

  return <Newspaper sectionLabel={editoria.name} showMasthead blocks={blocks} />;
}
