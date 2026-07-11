// Sincroniza o conteúdo publicado no Supabase para src/content/*.json.
//
// O site público é gerado 100% estaticamente (output: "export") a partir
// desses arquivos — nenhuma página pública fala com o Supabase em tempo de
// execução. Isso mantém o site rápido, indexável e hospedável no GitHub
// Pages, e reduz a superfície de dados exposta ao público ao mínimo
// necessário (não inclui e-mail de autores, dados de rascunho, etc).
//
// Rodado em CI antes de `next build` (veja .github/workflows/deploy.yml).
// Localmente, se as variáveis de ambiente não estiverem definidas, mantém
// o conteúdo de exemplo já versionado em src/content/ (não falha o dev).

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

  const [editorias, authors, articles, banners] = await Promise.all([
    fetchEditorias(supabase),
    fetchAuthors(supabase),
    fetchArticles(supabase),
    fetchBanners(supabase),
  ]);

  await Promise.all([
    writeJson("editorias.json", editorias),
    writeJson("authors.json", authors),
    writeJson("articles.json", articles),
    writeJson("banners.json", banners),
  ]);

  console.log(
    `✓ Conteúdo sincronizado: ${editorias.length} editorias, ${authors.length} autores, ${articles.length} matérias publicadas, ${banners.length} banners ativos.`
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

async function fetchArticles(supabase) {
  const { data, error } = await supabase
    .from("articles")
    .select(
      `id, title, slug, subtitle, content, featured_image, featured_image_alt,
       editoria_id, author_id, status, published_at, scheduled_at,
       seo_title, seo_description, reading_time_minutes, view_count,
       created_at, updated_at,
       article_categories ( category_id ),
       article_tags ( tag_id )`
    )
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .is("deleted_at", null)
    .order("published_at", { ascending: false });

  if (error) throw new Error(`Falha ao buscar matérias: ${error.message}`);

  return data.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    subtitle: row.subtitle,
    content: row.content,
    featuredImage: row.featured_image,
    featuredImageAlt: row.featured_image_alt,
    editoriaId: row.editoria_id,
    authorId: row.author_id,
    categoryIds: (row.article_categories ?? []).map((c) => c.category_id),
    tagIds: (row.article_tags ?? []).map((t) => t.tag_id),
    status: row.status,
    publishedAt: row.published_at,
    scheduledAt: row.scheduled_at ?? undefined,
    seoTitle: row.seo_title ?? undefined,
    seoDescription: row.seo_description ?? undefined,
    readingTimeMinutes: row.reading_time_minutes,
    viewCount: row.view_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

async function fetchBanners(supabase) {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("banners")
    .select("id, title, image_url, link_url, position, start_date, end_date, is_active")
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

async function writeJson(filename, data) {
  const filePath = path.join(CONTENT_DIR, filename);
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
}

main().catch((error) => {
  console.error("✗ Falha ao sincronizar conteúdo:", error.message);
  process.exit(1);
});
