"use client";

import { useState } from "react";
import type { Article } from "@/types";
import { getAuthors, getEditorias } from "@/lib/content";
import { Button } from "@/components/ui/Button";

interface ArticleEditorFormProps {
  article?: Article;
}

export function ArticleEditorForm({ article }: ArticleEditorFormProps) {
  const [editorMode, setEditorMode] = useState<"visual" | "html">("visual");
  const editorias = getEditorias();
  const authors = getAuthors();

  return (
    <form className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-5">
        <div>
          <label htmlFor="title" className="block text-sm font-semibold text-polis-navy">
            Título
          </label>
          <input
            id="title"
            name="title"
            defaultValue={article?.title}
            className="mt-1 w-full rounded-sm border border-polis-navy/20 px-4 py-2.5 text-lg font-semibold focus:border-polis-gold focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="subtitle" className="block text-sm font-semibold text-polis-navy">
            Subtítulo / Lide
          </label>
          <textarea
            id="subtitle"
            name="subtitle"
            defaultValue={article?.subtitle}
            rows={2}
            className="mt-1 w-full rounded-sm border border-polis-navy/20 px-4 py-2.5 focus:border-polis-gold focus:outline-none"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <span className="block text-sm font-semibold text-polis-navy">Conteúdo</span>
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
          <textarea
            id="content"
            name="content"
            defaultValue={article?.content}
            rows={16}
            placeholder={editorMode === "visual" ? "Escreva o conteúdo da matéria..." : "<p>Conteúdo em HTML...</p>"}
            className="mt-2 w-full rounded-sm border border-polis-navy/20 px-4 py-3 font-mono text-sm focus:border-polis-gold focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="editoria" className="block text-sm font-semibold text-polis-navy">
              Editoria
            </label>
            <select
              id="editoria"
              name="editoriaId"
              defaultValue={article?.editoriaId}
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
              name="authorId"
              defaultValue={article?.authorId}
              className="mt-1 w-full rounded-sm border border-polis-navy/20 px-4 py-2.5 focus:border-polis-gold focus:outline-none"
            >
              {authors.map((author) => (
                <option key={author.id} value={author.id}>
                  {author.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-semibold text-polis-navy">
            Tags
          </label>
          <input
            id="tags"
            name="tags"
            placeholder="congresso, economia, eleicoes-2026"
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
                name="seoTitle"
                defaultValue={article?.seoTitle}
                className="mt-1 w-full rounded-sm border border-polis-navy/20 px-4 py-2 text-sm focus:border-polis-gold focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="seoDescription" className="block text-xs font-semibold text-polis-slate">
                Meta descrição
              </label>
              <textarea
                id="seoDescription"
                name="seoDescription"
                defaultValue={article?.seoDescription}
                rows={2}
                className="mt-1 w-full rounded-sm border border-polis-navy/20 px-4 py-2 text-sm focus:border-polis-gold focus:outline-none"
              />
            </div>
          </div>
        </fieldset>
      </div>

      <aside className="space-y-4">
        <div className="rounded-sm border border-polis-navy/10 bg-white p-4">
          <h3 className="text-sm font-semibold text-polis-navy">Publicação</h3>
          <div className="mt-3 space-y-3">
            <div>
              <label htmlFor="status" className="block text-xs font-semibold text-polis-slate">
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={article?.status ?? "draft"}
                className="mt-1 w-full rounded-sm border border-polis-navy/20 px-3 py-2 text-sm focus:border-polis-gold focus:outline-none"
              >
                <option value="draft">Rascunho</option>
                <option value="in_review">Em Revisão</option>
                <option value="approved">Aprovado</option>
                <option value="published">Publicado</option>
                <option value="scheduled">Agendado</option>
                <option value="archived">Arquivado</option>
              </select>
            </div>
            <div>
              <label htmlFor="scheduledAt" className="block text-xs font-semibold text-polis-slate">
                Agendar publicação
              </label>
              <input
                id="scheduledAt"
                name="scheduledAt"
                type="datetime-local"
                className="mt-1 w-full rounded-sm border border-polis-navy/20 px-3 py-2 text-sm focus:border-polis-gold focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <Button type="button" variant="secondary" className="w-full">
              Salvar Rascunho
            </Button>
            <Button type="button" variant="secondary" className="w-full">
              Enviar para Revisão
            </Button>
            <Button type="submit" className="w-full">
              Publicar Agora
            </Button>
          </div>
        </div>

        <div className="rounded-sm border border-polis-navy/10 bg-white p-4">
          <h3 className="text-sm font-semibold text-polis-navy">Imagem de Destaque</h3>
          <div className="mt-3 flex h-32 items-center justify-center rounded-sm border-2 border-dashed border-polis-navy/20 text-xs text-polis-gray">
            Arraste uma imagem ou clique para enviar
          </div>
        </div>

        {article && (
          <div className="rounded-sm border border-polis-navy/10 bg-white p-4">
            <h3 className="text-sm font-semibold text-polis-navy">Histórico de Versões</h3>
            <p className="mt-2 text-xs text-polis-gray">
              Última atualização em {new Date(article.updatedAt).toLocaleString("pt-BR")}
            </p>
          </div>
        )}
      </aside>
    </form>
  );
}
