"use client";

import { useState } from "react";
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

export default function AdminBannersPage() {
  const { data: banners, loading, refetch } = useSupabaseQuery(getBanners);
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [position, setPosition] = useState<BannerPosition>("home_secondary");
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      await createBanner({ title, image_url: imageUrl, link_url: linkUrl || "#", position });
      setTitle("");
      setImageUrl("");
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
      />

      <div className="p-6">
        <div className="mb-4 flex justify-end">
          <Button type="button" onClick={() => setIsCreating((v) => !v)}>
            {isCreating ? "Cancelar" : "+ Novo Banner"}
          </Button>
        </div>

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
                URL da imagem
              </label>
              <input
                id="imageUrl"
                required
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
                placeholder="https://.../banner.jpg"
                className="mt-1 w-full rounded-sm border border-polis-navy/20 px-3 py-2 text-sm focus:border-polis-gold focus:outline-none"
              />
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
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          banner.is_active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
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
