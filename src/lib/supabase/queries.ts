import { supabase } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import type { ArticleStatus, BannerPosition, CommentStatus, UserRole } from "@/types/database";

export async function getEditorias() {
  const { data, error } = await supabase.from("editorias").select("*").order("name");
  if (error) throw error;
  return data;
}

export async function createEditoria(input: {
  name: string;
  slug: string;
  color: string;
  description: string;
}) {
  const { data, error } = await supabase.from("editorias").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateEditoria(
  id: string,
  input: Partial<{ name: string; slug: string; color: string; description: string; is_active: boolean }>
) {
  const { data, error } = await supabase
    .from("editorias")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getStaffProfiles() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .neq("role", "user")
    .order("name");
  if (error) throw error;
  return data;
}

export async function getArticlesForAdmin() {
  const { data, error } = await supabase
    .from("articles")
    .select(
      "*, editoria:editorias(id, name, color, slug), author:profiles!articles_author_id_fkey(id, name)"
    )
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getArticleById(id: string) {
  const { data, error } = await supabase
    .from("articles")
    .select("*, article_tags(tags(name))")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export interface ArticleFormInput {
  title: string;
  slug: string;
  subtitle: string;
  content: string;
  featured_image: string | null;
  featured_image_alt: string;
  editoria_id: string;
  author_id: string;
  status: ArticleStatus;
  scheduled_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  reading_time_minutes: number;
}

export async function createArticle(input: ArticleFormInput) {
  const publishedAt = input.status === "published" ? new Date().toISOString() : null;
  const { data, error } = await supabase
    .from("articles")
    .insert({ ...input, published_at: publishedAt })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateArticle(id: string, input: Partial<ArticleFormInput>) {
  const patch: Partial<ArticleFormInput> & { published_at?: string | null } = { ...input };
  if (input.status === "published") {
    patch.published_at = new Date().toISOString();
  }
  const { data, error } = await supabase
    .from("articles")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function softDeleteArticle(id: string) {
  const { error } = await supabase
    .from("articles")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function setArticleTags(articleId: string, tagNames: string[]) {
  const slugs = tagNames.map((name) => ({ name, slug: slugify(name) }));

  const tagIds: string[] = [];
  for (const tag of slugs) {
    if (!tag.slug) continue;
    const { data: existing } = await supabase
      .from("tags")
      .select("id")
      .eq("slug", tag.slug)
      .maybeSingle();

    if (existing) {
      tagIds.push(existing.id);
    } else {
      const { data: created, error } = await supabase.from("tags").insert(tag).select().single();
      if (error) throw error;
      tagIds.push(created.id);
    }
  }

  await supabase.from("article_tags").delete().eq("article_id", articleId);
  if (tagIds.length > 0) {
    const { error } = await supabase
      .from("article_tags")
      .insert(tagIds.map((tagId) => ({ article_id: articleId, tag_id: tagId })));
    if (error) throw error;
  }
}

export async function getMedia() {
  const { data, error } = await supabase.from("media").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function uploadMedia(file: File, uploadedBy: string, altText: string) {
  const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const { error: uploadError } = await supabase.storage.from("media").upload(path, file);
  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from("media").getPublicUrl(path);

  const { data, error } = await supabase
    .from("media")
    .insert({
      filename: file.name,
      url: publicUrl,
      mime_type: file.type,
      size: file.size,
      alt_text: altText,
      uploaded_by: uploadedBy,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteMedia(id: string, filename: string) {
  const { error: dbError } = await supabase.from("media").delete().eq("id", id);
  if (dbError) throw dbError;
  await supabase.storage.from("media").remove([filename]);
}

export async function getBanners() {
  const { data, error } = await supabase.from("banners").select("*").order("start_date", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createBanner(input: {
  title: string;
  image_url: string;
  link_url: string;
  position: BannerPosition;
}) {
  const { data, error } = await supabase.from("banners").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function toggleBanner(id: string, isActive: boolean) {
  const { error } = await supabase.from("banners").update({ is_active: isActive }).eq("id", id);
  if (error) throw error;
}

export async function deleteBanner(id: string) {
  const { error } = await supabase.from("banners").delete().eq("id", id);
  if (error) throw error;
}

export async function getSiteSettings() {
  const { data, error } = await supabase.from("site_settings").select("*").eq("id", 1).single();
  if (error) throw error;
  return data;
}

export async function updateSiteSettings(input: {
  site_name: string;
  tagline: string;
  default_seo_title: string;
  default_seo_description: string;
}) {
  const { data, error } = await supabase
    .from("site_settings")
    .update(input)
    .eq("id", 1)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getTags() {
  const { data, error } = await supabase.from("tags").select("*").order("name");
  if (error) throw error;
  return data;
}

export async function createTag(input: { name: string; slug: string }) {
  const { data, error } = await supabase.from("tags").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateTag(id: string, input: Partial<{ name: string; slug: string }>) {
  const { data, error } = await supabase.from("tags").update(input).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteTag(id: string) {
  const { error } = await supabase.from("tags").delete().eq("id", id);
  if (error) throw error;
}

export async function getAuditLogs(limit = 100) {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*, user:profiles(id, name)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function updateProfileRole(id: string, role: UserRole) {
  const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
  if (error) throw error;
}

export async function toggleProfileActive(id: string, isActive: boolean) {
  const { error } = await supabase.from("profiles").update({ is_active: isActive }).eq("id", id);
  if (error) throw error;
}

export async function updateMediaAltText(id: string, altText: string) {
  const { error } = await supabase.from("media").update({ alt_text: altText }).eq("id", id);
  if (error) throw error;
}

export async function getComments() {
  const { data, error } = await supabase
    .from("comments")
    .select("*, article:articles(id, title, slug)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function updateCommentStatus(id: string, status: CommentStatus) {
  const { error } = await supabase.from("comments").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function deleteComment(id: string) {
  const { error } = await supabase.from("comments").delete().eq("id", id);
  if (error) throw error;
}

export async function getNewsletterSubscribers() {
  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getContactMessages() {
  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function markContactHandled(id: string, handled: boolean) {
  const { error } = await supabase
    .from("contact_messages")
    .update({ handled_at: handled ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) throw error;
}

export async function getStaffEditoriaIds(profileId: string) {
  const { data, error } = await supabase
    .from("staff_editorias")
    .select("editoria_id")
    .eq("profile_id", profileId);
  if (error) throw error;
  return data.map((row) => row.editoria_id);
}

export async function setStaffEditorias(profileId: string, editoriaIds: string[]) {
  const { error: deleteError } = await supabase
    .from("staff_editorias")
    .delete()
    .eq("profile_id", profileId);
  if (deleteError) throw deleteError;

  if (editoriaIds.length > 0) {
    const { error } = await supabase
      .from("staff_editorias")
      .insert(editoriaIds.map((editoriaId) => ({ profile_id: profileId, editoria_id: editoriaId })));
    if (error) throw error;
  }
}

export async function triggerSiteRebuild() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Sessão expirada.");

  const { error } = await supabase.functions.invoke("trigger-rebuild", {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (error) throw error;
}
