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
      className="group block overflow-hidden rounded-sm border border-transparent transition-all hover:border-polis-gold/60 hover:shadow-md"
    >
      <div className={isLarge ? "aspect-[16/9]" : "aspect-[4/3]"}>
        <div className="relative h-full w-full overflow-hidden bg-polis-navy/5">
          <Image
            src={article.featuredImage}
            alt={article.featuredImageAlt}
            fill
            sizes={isLarge ? "100vw" : "(min-width: 768px) 33vw, 100vw"}
            className="object-contain p-6 transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </div>
      <div className="space-y-2 py-4">
        {editoria && <EditoriaBadge name={editoria.name} color={editoria.color} />}
        <h3
          className={
            isLarge
              ? "font-sans text-2xl font-bold text-polis-navy md:text-3xl"
              : "font-sans text-lg font-bold text-polis-navy"
          }
        >
          {article.title}
        </h3>
        <p className="line-clamp-2 text-sm text-polis-slate">{article.subtitle}</p>
        <p className="text-xs text-polis-gray">
          {formatDate(article.publishedAt)} · {article.readingTimeMinutes} min de leitura
        </p>
      </div>
    </Link>
  );
}
