import Image from "next/image";
import Link from "next/link";
import type { Article, Edition, Editoria, User } from "@/types";
import type { NewspaperBlock } from "@/components/newspaper/Newspaper";
import { ListenButton } from "@/components/articles/ListenButton";
import { EditoriaBadge } from "@/components/ui/Badge";
import { Crossword } from "@/components/games/Crossword";
import { WordSearch } from "@/components/games/WordSearch";
import { getEditoriaById, getAuthors } from "@/lib/content";
import { getCrosswordForEdition, getWordSearchForEdition } from "@/lib/editions";
import { formatDate } from "@/lib/utils";

interface ArticleBlockOptions {
  editoria?: Editoria;
  author?: User;
}

/**
 * Cabeçalho + corpo de uma matéria como dois blocos do flip-book. Usado tanto
 * pela página isolada da matéria (`/materia/[slug]`, que acrescenta seus
 * próprios blocos de compartilhar/comentários/relacionadas) quanto pelo fluxo
 * de edição (`/edicao/[number]` e a Home), que encadeia várias matérias em
 * sequência sem esses blocos extras.
 */
export function buildArticleBlocks(article: Article, { editoria, author }: ArticleBlockOptions): NewspaperBlock[] {
  const plainTextContent = article.content.replace(/<[^>]+>/g, " ");

  return [
    {
      type: "node",
      node: (
        <div className="flex h-full flex-col">
          <Link
            href={editoria ? `/editoria/${editoria.slug}` : "/"}
            className="mb-3 inline-flex w-fit items-center gap-2 text-xs font-semibold text-polis-ink-soft hover:text-polis-gold-ink"
          >
            ← Voltar
          </Link>

          {editoria && (
            <div className="mb-3">
              <EditoriaBadge name={editoria.name} color={editoria.color} />
            </div>
          )}

          <h1 className="font-serif text-2xl font-bold leading-tight text-polis-ink md:text-4xl">
            {article.title}
          </h1>

          <div className="mt-3">
            <ListenButton text={plainTextContent} />
          </div>

          <p className="mt-3 font-serif text-base italic text-polis-ink-soft md:text-lg">{article.subtitle}</p>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-y border-polis-rule/20 py-3 text-xs text-polis-ink-soft">
            {author && (
              <Link href={`/colunista/${author.id}`} className="font-semibold text-polis-ink hover:text-polis-gold-ink">
                {author.name}
              </Link>
            )}
            <span>{formatDate(article.publishedAt)}</span>
            <span>{article.readingTimeMinutes} min de leitura</span>
          </div>

          <div className="relative mt-4 min-h-0 flex-1 overflow-hidden rounded-sm bg-polis-ink/5">
            <Image
              src={article.featuredImage}
              alt={article.featuredImageAlt}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-contain p-6 grayscale"
              priority
            />
          </div>
        </div>
      ),
    },
    { type: "html", html: article.content },
  ];
}

/**
 * Capa de uma edição + todas as matérias do dia por completo + a cruzada e o
 * caça-palavras que estavam no ar naquela data — o "jornal inteiro" de um
 * dia, na ordem em que deve aparecer no flip-book (Home concatena várias
 * edições seguidas; `/edicao/[number]` usa uma só).
 */
export function buildEditionBlocks(edition: Edition): NewspaperBlock[] {
  const topStory = edition.articles[0];

  const blocks: NewspaperBlock[] = [
    {
      type: "node",
      columns: 1,
      node: (
        <div className="grid h-full grid-cols-1 items-center gap-8 sm:grid-cols-2">
          {topStory ? (
            <Link
              href={`/materia/${topStory.slug}`}
              className="relative block aspect-[4/3] overflow-hidden rounded-sm bg-polis-ink/5"
            >
              <Image
                src={topStory.featuredImage}
                alt={topStory.featuredImageAlt}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-contain p-6 grayscale"
                priority
              />
            </Link>
          ) : (
            <div />
          )}
          <ol className="mx-auto max-w-md list-decimal space-y-2 text-left text-sm text-polis-ink">
            {edition.articles.map((article) => (
              <li key={article.id}>
                <Link href={`/materia/${article.slug}`} className="hover:text-polis-gold-ink hover:underline">
                  {article.title}
                </Link>
              </li>
            ))}
          </ol>
        </div>
      ),
    },
  ];

  const authors = getAuthors();
  for (const article of edition.articles) {
    blocks.push(
      ...buildArticleBlocks(article, {
        editoria: getEditoriaById(article.editoriaId),
        author: authors.find((a) => a.id === article.authorId),
      })
    );
  }

  const crossword = getCrosswordForEdition(edition);
  if (crossword) {
    blocks.push({
      type: "node",
      node: (
        <div className="flex h-full flex-col">
          <div className="mx-auto mb-6 max-w-lg text-center">
            <h3 className="font-serif text-2xl font-bold text-polis-ink">Palavras Cruzadas</h3>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-polis-gold-ink">
              Edição nº {edition.number} · Tema: {crossword.theme}
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <Crossword puzzle={crossword} />
          </div>
        </div>
      ),
    });
  }

  const wordSearch = getWordSearchForEdition(edition);
  if (wordSearch) {
    blocks.push({
      type: "node",
      node: (
        <div className="flex h-full flex-col">
          <div className="mx-auto mb-6 max-w-lg text-center">
            <h3 className="font-serif text-2xl font-bold text-polis-ink">Caça-Palavras</h3>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-polis-gold-ink">
              Edição nº {edition.number} · Tema: {wordSearch.theme}
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <WordSearch puzzle={wordSearch} />
          </div>
        </div>
      ),
    });
  }

  return blocks;
}
