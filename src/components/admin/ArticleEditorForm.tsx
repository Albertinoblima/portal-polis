"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ArticleStatus } from "@/types/database";
import {
  createArticle,
  getArticleById,
  getEditorias,
  getStaffProfiles,
  setArticleTags,
  triggerSiteRebuild,
  updateArticle,
  uploadMedia,
} from "@/lib/supabase/queries";
import { useAdminSession } from "@/components/admin/AuthProvider";
import { logAction } from "@/lib/supabase/audit";
import { Button } from "@/components/ui/Button";
import { slugify } from "@/lib/utils";

interface ArticleEditorFormProps {
  articleId?: string;
}

const PUBLISH_ROLES = ["admin", "editor_chief", "editor"];

type Editoria = Awaited<ReturnType<typeof getEditorias>>[number];
type StaffProfile = Awaited<ReturnType<typeof getStaffProfiles>>[number];

export function ArticleEditorForm({ articleId }: ArticleEditorFormProps) {
  const router = useRouter();
  const { profile } = useAdminSession();
  const canPublish = PUBLISH_ROLES.includes(profile.role);

  const [loading, setLoading] = useState(true);
  const [editorias, setEditorias] = useState<Editoria[]>([]);
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [currentStatus, setCurrentStatus] = useState<ArticleStatus>("draft");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [subtitle, setSubtitle] = useState("");
  const [content, setContent] = useState("");
  const [editoriaId, setEditoriaId] = useState("");
  const [authorId, setAuthorId] = useState(profile.id);
  const [tagsInput, setTagsInput] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [featuredImageAlt, setFeaturedImageAlt] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [editorMode, setEditorMode] = useState<"visual" | "html">("visual");

  const [isUploading, setIsUploading] = useState(false);
  const [savingAction, setSavingAction] = useState<ArticleStatus | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      const [editoriasData, staffData] = await Promise.all([getEditorias(), getStaffProfiles()]);
      if (!isMounted) return;
      setEditorias(editoriasData);
      setStaff(staffData);
      if (!articleId && editoriasData[0]) setEditoriaId(editoriasData[0].id);

      if (articleId) {
        const article = await getArticleById(articleId);
        if (!isMounted || !article) return;
        setTitle(article.title);
        setSlug(article.slug);
        setSlugEdited(true);
        setSubtitle(article.subtitle);
        setContent(article.content);
        setEditoriaId(article.editoria_id);
        setAuthorId(article.author_id);
        setSeoTitle(article.seo_title ?? "");
        setSeoDescription(article.seo_description ?? "");
        setFeaturedImage(article.featured_image);
        setFeaturedImageAlt(article.featured_image_alt);
        setScheduledAt(article.scheduled_at?.slice(0, 16) ?? "");
        setCurrentStatus(article.status);
        const tagNames = (article.article_tags ?? [])
          .map((row) => row.tags?.name)
          .filter((name): name is string => Boolean(name));
        setTagsInput(tagNames.join(", "));
      }

      setLoading(false);
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [articleId]);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugEdited) setSlug(slugify(value));
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setFormError(null);
    try {
      const media = await uploadMedia(file, profile.id, featuredImageAlt || title);
      setFeaturedImage(media.url);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Falha ao enviar imagem.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSave(status: ArticleStatus) {
    if (!title.trim() || !slug.trim() || !editoriaId || !authorId) {
      setFormError("Preencha ao menos título, editoria e autor antes de salvar.");
      return;
    }

    setSavingAction(status);
    setFormError(null);

    try {
      const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
      const readingTime = Math.max(1, Math.round(wordCount / 200));

      const input = {
        title: title.trim(),
        slug: slug.trim(),
        subtitle: subtitle.trim(),
        content,
        featured_image: featuredImage,
        featured_image_alt: featuredImageAlt.trim(),
        editoria_id: editoriaId,
        author_id: authorId,
        status,
        scheduled_at: status === "scheduled" && scheduledAt ? new Date(scheduledAt).toISOString() : null,
        seo_title: seoTitle.trim() || null,
        seo_description: seoDescription.trim() || null,
        reading_time_minutes: readingTime,
      };

      const savedArticle = articleId
        ? await updateArticle(articleId, input)
        : await createArticle(input);

      const tagNames = tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
      await setArticleTags(savedArticle.id, tagNames);

      await logAction({
        userId: profile.id,
        action: articleId ? "update" : "create",
        entity: "article",
        entityId: savedArticle.id,
        newValue: { title: input.title, status: input.status },
      });

      if (status === "published") {
        try {
          await triggerSiteRebuild();
        } catch {
          setFormError(
            "Matéria salva e publicada, mas não foi possível disparar a atualização automática do site. Use \"Sincronizar site\" no Dashboard."
          );
          return;
        }
      }

      router.push("/admin/materias/");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Não foi possível salvar a matéria.");
    } finally {
      setSavingAction(null);
    }
  }

  if (loading) {
    return <p className="p-6 text-sm text-polis-slate">Carregando editor...</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-5">
        <div>
          <label htmlFor="title" className="block text-sm font-semibold text-polis-navy">
            Título
          </label>
          <input
            id="title"
            value={title}
            onChange={(event) => handleTitleChange(event.target.value)}
            className="mt-1 w-full rounded-sm border border-polis-navy/20 px-4 py-2.5 text-lg font-semibold focus:border-polis-gold focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="slug" className="block text-sm font-semibold text-polis-navy">
            Slug (URL)
          </label>
          <input
            id="slug"
            value={slug}
            onChange={(event) => {
              setSlug(event.target.value);
              setSlugEdited(true);
            }}
            className="mt-1 w-full rounded-sm border border-polis-navy/20 px-4 py-2.5 font-mono text-sm focus:border-polis-gold focus:outline-none"
          />
          <p className="mt-1 text-xs text-polis-gray">/materia/{slug || "..."}</p>
        </div>

        <div>
          <label htmlFor="subtitle" className="block text-sm font-semibold text-polis-navy">
            Subtítulo / Lide
          </label>
          <textarea
            id="subtitle"
            value={subtitle}
            onChange={(event) => setSubtitle(event.target.value)}
            rows={2}
            className="mt-1 w-full rounded-sm border border-polis-navy/20 px-4 py-2.5 focus:border-polis-gold focus:outline-none"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <span className="block text-sm font-semibold text-polis-navy">Conteúdo (HTML)</span>
            <div className="flex overflow-hidden rounded-sm border border-polis-navy/20 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setEditorMode("visual")}
                className={`px-3 py-1.5 ${editorMode === "visual" ? "bg-polis-navy text-white" : "text-polis-navy"}`}
              >
                Visual
              </button>
              <button
                type="button"
                onClick={() => setEditorMode("html")}
                className={`px-3 py-1.5 ${editorMode === "html" ? "bg-polis-navy text-white" : "text-polis-navy"}`}
              >
                HTML
              </button>
            </div>
          </div>
          {editorMode === "visual" ? (
            <div
              contentEditable
              role="textbox"
              aria-multiline="true"
              aria-label="Conteúdo da matéria"
              suppressContentEditableWarning
              onBlur={(event) => setContent(event.currentTarget.innerHTML)}
              dangerouslySetInnerHTML={{ __html: content }}
              className="prose prose-sm mt-2 min-h-[320px] w-full max-w-none rounded-sm border border-polis-navy/20 px-4 py-3 focus:border-polis-gold focus:outline-none"
            />
          ) : (
            <textarea
              aria-label="Conteúdo da matéria em HTML"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={16}
              className="mt-2 w-full rounded-sm border border-polis-navy/20 px-4 py-3 font-mono text-sm focus:border-polis-gold focus:outline-none"
            />
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="editoria" className="block text-sm font-semibold text-polis-navy">
              Editoria
            </label>
            <select
              id="editoria"
              value={editoriaId}
              onChange={(event) => setEditoriaId(event.target.value)}
              className="mt-1 w-full rounded-sm border border-polis-navy/20 px-4 py-2.5 focus:border-polis-gold focus:outline-none"
            >
              {editorias.map((editoria) => (
                <option key={editoria.id} value={editoria.id}>
                  {editoria.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="author" className="block text-sm font-semibold text-polis-navy">
              Autor
            </label>
            <select
              id="author"
              value={authorId}
              onChange={(event) => setAuthorId(event.target.value)}
              className="mt-1 w-full rounded-sm border border-polis-navy/20 px-4 py-2.5 focus:border-polis-gold focus:outline-none"
            >
              {staff.map((author) => (
                <option key={author.id} value={author.id}>
                  {author.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-semibold text-polis-navy">
            Tags (separadas por vírgula)
          </label>
          <input
            id="tags"
            value={tagsInput}
            onChange={(event) => setTagsInput(event.target.value)}
            placeholder="Congresso, Economia, Eleições 2026"
            className="mt-1 w-full rounded-sm border border-polis-navy/20 px-4 py-2.5 focus:border-polis-gold focus:outline-none"
          />
        </div>

        <fieldset className="rounded-sm border border-polis-navy/10 p-4">
          <legend className="px-1 text-sm font-semibold text-polis-navy">SEO</legend>
          <div className="space-y-3">
            <div>
              <label htmlFor="seoTitle" className="block text-xs font-semibold text-polis-slate">
                Meta título
              </label>
              <input
                id="seoTitle"
                value={seoTitle}
                onChange={(event) => setSeoTitle(event.target.value)}
                className="mt-1 w-full rounded-sm border border-polis-navy/20 px-4 py-2 text-sm focus:border-polis-gold focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="seoDescription" className="block text-xs font-semibold text-polis-slate">
                Meta descrição
              </label>
              <textarea
                id="seoDescription"
                value={seoDescription}
                onChange={(event) => setSeoDescription(event.target.value)}
                rows={2}
                className="mt-1 w-full rounded-sm border border-polis-navy/20 px-4 py-2 text-sm focus:border-polis-gold focus:outline-none"
              />
            </div>
          </div>
        </fieldset>
      </div>

      <aside className="space-y-4">
        {formError && (
          <p role="alert" className="rounded-sm bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </p>
        )}

        <div className="rounded-sm border border-polis-navy/10 bg-white p-4">
          <h3 className="text-sm font-semibold text-polis-navy">Publicação</h3>
          <p className="mt-1 text-xs text-polis-gray">Status atual: {currentStatus}</p>

          {currentStatus === "scheduled" || scheduledAt ? (
            <div className="mt-3">
              <label htmlFor="scheduledAt" className="block text-xs font-semibold text-polis-slate">
                Agendar publicação
              </label>
              <input
                id="scheduledAt"
                type="datetime-local"
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
                className="mt-1 w-full rounded-sm border border-polis-navy/20 px-3 py-2 text-sm focus:border-polis-gold focus:outline-none"
              />
            </div>
          ) : null}

          <div className="mt-4 space-y-2">
            <Button
              type="button"
              variant="secondary"
              disabled={savingAction !== null}
              onClick={() => handleSave("draft")}
              className="w-full"
            >
              {savingAction === "draft" ? "Salvando..." : "Salvar Rascunho"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={savingAction !== null}
              onClick={() => handleSave("in_review")}
              className="w-full"
            >
              {savingAction === "in_review" ? "Enviando..." : "Enviar para Revisão"}
            </Button>
            {canPublish && (
              <Button
                type="button"
                disabled={savingAction !== null}
                onClick={() => handleSave("published")}
                className="w-full"
              >
                {savingAction === "published" ? "Publicando..." : "Publicar Agora"}
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-sm border border-polis-navy/10 bg-white p-4">
          <h3 className="text-sm font-semibold text-polis-navy">Imagem de Destaque</h3>
          {featuredImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={featuredImage}
              alt={featuredImageAlt}
              className="mt-3 h-32 w-full rounded-sm object-cover"
            />
          )}
          <label className="mt-3 flex h-20 cursor-pointer items-center justify-center rounded-sm border-2 border-dashed border-polis-navy/20 text-xs text-polis-gray hover:border-polis-gold">
            {isUploading ? "Enviando..." : "Clique para enviar uma imagem"}
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
          <input
            value={featuredImageAlt}
            onChange={(event) => setFeaturedImageAlt(event.target.value)}
            placeholder="Texto alternativo (acessibilidade)"
            className="mt-2 w-full rounded-sm border border-polis-navy/20 px-3 py-2 text-xs focus:border-polis-gold focus:outline-none"
          />
        </div>
      </aside>
    </div>
  );
}
