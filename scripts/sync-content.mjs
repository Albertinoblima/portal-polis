// Sincroniza o conteúdo publicado no Supabase para src/content/*.json.
//
// O site público é gerado 100% estaticamente (output: "export") a partir
// desses arquivos — nenhuma página pública fala com o Supabase em tempo de
// execução. Isso mantém o site rápido, indexável e hospedável no GitHub
// Pages, e reduz a superfície de dados exposta ao público ao mínimo
// necessário (não inclui e-mail de autores, dados de rascunho, etc).
//
// IMPORTANTE: `articles.json` NÃO é mais sincronizado por este script. As
// matérias agora são gerenciadas 100% via GitHub Contents API pelo painel
// admin (ver src/lib/github/articles.ts) — cada publicação/edição já é um
// commit direto em `src/content/articles.json`, então rodar este script de
// novo sobrescreveria (e perderia) o conteúdo publicado pelo painel. Os
// demais arquivos (editorias, autores, banners, configurações) continuam
// vindo do Supabase normalmente.
//
// Rodado em CI antes de `next build` (veja .github/workflows/deploy.yml).
// Localmente, se as variáveis de ambiente não estiverem definidas, mantém
// o conteúdo de exemplo já versionado em src/content/ (não falha o dev).
//
// Resiliente a indisponibilidade do Supabase (projeto pausado/removido,
// falha de rede/DNS etc.): se a busca falhar mesmo com as credenciais
// configuradas, o build NÃO é interrompido — mantém os arquivos já
// versionados em src/content/*.json (podem ficar desatualizados até o
// Supabase voltar, mas o site continua no ar). Isso é intencional: com o
// login admin e as matérias já migrados para o GitHub, um Supabase fora do
// ar não deve mais conseguir travar o deploy inteiro.

import { createClient } from "@supabase/supabase-js";
import { writeFile } from "node:fs/promises";
import path from "node:path";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const CONTENT_DIR = path.join(process.cwd(), "src", "content");

async function main() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    if (process.env.CI === "true") {
      console.error(
        "✗ SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórios em CI (configure os secrets do repositório)."
      );
      process.exit(1);
    }
    console.warn(
      "⚠ SUPABASE_URL/SUPABASE_ANON_KEY não definidos — mantendo o conteúdo de exemplo em src/content/."
    );
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  let editorias, authors, banners, settings;
  try {
    [editorias, authors, banners, settings] = await Promise.all([
      fetchEditorias(supabase),
      fetchAuthors(supabase),
      fetchBanners(supabase),
      fetchSettings(supabase),
    ]);
  } catch (error) {
    console.warn(
      `⚠ Falha ao sincronizar conteúdo do Supabase (${error.message}) — mantendo os arquivos já versionados em src/content/ para não travar o build.`
    );
    return;
  }

  await Promise.all([
    writeJson("editorias.json", editorias),
    writeJson("authors.json", authors),
    writeJson("banners.json", banners),
    writeJson("settings.json", settings),
  ]);

  console.log(
    `✓ Conteúdo sincronizado: ${editorias.length} editorias, ${authors.length} autores, ${banners.length} banners ativos, configurações de aparência atualizadas. (articles.json não foi tocado — gerenciado pelo painel admin.)`
  );
}

async function fetchEditorias(supabase) {
  const { data, error } = await supabase
    .from("editorias")
    .select("id, name, slug, color, description, is_active")
    .eq("is_active", true)
    .order("name");

  if (error) throw new Error(`Falha ao buscar editorias: ${error.message}`);

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    color: row.color,
    description: row.description,
    isActive: row.is_active,
  }));
}

async function fetchAuthors(supabase) {
  const { data, error } = await supabase
    .from("authors_public")
    .select("id, name, avatar_url, bio, role, socials");

  if (error) throw new Error(`Falha ao buscar autores: ${error.message}`);

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    avatarUrl: row.avatar_url ?? undefined,
    role: row.role,
    bio: row.bio ?? undefined,
    socials: row.socials ?? {},
  }));
}

async function fetchBanners(supabase) {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("banners")
    .select("id, title, image_url, link_url, position, start_date, end_date, is_active")
    .eq("position", "sidebar")
    .eq("is_active", true)
    .lte("start_date", nowIso)
    .or(`end_date.is.null,end_date.gte.${nowIso}`)
    .order("start_date", { ascending: false });

  if (error) throw new Error(`Falha ao buscar banners: ${error.message}`);

  return data.map((row) => ({
    id: row.id,
    title: row.title,
    imageUrl: row.image_url,
    linkUrl: row.link_url,
    position: row.position,
    startDate: row.start_date,
    endDate: row.end_date ?? undefined,
    isActive: row.is_active,
  }));
}

async function fetchSettings(supabase) {
  const { data, error } = await supabase
    .from("site_settings")
    .select(
      `site_name, tagline, default_seo_title, default_seo_description,
       logo_url, favicon_url, color_primary, color_accent, color_paper,
       font_heading, font_body, nav_links, footer_links, social_links`
    )
    .eq("id", 1)
    .single();

  if (error) throw new Error(`Falha ao buscar configurações do site: ${error.message}`);

  return {
    siteName: data.site_name,
    tagline: data.tagline,
    defaultSeoTitle: data.default_seo_title,
    defaultSeoDescription: data.default_seo_description,
    logoUrl: data.logo_url ?? undefined,
    faviconUrl: data.favicon_url ?? undefined,
    colorPrimary: data.color_primary,
    colorAccent: data.color_accent,
    colorPaper: data.color_paper,
    fontHeading: data.font_heading,
    fontBody: data.font_body,
    navLinks: data.nav_links ?? [],
    footerLinks: data.footer_links ?? [],
    socialLinks: data.social_links ?? [],
  };
}

async function writeJson(filename, data) {
  const filePath = path.join(CONTENT_DIR, filename);
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
}

main().catch((error) => {
  console.error("✗ Falha ao sincronizar conteúdo:", error.message);
  process.exit(1);
});
