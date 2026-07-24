-- ─────────────────────────────────────────────────────────────────────────
-- SITE APPEARANCE (identidade visual do tema, editável em /admin/aparencia)
-- ─────────────────────────────────────────────────────────────────────────
-- footer_links guarda o array hoje hardcoded em NavBar.tsx (INSTITUTIONAL_LINKS)
-- como default, para não quebrar o menu institucional no primeiro deploy caso
-- o admin ainda não tenha salvo nada em Aparência.
alter table public.site_settings
  add column logo_url text,
  add column favicon_url text,
  add column color_primary text not null default '#0a192f',
  add column color_accent text not null default '#c9a227',
  add column color_paper text not null default '#f4f1e9',
  add column font_heading text not null default 'eb-garamond'
    check (font_heading in ('eb-garamond', 'playfair-display', 'merriweather')),
  add column font_body text not null default 'inter'
    check (font_body in ('inter', 'source-sans-3', 'ibm-plex-sans')),
  add column nav_links jsonb not null default '[]'::jsonb,
  add column footer_links jsonb not null default '[
    {"href": "/contato", "label": "Contato"},
    {"href": "/newsletter", "label": "Newsletter"},
    {"href": "/termos-de-uso", "label": "Termos de Uso"},
    {"href": "/politica-de-privacidade", "label": "Política de Privacidade"},
    {"href": "/politica-de-cookies", "label": "Política de Cookies"},
    {"href": "/lgpd", "label": "LGPD"}
  ]'::jsonb,
  add column social_links jsonb not null default '[]'::jsonb;
