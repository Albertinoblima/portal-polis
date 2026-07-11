"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AdminTopbar } from "@/components/admin/Topbar";
import { ArticleEditorForm } from "@/components/admin/ArticleEditorForm";

function EditarMateriaContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  if (!id) {
    return <p className="p-6 text-sm text-red-700">Matéria não especificada.</p>;
  }

  return (
    <>
      <AdminTopbar title="Editar Matéria" />
      <ArticleEditorForm articleId={id} />
    </>
  );
}

export default function EditarMateriaPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-polis-slate">Carregando...</p>}>
      <EditarMateriaContent />
    </Suspense>
  );
}
