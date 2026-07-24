"use client";

import { useEffect, useState } from "react";
import { AdminTopbar } from "@/components/admin/Topbar";
import { Card } from "@/components/admin/Card";
import { Button } from "@/components/ui/Button";
import { useAdminSession } from "@/components/admin/AuthProvider";
import {
  getSiteSettings,
  triggerSiteRebuild,
  updateSiteAppearance,
  uploadMedia,
} from "@/lib/supabase/queries";
import type { BodyFont, HeadingFont, NavLink, SocialLink } from "@/types/database";

const HEADING_FONT_OPTIONS: { value: HeadingFont; label: string }[] = [
  { value: "eb-garamond", label: "EB Garamond (padrão, serifada clássica)" },
  { value: "playfair-display", label: "Playfair Display (serifada de alto contraste)" },
  { value: "merriweather", label: "Merriweather (serifada robusta, boa leitura)" },
];

const BODY_FONT_OPTIONS: { value: BodyFont; label: string }[] = [
  { value: "inter", label: "Inter (padrão, sem serifa)" },
  { value: "source-sans-3", label: "Source Sans 3" },
  { value: "ibm-plex-sans", label: "IBM Plex Sans" },
];

function moveItem<T>(list: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export default function AdminAparenciaPage() {
  const { profile } = useAdminSession();
  const isAdmin = profile.role === "admin";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [colorPrimary, setColorPrimary] = useState("#0a192f");
  const [colorAccent, setColorAccent] = useState("#c9a227");
  const [colorPaper, setColorPaper] = useState("#f4f1e9");
  const [fontHeading, setFontHeading] = useState<HeadingFont>("eb-garamond");
  const [fontBody, setFontBody] = useState<BodyFont>("inter");
  const [navLinks, setNavLinks] = useState<NavLink[]>([]);
  const [footerLinks, setFooterLinks] = useState<NavLink[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);

  useEffect(() => {
    getSiteSettings().then((settings) => {
      setLogoUrl(settings.logo_url);
      setFaviconUrl(settings.favicon_url);
      setColorPrimary(settings.color_primary);
      setColorAccent(settings.color_accent);
      setColorPaper(settings.color_paper);
      setFontHeading(settings.font_heading as HeadingFont);
      setFontBody(settings.font_body as BodyFont);
      setNavLinks((settings.nav_links as NavLink[] | null) ?? []);
      setFooterLinks((settings.footer_links as NavLink[] | null) ?? []);
      setSocialLinks((settings.social_links as SocialLink[] | null) ?? []);
      setLoading(false);
    });
  }, []);

  async function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    setError(null);
    try {
      const media = await uploadMedia(file, profile.id, "Logo do site");
      setLogoUrl(media.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao enviar o logo.");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleFaviconUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingFavicon(true);
    setError(null);
    try {
      const media = await uploadMedia(file, profile.id, "Favicon do site");
      setFaviconUrl(media.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao enviar o favicon.");
    } finally {
      setUploadingFavicon(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await updateSiteAppearance({
        logo_url: logoUrl,
        favicon_url: faviconUrl,
        color_primary: colorPrimary,
        color_accent: colorAccent,
        color_paper: colorPaper,
        font_heading: fontHeading,
        font_body: fontBody,
        nav_links: navLinks,
        footer_links: footerLinks,
        social_links: socialLinks,
      });
      setMessage("Aparência salva. Sincronize o site para publicar as mudanças.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar a aparência.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    setSyncMessage(null);
    try {
      await triggerSiteRebuild();
      setSyncMessage("Sincronização disparada — o site publicado atualiza em cerca de 1 minuto.");
    } catch (err) {
      setSyncMessage(err instanceof Error ? err.message : "Não foi possível sincronizar.");
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return <p className="p-6 text-sm text-polis-slate">Carregando...</p>;
  }

  return (
    <>
      <AdminTopbar
        title="Aparência"
        description="Identidade visual do site: logo, cores, tipografia e menus."
      />

      <div className="max-w-3xl space-y-6 p-6">
        <Card>
          <h3 className="text-sm font-semibold text-polis-navy">Sincronizar site publicado</h3>
          <p className="mt-1 text-xs text-polis-slate">
            Assim como matérias, mudanças de aparência só aparecem no site publicado depois de uma
            sincronização (automática ao salvar, ou manual aqui).
          </p>
          <Button type="button" variant="secondary" disabled={syncing} onClick={handleSync} className="mt-3">
            {syncing ? "Sincronizando..." : "🔄 Sincronizar site"}
          </Button>
          {syncMessage && <p className="mt-2 text-xs text-polis-slate">{syncMessage}</p>}
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          <fieldset className="rounded-sm border border-polis-navy/10 bg-white p-4">
            <legend className="px-1 text-sm font-semibold text-polis-navy">Logo e favicon</legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <span className="block text-xs font-semibold text-polis-slate">Logo do site</span>
                {logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="Logo atual" className="mt-2 h-12 w-auto object-contain" />
                )}
                <label className="mt-2 flex h-16 cursor-pointer items-center justify-center rounded-sm border-2 border-dashed border-polis-navy/20 text-xs text-polis-gray hover:border-polis-gold">
                  {uploadingLogo ? "Enviando..." : "Clique para enviar um logo"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={!isAdmin}
                    onChange={handleLogoUpload}
                  />
                </label>
              </div>
              <div>
                <span className="block text-xs font-semibold text-polis-slate">Favicon</span>
                {faviconUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={faviconUrl} alt="Favicon atual" className="mt-2 h-8 w-8 object-contain" />
                )}
                <label className="mt-2 flex h-16 cursor-pointer items-center justify-center rounded-sm border-2 border-dashed border-polis-navy/20 text-xs text-polis-gray hover:border-polis-gold">
                  {uploadingFavicon ? "Enviando..." : "Clique para enviar um favicon"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={!isAdmin}
                    onChange={handleFaviconUpload}
                  />
                </label>
              </div>
            </div>
          </fieldset>

          <fieldset className="rounded-sm border border-polis-navy/10 bg-white p-4">
            <legend className="px-1 text-sm font-semibold text-polis-navy">Cores</legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <ColorField label="Primária (navbar, títulos)" value={colorPrimary} onChange={setColorPrimary} disabled={!isAdmin} />
              <ColorField label="Destaque (links, botões)" value={colorAccent} onChange={setColorAccent} disabled={!isAdmin} />
              <ColorField label="Papel (fundo)" value={colorPaper} onChange={setColorPaper} disabled={!isAdmin} />
            </div>
            <div
              className="mt-4 flex items-center justify-between rounded-sm border p-4"
              style={{ backgroundColor: colorPaper, borderColor: colorPrimary }}
            >
              <span className="font-serif text-sm font-bold" style={{ color: colorPrimary }}>
                Pré-visualização
              </span>
              <span
                className="rounded-sm px-3 py-1.5 text-xs font-semibold"
                style={{ backgroundColor: colorAccent, color: colorPrimary }}
              >
                Botão
              </span>
            </div>
          </fieldset>

          <fieldset className="rounded-sm border border-polis-navy/10 bg-white p-4">
            <legend className="px-1 text-sm font-semibold text-polis-navy">Tipografia</legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="fontHeading" className="block text-xs font-semibold text-polis-slate">
                  Fonte de títulos
                </label>
                <select
                  id="fontHeading"
                  value={fontHeading}
                  onChange={(event) => setFontHeading(event.target.value as HeadingFont)}
                  disabled={!isAdmin}
                  className="mt-1 w-full rounded-sm border border-polis-navy/20 px-3 py-2 text-sm focus:border-polis-gold focus:outline-none disabled:bg-polis-off-white"
                >
                  {HEADING_FONT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="fontBody" className="block text-xs font-semibold text-polis-slate">
                  Fonte de texto
                </label>
                <select
                  id="fontBody"
                  value={fontBody}
                  onChange={(event) => setFontBody(event.target.value as BodyFont)}
                  disabled={!isAdmin}
                  className="mt-1 w-full rounded-sm border border-polis-navy/20 px-3 py-2 text-sm focus:border-polis-gold focus:outline-none disabled:bg-polis-off-white"
                >
                  {BODY_FONT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </fieldset>

          <LinkListField
            legend="Menu do topo (itens extras, além das editorias)"
            items={navLinks}
            onChange={setNavLinks}
            disabled={!isAdmin}
          />

          <LinkListField
            legend="Menu institucional (rodapé)"
            items={footerLinks}
            onChange={setFooterLinks}
            disabled={!isAdmin}
          />

          <SocialListField items={socialLinks} onChange={setSocialLinks} disabled={!isAdmin} />

          {error && (
            <p role="alert" className="rounded-sm bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          {message && <p className="text-sm text-polis-slate">{message}</p>}

          {isAdmin && (
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar Aparência"}
            </Button>
          )}
        </form>
      </div>
    </>
  );
}

function ColorField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <span className="block text-xs font-semibold text-polis-slate">{label}</span>
      <div className="mt-1 flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className="h-9 w-9 shrink-0 cursor-pointer rounded-sm border border-polis-navy/20 disabled:cursor-not-allowed"
        />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className="w-full rounded-sm border border-polis-navy/20 px-3 py-2 font-mono text-sm focus:border-polis-gold focus:outline-none disabled:bg-polis-off-white"
        />
      </div>
    </div>
  );
}

function LinkListField({
  legend,
  items,
  onChange,
  disabled,
}: {
  legend: string;
  items: NavLink[];
  onChange: (items: NavLink[]) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset className="rounded-sm border border-polis-navy/10 bg-white p-4">
      <legend className="px-1 text-sm font-semibold text-polis-navy">{legend}</legend>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              value={item.label}
              onChange={(event) =>
                onChange(items.map((it, i) => (i === index ? { ...it, label: event.target.value } : it)))
              }
              placeholder="Rótulo"
              disabled={disabled}
              className="w-1/3 rounded-sm border border-polis-navy/20 px-3 py-2 text-sm focus:border-polis-gold focus:outline-none disabled:bg-polis-off-white"
            />
            <input
              value={item.href}
              onChange={(event) =>
                onChange(items.map((it, i) => (i === index ? { ...it, href: event.target.value } : it)))
              }
              placeholder="/caminho"
              disabled={disabled}
              className="flex-1 rounded-sm border border-polis-navy/20 px-3 py-2 font-mono text-xs focus:border-polis-gold focus:outline-none disabled:bg-polis-off-white"
            />
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange(moveItem(items, index, -1))}
              className="rounded-sm border border-polis-navy/20 px-2 py-1.5 text-xs disabled:opacity-40"
              aria-label="Mover para cima"
            >
              ▲
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange(moveItem(items, index, 1))}
              className="rounded-sm border border-polis-navy/20 px-2 py-1.5 text-xs disabled:opacity-40"
              aria-label="Mover para baixo"
            >
              ▼
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange(items.filter((_, i) => i !== index))}
              className="text-xs font-semibold text-red-700 hover:underline disabled:opacity-40"
            >
              Remover
            </button>
          </div>
        ))}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange([...items, { label: "", href: "" }])}
          className="text-xs font-semibold text-polis-navy hover:text-polis-gold disabled:opacity-40"
        >
          + Adicionar link
        </button>
      </div>
    </fieldset>
  );
}

function SocialListField({
  items,
  onChange,
  disabled,
}: {
  items: SocialLink[];
  onChange: (items: SocialLink[]) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset className="rounded-sm border border-polis-navy/10 bg-white p-4">
      <legend className="px-1 text-sm font-semibold text-polis-navy">Redes sociais</legend>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              value={item.platform}
              onChange={(event) =>
                onChange(items.map((it, i) => (i === index ? { ...it, platform: event.target.value } : it)))
              }
              placeholder="Instagram"
              disabled={disabled}
              className="w-1/3 rounded-sm border border-polis-navy/20 px-3 py-2 text-sm focus:border-polis-gold focus:outline-none disabled:bg-polis-off-white"
            />
            <input
              value={item.url}
              onChange={(event) =>
                onChange(items.map((it, i) => (i === index ? { ...it, url: event.target.value } : it)))
              }
              placeholder="https://instagram.com/..."
              disabled={disabled}
              className="flex-1 rounded-sm border border-polis-navy/20 px-3 py-2 font-mono text-xs focus:border-polis-gold focus:outline-none disabled:bg-polis-off-white"
            />
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange(items.filter((_, i) => i !== index))}
              className="text-xs font-semibold text-red-700 hover:underline disabled:opacity-40"
            >
              Remover
            </button>
          </div>
        ))}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange([...items, { platform: "", url: "" }])}
          className="text-xs font-semibold text-polis-navy hover:text-polis-gold disabled:opacity-40"
        >
          + Adicionar rede social
        </button>
      </div>
    </fieldset>
  );
}
