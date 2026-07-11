"use client";

import { useState } from "react";
import { AdminTopbar } from "@/components/admin/Topbar";
import { Button } from "@/components/ui/Button";
import { useAdminSession } from "@/components/admin/AuthProvider";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { createTag, deleteTag, getTags, updateTag } from "@/lib/supabase/queries";
import { logAction } from "@/lib/supabase/audit";
import { slugify } from "@/lib/utils";

export default function AdminTagsPage() {
  const { profile } = useAdminSession();
  const { data: tags, loading, refetch } = useSupabaseQuery(getTags);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      const created = await createTag({ name: name.trim(), slug: slugify(name) });
      await logAction({
        userId: profile.id,
        action: "create",
        entity: "tag",
        entityId: created.id,
        newValue: { name: created.name },
      });
      setName("");
      setIsCreating(false);
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar a tag.");
    }
  }

  async function handleRename(id: string) {
    const trimmed = editingName.trim();
    if (!trimmed) {
      setEditingId(null);
      return;
    }
    await updateTag(id, { name: trimmed, slug: slugify(trimmed) });
    setEditingId(null);
    refetch();
  }

  async function handleDelete(id: string, tagName: string) {
    if (!confirm(`Excluir a tag "${tagName}"? Ela será removida de todas as matérias.`)) return;
    await deleteTag(id);
    await logAction({ userId: profile.id, action: "delete", entity: "tag", entityId: id });
    refetch();
  }

  return (
    <>
      <AdminTopbar title="Tags" description="Gerencie as tags usadas para classificar matérias." />

      <div className="p-6">
        <div className="mb-4 flex justify-end">
          <Button type="button" onClick={() => setIsCreating((v) => !v)}>
            {isCreating ? "Cancelar" : "+ Nova Tag"}
          </Button>
        </div>

        {isCreating && (
          <form
            onSubmit={handleCreate}
            className="mb-6 flex flex-col gap-4 rounded-sm border border-polis-navy/10 bg-white p-4 sm:flex-row sm:items-end"
          >
            <div className="flex-1">
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
            {error && <p className="text-sm text-red-700">{error}</p>}
            <Button type="submit">Criar tag</Button>
          </form>
        )}

        {loading ? (
          <p className="text-sm text-polis-slate">Carregando...</p>
        ) : (tags ?? []).length === 0 ? (
          <div className="rounded-sm border-2 border-dashed border-polis-navy/20 bg-white p-10 text-center text-sm text-polis-gray">
            Nenhuma tag cadastrada ainda.
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {(tags ?? []).map((tag) => (
              <div
                key={tag.id}
                className="flex items-center gap-2 rounded-full border border-polis-navy/10 bg-white px-4 py-2 text-sm"
              >
                {editingId === tag.id ? (
                  <input
                    autoFocus
                    value={editingName}
                    onChange={(event) => setEditingName(event.target.value)}
                    onBlur={() => handleRename(tag.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") handleRename(tag.id);
                      if (event.key === "Escape") setEditingId(null);
                    }}
                    className="w-28 rounded-sm border border-polis-navy/20 px-2 py-0.5 text-sm focus:border-polis-gold focus:outline-none"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(tag.id);
                      setEditingName(tag.name);
                    }}
                    className="font-medium text-polis-navy hover:text-polis-gold"
                  >
                    {tag.name}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(tag.id, tag.name)}
                  className="text-xs font-semibold text-red-700 hover:underline"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
