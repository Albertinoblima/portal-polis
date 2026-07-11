import type { Metadata } from "next";
import { AdminTopbar } from "@/components/admin/Topbar";
import { ArticleEditorForm } from "@/components/admin/ArticleEditorForm";

export const metadata: Metadata = {
  title: "Nova Matéria",
};

export default function NovaMateriaPage() {
  return (
    <>
      <AdminTopbar title="Nova Matéria" description="Preencha os campos abaixo para criar uma nova matéria." />
      <ArticleEditorForm />
    </>
  );
}
