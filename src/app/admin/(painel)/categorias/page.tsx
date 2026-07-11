import type { Metadata } from "next";
import { AdminTopbar } from "@/components/admin/Topbar";
import { ButtonLink } from "@/components/ui/Button";
import { getEditorias } from "@/lib/content";

export const metadata: Metadata = {
  title: "Categorias e Editorias",
};

export default function AdminCategoriasPage() {
  const editorias = getEditorias();

  return (
    <>
      <AdminTopbar
        title="Categorias e Editorias"
        description="Gerencie a taxonomia de conteúdo do portal."
      />

      <div className="p-6">
        <div className="mb-4 flex justify-end">
          <ButtonLink href="#">+ Nova Editoria</ButtonLink>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {editorias.map((editoria) => (
            <div key={editoria.id} className="rounded-sm border border-polis-navy/10 bg-white p-4">
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: editoria.color }}
                />
                <h3 className="font-sans font-bold text-polis-navy">{editoria.name}</h3>
              </div>
              <p className="mt-2 text-sm text-polis-slate">{editoria.description}</p>
              <p className="mt-2 text-xs text-polis-gray">/editoria/{editoria.slug}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
