"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";

interface CommentRow {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
}

export function Comments({ articleId }: { articleId: string }) {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorName, setAuthorName] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  useEffect(() => {
    let isMounted = true;

    async function loadComments() {
      const { data } = await supabase
        .from("comments")
        .select("id, author_name, content, created_at")
        .eq("article_id", articleId)
        .eq("status", "approved")
        .order("created_at", { ascending: true });
      if (isMounted) {
        setComments(data ?? []);
        setLoading(false);
      }
    }

    loadComments();
    return () => {
      isMounted = false;
    };
  }, [articleId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");

    const { error } = await supabase.from("comments").insert({
      article_id: articleId,
      author_name: authorName.trim(),
      content: content.trim(),
    });

    if (error) {
      setStatus("error");
      return;
    }

    setStatus("success");
    setAuthorName("");
    setContent("");
  }

  return (
    <section className="mt-16 border-t border-polis-navy/10 pt-10">
      <h2 className="mb-6 border-b-2 border-polis-gold pb-2 font-sans text-xl font-bold text-polis-navy">
        Comentários{comments.length > 0 && ` (${comments.length})`}
      </h2>

      {loading ? (
        <p className="text-sm text-polis-slate">Carregando comentários...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-polis-slate">Seja o primeiro a comentar.</p>
      ) : (
        <ul className="space-y-6">
          {comments.map((comment) => (
            <li key={comment.id} className="border-b border-polis-navy/5 pb-4">
              <div className="flex items-baseline gap-3">
                <span className="font-semibold text-polis-navy">{comment.author_name}</span>
                <span className="text-xs text-polis-gray">{formatDate(comment.created_at)}</span>
              </div>
              <p className="mt-1 text-sm text-polis-navy/90">{comment.content}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8">
        {status === "success" ? (
          <p className="text-sm font-medium text-emerald-700">
            Comentário enviado! Ele será exibido após revisão da nossa equipe.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              required
              value={authorName}
              onChange={(event) => setAuthorName(event.target.value)}
              placeholder="Seu nome"
              className="w-full rounded-sm border border-polis-navy/20 px-4 py-2.5 text-sm focus:border-polis-gold focus:outline-none"
            />
            <textarea
              required
              rows={4}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Escreva seu comentário..."
              className="w-full rounded-sm border border-polis-navy/20 px-4 py-2.5 text-sm focus:border-polis-gold focus:outline-none"
            />
            {status === "error" && (
              <p className="text-sm text-red-700">
                Não foi possível enviar seu comentário. Tente novamente.
              </p>
            )}
            <Button type="submit" disabled={status === "submitting"}>
              {status === "submitting" ? "Enviando..." : "Comentar"}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
