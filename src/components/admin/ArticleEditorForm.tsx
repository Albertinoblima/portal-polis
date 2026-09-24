"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ArticleStatus } from "@/types";
import { createArticle, getArticleById, updateArticle } from "@/lib/github/articles";
import { getAuthors, getEditorias } from "@/lib/content";
import { useAdminSession } from "@/components/admin/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/admin/Card";
import { MediaLibraryModal } from "@/components/admin/MediaLibraryModal";
import { RichTextEditor } from "@/components/admin/editor/RichTextEditor";
import { slugify } from "@/lib/utils";

interface Draft {
  title: string;
  subtitle: string;
  content: string;
  savedAt: string;
}

interface ArticleEditorFormProps {
  articleId?: string;
}

const PUBLISH_ROLES = ["admin", "editor_chief", "editor"];

export function ArticleEditorForm({ articleId }: ArticleEditorFormProps) {
  const router = useRouter();
  const { profile, accessToken } = useAdminSession();
  const canPublish = PUBLISH_ROLES.includes(profile.role);

  // Editorias e autores vêm de src/content/*.json (sincronizados do
  // Supabase em build, mas somente leitura — não dependem de login).
  const [editorias] = useState(() => getEditorias());
  const [staff] = useState(() => getAuthors());

  const [loading, setLoading] = useState(Boolean(articleId));
  const [currentStatus, setCurrentStatus] = useState<ArticleStatus>("draft");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [subtitle, setSubtitle] = useState("");
  const [content, setContent] = useState("");
  const [editoriaId, setEditoriaId] = useState(() => editorias[0]?.id ?? "");
  const [authorId, setAuthorId] = useState(() => staff[0]?.id ?? "");
  const [tagsInput, setTagsInput] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [featuredImageAlt, setFeaturedImageAlt] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [editorMode, setEditorMode] = useState<"visual" | "html">("visual");

  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
  const [savingAction, setSavingAction] = useState<ArticleStatus | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [pendingDraft, setPendingDraft] = useState<Draft | null>(null);
  const [isDraftPromptResolved, setIsDraftPromptResolved] = useState(false);
  const draftKey = `polis-draft-${articleId ?? "new"}`;

  useEffect(() => {
    let isMounted = true;

    async function load() {
      if (articleId) {
        const article = await getArticleById(accessToken, articleId);
        if (!isMounted) return;
        if (!article) {
          setFormError("Matéria não encontrada.");
          setLoading(false);
          return;
        }
        setTitle(article.title);
        setSlug(article.slug);
        setSlugEdited(true);
        setSubtitle(article.subtitle);
        setContent(article.content);
        setEditoriaId(article.editoriaId);
        setAuthorId(article.authorId);
        setSeoTitle(article.seoTitle ?? "");
        setSeoDescription(article.seoDescription ?? "");
        setFeaturedImage(article.featuredImage || null);
        setFeaturedImageAlt(article.featuredImageAlt);
        setScheduledAt(article.scheduledAt?.slice(0, 16) ?? "");
        setCurrentStatus(article.status);
        setTagsInput(article.tagIds.join(", "));
      }

      if (!isMounted) return;

      const storedDraft = window.localStorage.getItem(draftKey);
      if (storedDraft) {
        try {
          setPendingDraft(JSON.parse(storedDraft) as Draft);
        } catch {
          window.localStorage.removeItem(draftKey);
        }
      }
      setIsDraftPromptResolved(!storedDraft);

      setLoading(false);
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [articleId, accessToken, draftKey]);

  // Rascunho automático em localStorage — protege contra perda de texto se a
  // aba fechar antes de salvar. Só começa a gravar depois que o aviso de
  // "recuperar rascunho" (se houver um pendente) for resolvido pelo usuário,
  // para não sobrescrever o rascunho anterior antes de perguntar.
  useEffect(() => {
    if (!isDraftPromptResolved || loading) return;
    const timeout = setTimeout(() => {
      const draft: Draft = { title, subtitle, content, savedAt: new Date().toISOString() };
      window.localStorage.setItem(draftKey, JSON.stringify(draft));
    }, 3000);
    return () => clearTimeout(timeout);
  }, [title, subtitle, content, isDraftPromptResolved, loading, draftKey]);

  function handleRestoreDraft() {
    if (!pendingDraft) return;
    setTitle(pendingDraft.title);
    setSubtitle(pendingDraft.subtitle);
    setContent(pendingDraft.content);
    setSlugEdited(true);
    setPendingDraft(null);
    setIsDraftPromptResolved(true);
  }

  function handleDiscardDraft() {
    window.localStorage.removeItem(draftKey);
    setPendingDraft(null);
    setIsDraftPromptResolved(true);
  }

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugEdited) setSlug(slugify(value));
  }

  function handleFeaturedImageSelect(selected: { path: string; altText: string }) {
    setFeaturedImage(selected.path);
    if (!featuredImageAlt.trim() && selected.altText) setFeaturedImageAlt(selected.altText);
  }

  async function handleSave(status: ArticleStatus) {
    if (!title.trim() || !slug.trim() || !editoriaId || !authorId) {
      setFormError("Preencha ao menos título, editoria e autor antes de salvar.");
      return;
    }

    setSavingAction(status);
    setFormError(null);

    try {
      const plainTextContent = content.replace(/<[^>]+>/g, " ").trim();
      const wordCount = plainTextContent ? plainTextContent.split(/\s+/).filter(Boolean).length : 0;
      const readingTime = Math.max(1, Math.round(wordCount / 200));

      const tagList = tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      const input = {
        title: title.trim(),
        slug: slug.trim(),
        subtitle: subtitle.trim(),
        content,
        featuredImage: featuredImage ?? "",
        featuredImageAlt: featuredImageAlt.trim(),
        editoriaId,
        authorId,
        status,
        scheduledAt: status === "scheduled" && scheduledAt ? new Date(scheduledAt).toISOString() : null,
        seoTitle: seoTitle.trim() || null,
        seoDescription: seoDescription.trim() || null,
        readingTimeMinutes: readingTime,
        tagIds: tagList,
      };

      if (articleId) {
        await updateArticle(accessToken, articleId, input);
      } else {
        await createArticle(accessToken, input);
      }

      window.localStorage.removeItem(draftKey);
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
        {pendingDraft && (
          <div className="flex items-center justify-between gap-4 rounded-sm border border-polis-gold bg-polis-gold/10 px-4 py-3 text-sm text-polis-navy">
            <span>
              Encontramos um rascunho não salvo de{" "}
              {new Date(pendingDraft.savedAt).toLocaleString("pt-BR")}. Deseja recuperá-lo?
            </span>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={handleRestoreDraft}
                className="rounded-sm bg-polis-navy px-3 py-1.5 text-xs font-semibold text-white"
              >
                Recuperar rascunho
              </button>
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="rounded-sm border border-polis-navy/30 px-3 py-1.5 text-xs font-semibold text-polis-navy"
              >
                Descartar
              </button>
            </div>
          </div>
        )}

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
            <div className="mt-2">
              <RichTextEditor
                value={content}
                onChange={setContent}
                accessToken={accessToken}
                uploadedBy={profile.name}
              />
            </div>
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

        <Card>
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
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-polis-navy">Imagem de Destaque</h3>
          {featuredImage && (
            // aspect-square + object-contain (em vez de recortar com object-cover):
            // as fotos do site são padronizadas em 1:1, então esta prévia mostra a
            // imagem exatamente como vai aparecer publicada — se sobrar barra
            // (letterbox), é sinal de que o arquivo enviado não é quadrado.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={featuredImage}
              alt={featuredImageAlt}
              className="mt-3 aspect-square w-full rounded-sm bg-polis-navy/5 object-contain"
            />
          )}
          <button
            type="button"
            onClick={() => setIsMediaLibraryOpen(true)}
            className="mt-3 flex h-20 w-full flex-col items-center justify-center gap-0.5 rounded-sm border-2 border-dashed border-polis-navy/20 text-xs text-polis-gray hover:border-polis-gold"
          >
            <span>Selecionar da biblioteca de mídia</span>
            <span className="text-[10px] text-polis-gray/70">ou envie uma imagem nova (até 20MB)</span>
          </button>
          {isMediaLibraryOpen && (
            <MediaLibraryModal
              accessToken={accessToken}
              uploadedBy={profile.name}
              onSelect={handleFeaturedImageSelect}
              onClose={() => setIsMediaLibraryOpen(false)}
            />
          )}
          <input
            value={featuredImageAlt}
            onChange={(event) => setFeaturedImageAlt(event.target.value)}
            placeholder="Texto alternativo (acessibilidade)"
            className="mt-2 w-full rounded-sm border border-polis-navy/20 px-3 py-2 text-xs focus:border-polis-gold focus:outline-none"
          />
        </Card>
      </aside>
    </div>
  );
}
