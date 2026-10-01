"use client";

import { useEffect, useState } from "react";
import { AdminTopbar } from "@/components/admin/Topbar";
import { Button } from "@/components/ui/Button";
import { getSettings, updateSettings } from "@/lib/github/settings";
import { useAdminSession } from "@/components/admin/AuthProvider";

export default function AdminConfiguracoesPage() {
  const { profile, accessToken } = useAdminSession();
  const isAdmin = profile.role === "admin";

  const [loading, setLoading] = useState(true);
  const [siteName, setSiteName] = useState("");
  const [tagline, setTagline] = useState("");
  const [defaultSeoTitle, setDefaultSeoTitle] = useState("");
  const [defaultSeoDescription, setDefaultSeoDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    getSettings(accessToken).then((settings) => {
      setSiteName(settings.siteName);
      setTagline(settings.tagline);
      setDefaultSeoTitle(settings.defaultSeoTitle);
      setDefaultSeoDescription(settings.defaultSeoDescription);
      setLoading(false);
    });
  }, [accessToken]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await updateSettings(accessToken, {
        siteName,
        tagline,
        defaultSeoTitle,
        defaultSeoDescription,
      });
      setMessage("Configurações salvas.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="p-6 text-sm text-polis-slate">Carregando...</p>;
  }

  return (
    <>
      <AdminTopbar title="Configurações" description="Configurações gerais do portal e de SEO." />

      <div className="max-w-2xl space-y-6 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <fieldset className="rounded-sm border border-polis-navy/10 bg-white p-4">
            <legend className="px-1 text-sm font-semibold text-polis-navy">Geral</legend>
            <div className="space-y-3">
              <div>
                <label htmlFor="siteName" className="block text-xs font-semibold text-polis-slate">
                  Nome do site
                </label>
                <input
                  id="siteName"
                  value={siteName}
                  onChange={(event) => setSiteName(event.target.value)}
                  disabled={!isAdmin}
                  className="mt-1 w-full rounded-sm border border-polis-navy/20 px-3 py-2 text-sm focus:border-polis-gold focus:outline-none disabled:bg-polis-off-white"
                />
              </div>
              <div>
                <label htmlFor="tagline" className="block text-xs font-semibold text-polis-slate">
                  Slogan
                </label>
                <input
                  id="tagline"
                  value={tagline}
                  onChange={(event) => setTagline(event.target.value)}
                  disabled={!isAdmin}
                  className="mt-1 w-full rounded-sm border border-polis-navy/20 px-3 py-2 text-sm focus:border-polis-gold focus:outline-none disabled:bg-polis-off-white"
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="rounded-sm border border-polis-navy/10 bg-white p-4">
            <legend className="px-1 text-sm font-semibold text-polis-navy">SEO Global</legend>
            <div className="space-y-3">
              <div>
                <label htmlFor="defaultSeoTitle" className="block text-xs font-semibold text-polis-slate">
                  Meta título padrão
                </label>
                <input
                  id="defaultSeoTitle"
                  value={defaultSeoTitle}
                  onChange={(event) => setDefaultSeoTitle(event.target.value)}
                  disabled={!isAdmin}
                  className="mt-1 w-full rounded-sm border border-polis-navy/20 px-3 py-2 text-sm focus:border-polis-gold focus:outline-none disabled:bg-polis-off-white"
                />
              </div>
              <div>
                <label
                  htmlFor="defaultSeoDescription"
                  className="block text-xs font-semibold text-polis-slate"
                >
                  Meta descrição padrão
                </label>
                <textarea
                  id="defaultSeoDescription"
                  value={defaultSeoDescription}
                  onChange={(event) => setDefaultSeoDescription(event.target.value)}
                  disabled={!isAdmin}
                  rows={2}
                  className="mt-1 w-full rounded-sm border border-polis-navy/20 px-3 py-2 text-sm focus:border-polis-gold focus:outline-none disabled:bg-polis-off-white"
                />
              </div>
            </div>
          </fieldset>

          {message && <p className="text-sm text-polis-slate">{message}</p>}

          {isAdmin && (
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar Configurações"}
            </Button>
          )}
        </form>
      </div>
    </>
  );
}
