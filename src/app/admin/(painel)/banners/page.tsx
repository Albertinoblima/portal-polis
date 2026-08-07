"use client";

import { useState } from "react";
import { MediaLibraryModal } from "@/components/admin/MediaLibraryModal";
import { useAdminSession } from "@/components/admin/AuthProvider";
import { AdminTopbar } from "@/components/admin/Topbar";
import { Button } from "@/components/ui/Button";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { createBanner, deleteBanner, getBanners, toggleBanner } from "@/lib/supabase/queries";
import type { BannerPosition } from "@/types/database";

const positionLabels: Record<BannerPosition, string> = {
  home_hero: "Destaque principal (Home)",
  home_secondary: "Destaques secundários (Home)",
  sidebar: "Barra lateral",
};

const positionRequirements: Record<
  BannerPosition,
  {
    dimensions: string;
    recommendation: string;
  }
> = {
  home_hero: {
    dimensions: "1600 x 900 px",
    recommendation: "Formato 16:9 para o destaque principal da Home.",
  },
  home_secondary: {
    dimensions: "1200 x 675 px",
    recommendation: "Formato 16:9 para manter consistência nos destaques secundários.",
  },
  sidebar: {
    dimensions: "1200 x 960 px",
    recommendation: "Formato 5:4. Este é o padrão dos 4 slots da página de anúncios.",
  },
};

const SIDEBAR_DIMENSIONS = { width: 1200, height: 960 };

async function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error("Não foi possível ler as dimensões da imagem selecionada."));
    image.src = url;
  });
}

export default function AdminBannersPage() {
  const { profile } = useAdminSession();
  const { data: banners, loading, refetch } = useSupabaseQuery(getBanners);
  const [isCreating, setIsCreating] = useState(false);
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [position, setPosition] = useState<BannerPosition>("home_secondary");
  const [error, setError] = useState<string | null>(null);

  async function handleBannerImageSelect(media: { url: string }) {
    try {
      const dimensions = await getImageDimensions(media.url);
      setImageUrl(media.url);
      setImageDimensions(dimensions);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao selecionar imagem da biblioteca.");
      setImageUrl("");
      setImageDimensions(null);
    }
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!imageUrl) {
      setError("Selecione uma imagem da biblioteca de mídia.");
      return;
    }

    if (position === "sidebar") {
      if (!imageDimensions) {
        setError("Não foi possível validar as dimensões da imagem. Selecione novamente na biblioteca.");
        return;
      }
      if (
        imageDimensions.width !== SIDEBAR_DIMENSIONS.width ||
        imageDimensions.height !== SIDEBAR_DIMENSIONS.height
      ) {
        setError(
          `Para os 4 banners da barra lateral, use exatamente ${SIDEBAR_DIMENSIONS.width} x ${SIDEBAR_DIMENSIONS.height}px. Imagem selecionada: ${imageDimensions.width} x ${imageDimensions.height}px.`
        );
        return;
      }
    }

    try {
      await createBanner({ title, image_url: imageUrl, link_url: linkUrl || "#", position });
      setTitle("");
      setImageUrl("");
      setImageDimensions(null);
      setLinkUrl("");
      setIsCreating(false);
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar o banner.");
    }
  }

  return (
    <>
      <AdminTopbar
        title="Banners e Destaques"
        description="Gerencie os destaques exibidos na Home."
        actions={
          <Button type="button" onClick={() => setIsCreating((v) => !v)}>
            {isCreating ? "Cancelar" : "+ Novo Banner"}
          </Button>
        }
      />

      <div className="p-6">
        {isCreating && (
          <form
            onSubmit={handleCreate}
            className="mb-6 grid grid-cols-1 gap-4 rounded-sm border border-polis-navy/10 bg-white p-4 sm:grid-cols-2"
          >
            <div>
              <label htmlFor="title" className="block text-xs font-semibold text-polis-slate">
                Título
              </label>
              <input
                id="title"
                required
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-1 w-full rounded-sm border border-polis-navy/20 px-3 py-2 text-sm focus:border-polis-gold focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="position" className="block text-xs font-semibold text-polis-slate">
                Posição
              </label>
              <select
                id="position"
                value={position}
                onChange={(event) => setPosition(event.target.value as BannerPosition)}
                className="mt-1 w-full rounded-sm border border-polis-navy/20 px-3 py-2 text-sm focus:border-polis-gold focus:outline-none"
              >
                {Object.entries(positionLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="imageUrl" className="block text-xs font-semibold text-polis-slate">
                Imagem do banner
              </label>
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt={title || "Prévia do banner"}
                  className="mt-1 h-24 w-full rounded-sm border border-polis-navy/10 bg-polis-off-white object-contain"
                />
              ) : (
                <div className="mt-1 flex h-24 items-center justify-center rounded-sm border border-dashed border-polis-navy/20 bg-polis-off-white text-xs text-polis-gray">
                  Nenhuma imagem selecionada
                </div>
              )}
              <button
                type="button"
                onClick={() => setIsMediaLibraryOpen(true)}
                className="mt-2 flex h-16 w-full flex-col items-center justify-center gap-0.5 rounded-sm border-2 border-dashed border-polis-navy/20 text-xs text-polis-gray hover:border-polis-gold"
              >
                <span>Selecionar da biblioteca de mídia</span>
                <span className="text-[10px] text-polis-gray/70">aceita JPG, PNG, WEBP, SVG e GIF</span>
              </button>
              {isMediaLibraryOpen && (
                <MediaLibraryModal
                  uploadedBy={profile.id}
                  onSelect={handleBannerImageSelect}
                  onClose={() => setIsMediaLibraryOpen(false)}
                />
              )}
              <p className="mt-2 text-[11px] text-polis-gray">
                Dimensão exigida para esta posição: <strong>{positionRequirements[position].dimensions}</strong>
              </p>
              <p className="text-[11px] text-polis-gray/80">{positionRequirements[position].recommendation}</p>
              {imageDimensions && (
                <p className="mt-1 text-[11px] text-polis-slate">
                  Imagem selecionada: {imageDimensions.width} x {imageDimensions.height}px
                </p>
              )}
            </div>
            <div>
              <label htmlFor="linkUrl" className="block text-xs font-semibold text-polis-slate">
                Link de destino
              </label>
              <input
                id="linkUrl"
                value={linkUrl}
                onChange={(event) => setLinkUrl(event.target.value)}
                placeholder="/materia/..."
                className="mt-1 w-full rounded-sm border border-polis-navy/20 px-3 py-2 text-sm focus:border-polis-gold focus:outline-none"
              />
            </div>
            {error && <p className="text-sm text-red-700 sm:col-span-2">{error}</p>}
            <Button type="submit" className="sm:col-span-2">
              Criar banner
            </Button>
          </form>
        )}

        {loading ? (
          <p className="text-sm text-polis-slate">Carregando...</p>
        ) : (banners ?? []).length === 0 ? (
          <div className="rounded-sm border-2 border-dashed border-polis-navy/20 bg-white p-10 text-center text-sm text-polis-gray">
            Nenhum banner cadastrado ainda.
          </div>
        ) : (
          <div className="overflow-hidden rounded-sm border border-polis-navy/10 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-polis-navy/10 bg-polis-off-white text-xs uppercase tracking-wide text-polis-gray">
                <tr>
                  <th className="px-5 py-3">Título</th>
                  <th className="px-5 py-3">Posição</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-polis-navy/10">
                {(banners ?? []).map((banner) => (
                  <tr key={banner.id}>
                    <td className="px-5 py-3 font-medium text-polis-navy">{banner.title}</td>
                    <td className="px-5 py-3 text-polis-slate">{positionLabels[banner.position]}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${banner.is_active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                          }`}
                      >
                        {banner.is_active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => toggleBanner(banner.id, !banner.is_active).then(refetch)}
                          className="font-semibold text-polis-navy hover:text-polis-gold"
                        >
                          {banner.is_active ? "Desativar" : "Ativar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteBanner(banner.id).then(refetch)}
                          className="font-semibold text-red-700 hover:underline"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
