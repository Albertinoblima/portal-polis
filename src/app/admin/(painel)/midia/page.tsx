"use client";

import { useState } from "react";
import { AdminTopbar } from "@/components/admin/Topbar";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { deleteMedia, getMedia, uploadMedia } from "@/lib/supabase/queries";
import { useAdminSession } from "@/components/admin/AuthProvider";

export default function AdminMidiaPage() {
  const { profile } = useAdminSession();
  const { data: media, loading, refetch } = useSupabaseQuery(getMedia);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        await uploadMedia(file, profile.id, file.name);
      }
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao enviar arquivo.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  async function handleDelete(id: string, filename: string) {
    if (!confirm(`Remover "${filename}" da biblioteca?`)) return;
    await deleteMedia(id, filename);
    refetch();
  }

  return (
    <>
      <AdminTopbar
        title="Biblioteca de Mídia"
        description="Imagens e documentos disponíveis para uso nas matérias."
      />

      <div className="p-6">
        <label className="mb-4 flex h-32 cursor-pointer items-center justify-center rounded-sm border-2 border-dashed border-polis-navy/20 text-sm text-polis-gray hover:border-polis-gold">
          {isUploading ? "Enviando..." : "Arraste arquivos aqui ou clique para enviar"}
          <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
        </label>

        {error && <p className="mb-4 text-sm text-red-700">{error}</p>}

        {loading ? (
          <p className="text-sm text-polis-slate">Carregando...</p>
        ) : (media ?? []).length === 0 ? (
          <p className="text-sm text-polis-slate">Nenhum arquivo enviado ainda.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {(media ?? []).map((item) => (
              <div
                key={item.id}
                className="group relative aspect-square overflow-hidden rounded-sm border border-polis-navy/10 bg-white"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt={item.alt_text} className="h-full w-full object-contain p-2" />
                <button
                  type="button"
                  onClick={() => handleDelete(item.id, item.filename)}
                  className="absolute right-1 top-1 hidden rounded-sm bg-red-700 px-2 py-1 text-xs font-semibold text-white group-hover:block"
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
