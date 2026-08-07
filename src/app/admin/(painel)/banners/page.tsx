"use client";

import { useState } from "react";
import { MediaLibraryModal } from "@/components/admin/MediaLibraryModal";
import { useAdminSession } from "@/components/admin/AuthProvider";
import { AdminTopbar } from "@/components/admin/Topbar";
import { Button } from "@/components/ui/Button";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import {
  createBanner,
  deleteBanner,
  getBanners,
  toggleBanner,
  triggerSiteRebuild,
  updateBanner,
} from "@/lib/supabase/queries";

type BannerRecord = Awaited<ReturnType<typeof getBanners>>[number];

const SIDEBAR_DIMENSIONS = { width: 1200, height: 960 };
const SIDEBAR_ASPECT_RATIO = SIDEBAR_DIMENSIONS.width / SIDEBAR_DIMENSIONS.height;
const SIDEBAR_RATIO_TOLERANCE = 0.01;

export function isValidBannerDimensions(width: number, height: number): boolean {
  if (width <= 0 || height <= 0) {
    return false;
  }

  const ratio = width / height;
  return Math.abs(ratio - SIDEBAR_ASPECT_RATIO) <= SIDEBAR_RATIO_TOLERANCE;
}

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
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setEditingBannerId(null);
    setTitle("");
    setImageUrl("");
    setImageDimensions(null);
    setLinkUrl("");
    setError(null);
  }

  function openCreateForm() {
    resetForm();
    setIsFormOpen(true);
  }

  async function openEditForm(banner: BannerRecord) {
    setIsFormOpen(true);
    setEditingBannerId(banner.id);
    setTitle(banner.title);
    setImageUrl(banner.image_url);
    setLinkUrl(banner.link_url);
    setError(null);
    try {
      setImageDimensions(await getImageDimensions(banner.image_url));
    } catch {
      setImageDimensions(null);
    }
  }

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

    if (!imageDimensions) {
      setError("Não foi possível validar as dimensões da imagem. Selecione novamente na biblioteca.");
      return;
    }
    if (!isValidBannerDimensions(imageDimensions.width, imageDimensions.height)) {
      setError(
        `Para os 4 banners da publicidade, use uma imagem proporcional ao formato 5:4. Exemplo: ${SIDEBAR_DIMENSIONS.width} x ${SIDEBAR_DIMENSIONS.height}px ou ${SIDEBAR_DIMENSIONS.width - 240} x ${SIDEBAR_DIMENSIONS.height - 192}px. Imagem selecionada: ${imageDimensions.width} x ${imageDimensions.height}px.`
      );
      return;
    }

    try {
      if (editingBannerId) {
        await updateBanner(editingBannerId, { title, image_url: imageUrl, link_url: linkUrl || "#" });
      } else {
        await createBanner({ title, image_url: imageUrl, link_url: linkUrl || "#" });
      }
      await triggerSiteRebuild();
      resetForm();
      setIsFormOpen(false);
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o banner.");
    }
  }

  return (
    <>
      <AdminTopbar
        title="Publicidade"
        description="Gerencie os 4 banners da página publicitária do jornal."
        actions={
          <Button type="button" onClick={() => (isFormOpen ? (resetForm(), setIsFormOpen(false)) : openCreateForm())}>
            {isFormOpen ? "Cancelar" : "+ Novo Banner"}
          </Button>
        }
      />

      <div className="p-6">
        {isFormOpen && (
          <form
            onSubmit={handleCreate}
            className="mb-6 grid grid-cols-1 gap-4 rounded-sm border border-polis-navy/10 bg-white p-4 sm:grid-cols-2"
          >
            <div className="sm:col-span-2 flex items-center justify-between gap-3 rounded-sm border border-polis-navy/10 bg-polis-off-white px-3 py-2 text-xs text-polis-slate">
              <span>{editingBannerId ? "Editando banner existente" : "Criando novo banner"}</span>
              {editingBannerId && <span>O site será atualizado após salvar.</span>}
            </div>
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
            <div className="rounded-sm border border-polis-navy/10 bg-polis-off-white px-3 py-2 text-xs text-polis-slate">
              <p className="font-semibold text-polis-navy">Posição fixa: Barra lateral</p>
              <p className="mt-1">Esses banners alimentam exclusivamente os 4 slots de publicidade do jornal.</p>
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
                Proporção recomendada: <strong>5:4</strong> (ex.: 1200 x 960 px, 960 x 768 px)
              </p>
              <p className="text-[11px] text-polis-gray/80">Aceita JPG, PNG, WEBP, SVG e GIF.</p>
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
              {editingBannerId ? "Salvar alterações" : "Criar banner"}
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
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-polis-navy/10">
                {(banners ?? []).map((banner) => (
                  <tr key={banner.id}>
                    <td className="px-5 py-3 font-medium text-polis-navy">{banner.title}</td>
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
                          onClick={() => openEditForm(banner)}
                          className="font-semibold text-polis-navy hover:text-polis-gold"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await toggleBanner(banner.id, !banner.is_active);
                            await triggerSiteRebuild();
                            refetch();
                          }}
                          className="font-semibold text-polis-navy hover:text-polis-gold"
                        >
                          {banner.is_active ? "Desativar" : "Ativar"}
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await deleteBanner(banner.id);
                            await triggerSiteRebuild();
                            refetch();
                          }}
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
