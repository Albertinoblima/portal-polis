import Image from "next/image";
import Link from "next/link";
import type { Article, Editoria } from "@/types";
import { formatDate } from "@/lib/utils";
import { EditoriaBadge } from "@/components/ui/Badge";

interface ArticleCardProps {
  article: Article;
  editoria?: Editoria;
  size?: "default" | "large";
}

export function ArticleCard({ article, editoria, size = "default" }: ArticleCardProps) {
  const isLarge = size === "large";

  return (
    <Link
      href={`/materia/${article.slug}`}
      className="group block overflow-hidden rounded-sm border border-transparent transition-all hover:border-polis-gold-muted/60"
    >
      {/* pointer-events-none nos filhos: a biblioteca de page-flip só ignora
          cliques quando event.target É o próprio <a>/<button> (não olha
          ancestrais) — sem isso, tocar na imagem ou no título (o normal, já
          que ocupam quase todo o card) faz o touchstart cair no fluxo de
          "virar página" da biblioteca, que dá preventDefault() e suprime o
          click sintético do toque, quebrando a navegação só no mobile. */}
      <div className={`pointer-events-none ${isLarge ? "aspect-[16/9]" : "aspect-[4/3]"}`}>
        <div className="relative h-full w-full overflow-hidden bg-polis-ink/5">
          <Image
            src={article.featuredImage}
            alt={article.featuredImageAlt}
            fill
            sizes={isLarge ? "100vw" : "(min-width: 768px) 33vw, 100vw"}
            className="object-contain p-6 grayscale transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </div>
      <div className="pointer-events-none space-y-2 py-4">
        {editoria && <EditoriaBadge name={editoria.name} color={editoria.color} />}
        <h3
          className={
            isLarge
              ? "font-serif text-2xl font-bold leading-tight text-polis-ink md:text-3xl"
              : "font-serif text-lg font-bold leading-tight text-polis-ink"
          }
        >
          {article.title}
        </h3>
        <p className="line-clamp-2 text-sm text-polis-ink-soft">{article.subtitle}</p>
        <p className="text-xs text-polis-ink-soft">
          {formatDate(article.publishedAt)} · {article.readingTimeMinutes} min de leitura
        </p>
      </div>
    </Link>
  );
}
