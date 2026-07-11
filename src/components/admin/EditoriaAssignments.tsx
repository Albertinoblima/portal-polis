"use client";

import { useEffect, useState } from "react";
import { getEditorias, getStaffEditoriaIds, setStaffEditorias } from "@/lib/supabase/queries";

export function EditoriaAssignments({ profileId }: { profileId: string }) {
  const [editorias, setEditorias] = useState<{ id: string; name: string }[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      const [allEditorias, assignedIds] = await Promise.all([
        getEditorias(),
        getStaffEditoriaIds(profileId),
      ]);
      if (!isMounted) return;
      setEditorias(allEditorias.map((editoria) => ({ id: editoria.id, name: editoria.name })));
      setSelected(new Set(assignedIds));
      setLoading(false);
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [profileId]);

  async function toggle(editoriaId: string) {
    const next = new Set(selected);
    if (next.has(editoriaId)) {
      next.delete(editoriaId);
    } else {
      next.add(editoriaId);
    }
    setSelected(next);
    setSaving(true);
    await setStaffEditorias(profileId, Array.from(next));
    setSaving(false);
  }

  if (loading) {
    return <p className="px-5 py-3 text-xs text-polis-slate">Carregando editorias...</p>;
  }

  return (
    <div className="border-t border-polis-navy/10 bg-polis-off-white px-5 py-3">
      <p className="mb-2 text-xs font-semibold text-polis-slate">
        Editorias em que este usuário pode escrever
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {editorias.map((editoria) => (
          <label key={editoria.id} className="flex items-center gap-1.5 text-xs text-polis-navy">
            <input
              type="checkbox"
              checked={selected.has(editoria.id)}
              disabled={saving}
              onChange={() => toggle(editoria.id)}
            />
            {editoria.name}
          </label>
        ))}
      </div>
      {selected.size === 0 && (
        <p className="mt-2 text-xs text-polis-gray">
          Sem restrição: pode publicar em qualquer editoria.
        </p>
      )}
    </div>
  );
}
