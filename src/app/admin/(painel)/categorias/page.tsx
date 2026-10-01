"use client";

import { useState } from "react";
import { AdminTopbar } from "@/components/admin/Topbar";
import { Button } from "@/components/ui/Button";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { createEditoria, listEditorias, setEditoriaActive } from "@/lib/github/editorias";
import { useAdminSession } from "@/components/admin/AuthProvider";
import { slugify } from "@/lib/utils";

export default function AdminCategoriasPage() {
  const { accessToken } = useAdminSession();
  const { data: editorias, loading, refetch } = useSupabaseQuery(
    () => listEditorias(accessToken),
    [accessToken]
  );

  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#0A192F");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      await createEditoria(accessToken, {
        name: name.trim(),
        slug: slugify(name),
        color,
        description: description.trim(),
      });
      setName("");
      setDescription("");
      setIsCreating(false);
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar a editoria.");
    }
  }

  async function handleToggleActive(id: string, isActive: boolean) {
    await setEditoriaActive(accessToken, id, !isActive);
    refetch();
  }

  return (
    <>
      <AdminTopbar
        title="Categorias e Editorias"
        description="Gerencie a taxonomia de conteúdo do portal."
      />

      <div className="p-6">
        <div className="mb-4 flex justify-end">
          <Button type="button" onClick={() => setIsCreating((v) => !v)}>
            {isCreating ? "Cancelar" : "+ Nova Editoria"}
          </Button>
        </div>

        {isCreating && (
          <form
            onSubmit={handleCreate}
            className="mb-6 grid grid-cols-1 gap-4 rounded-sm border border-polis-navy/10 bg-white p-4 sm:grid-cols-[2fr_1fr_1fr]"
          >
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-polis-slate">
                Nome
              </label>
              <input
                id="name"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1 w-full rounded-sm border border-polis-navy/20 px-3 py-2 text-sm focus:border-polis-gold focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="color" className="block text-xs font-semibold text-polis-slate">
                Cor
              </label>
              <input
                id="color"
                type="color"
                value={color}
                onChange={(event) => setColor(event.target.value)}
                className="mt-1 h-9 w-full rounded-sm border border-polis-navy/20"
              />
            </div>
            <div className="sm:col-span-3">
              <label htmlFor="description" className="block text-xs font-semibold text-polis-slate">
                Descrição
              </label>
              <input
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="mt-1 w-full rounded-sm border border-polis-navy/20 px-3 py-2 text-sm focus:border-polis-gold focus:outline-none"
              />
            </div>
            {error && <p className="text-sm text-red-700 sm:col-span-3">{error}</p>}
            <Button type="submit" className="sm:col-span-3">
              Criar editoria
            </Button>
          </form>
        )}

        {loading ? (
          <p className="text-sm text-polis-slate">Carregando...</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(editorias ?? []).map((editoria) => (
              <div key={editoria.id} className="rounded-sm border border-polis-navy/10 bg-white p-4">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: editoria.color }} />
                  <h3 className="font-sans font-bold text-polis-navy">{editoria.name}</h3>
                </div>
                <p className="mt-2 text-sm text-polis-slate">{editoria.description}</p>
                <p className="mt-2 text-xs text-polis-gray">/editoria/{editoria.slug}</p>
                <button
                  type="button"
                  onClick={() => handleToggleActive(editoria.id, editoria.isActive)}
                  className="mt-3 text-xs font-semibold text-polis-navy hover:text-polis-gold"
                >
                  {editoria.isActive ? "Desativar" : "Ativar"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
