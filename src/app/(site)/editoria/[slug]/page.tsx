import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { getArticlesByEditoria, getEditorias, getEditoriaBySlug } from "@/lib/content";

interface EditoriaPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getEditorias().map((editoria) => ({ slug: editoria.slug }));
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <header className="mb-10 border-b-4 pb-4" style={{ borderColor: editoria.color }}>
        <h1 className="font-sans text-4xl font-bold text-polis-navy">{editoria.name}</h1>
        <p className="mt-2 max-w-2xl text-polis-slate">{editoria.description}</p>
      </header>

      {articles.length === 0 ? (
        <p className="text-polis-slate">Nenhuma matéria publicada nesta editoria ainda.</p>
      ) : (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} editoria={editoria} />
          ))}
        </div>
      )}
    </div>
  );
}
