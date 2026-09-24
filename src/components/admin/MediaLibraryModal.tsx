"use client";

import { useState } from "react";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { listMedia, uploadMedia } from "@/lib/github/mediaLibrary";

interface MediaLibraryModalProps {
  accessToken: string;
  uploadedBy: string;
  onSelect: (media: { path: string; altText: string }) => void;
  onClose: () => void;
}

export function MediaLibraryModal({ accessToken, uploadedBy, onSelect, onClose }: MediaLibraryModalProps) {
  const { data: media, loading, refetch } = useSupabaseQuery(() => listMedia(accessToken), [accessToken]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsUploading(true);
    setError(null);
    try {
      const uploaded = await uploadMedia(accessToken, file, file.name, uploadedBy);
      refetch();
      onSelect({ path: uploaded.path, altText: uploaded.altText });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao enviar arquivo.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Selecionar imagem da biblioteca de mídia"
      className="fixed inset-0 z-50 flex items-center justify-center bg-polis-navy/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-md bg-white shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-polis-navy/10 px-5 py-3">
          <h2 className="text-sm font-semibold text-polis-navy">Biblioteca de Mídia</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="text-lg leading-none text-polis-gray hover:text-polis-navy"
          >
            ×
          </button>
        </div>

        <div className="border-b border-polis-navy/10 px-5 py-3">
          <label className="flex h-16 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-sm border-2 border-dashed border-polis-navy/20 text-xs text-polis-gray hover:border-polis-gold">
            <span>{isUploading ? "Enviando..." : "Não achou? Envie uma imagem do computador"}</span>
            <span className="text-[10px] text-polis-gray/70">JPG, PNG, WEBP ou GIF — até 20MB</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
              className="hidden"
              onChange={handleUpload}
              disabled={isUploading}
            />
          </label>
          {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <p className="text-sm text-polis-slate">Carregando...</p>
          ) : (media ?? []).length === 0 ? (
            <p className="text-sm text-polis-slate">Nenhum arquivo na biblioteca ainda.</p>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {(media ?? []).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelect({ path: item.path, altText: item.altText });
                    onClose();
                  }}
                  title={item.filename}
                  className="group aspect-square overflow-hidden rounded-sm border border-polis-navy/10 bg-polis-off-white hover:border-polis-gold"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.path}
                    alt={item.altText}
                    className="h-full w-full object-contain p-1 transition-transform group-hover:scale-105"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
