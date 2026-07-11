import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AdminTopbar } from "@/components/admin/Topbar";
import { ArticleEditorForm } from "@/components/admin/ArticleEditorForm";
import { getPublishedArticles } from "@/lib/content";

interface EditarMateriaPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Editar Matéria",
};

export async function generateStaticParams() {
  return getPublishedArticles().map((article) => ({ id: article.id }));
}

export default async function EditarMateriaPage({ params }: EditarMateriaPageProps) {
  const { id } = await params;
  const article = getPublishedArticles().find((a) => a.id === id);
  if (!article) notFound();

  return (
    <>
      <AdminTopbar title="Editar Matéria" description={article.title} />
      <ArticleEditorForm article={article} />
    </>
  );
}
