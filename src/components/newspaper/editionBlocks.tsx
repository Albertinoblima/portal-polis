import Image from "next/image";
import Link from "next/link";
import type { Article, Edition, Editoria, User } from "@/types";
import type { NewspaperBlock } from "@/components/newspaper/Newspaper";
import { ListenButton } from "@/components/articles/ListenButton";
import { AudioPlayerButton } from "@/components/articles/AudioPlayerButton";
import { EditoriaBadge } from "@/components/ui/Badge";
import { Crossword } from "@/components/games/Crossword";
import { WordSearch } from "@/components/games/WordSearch";
import { getEditoriaById, getAuthors } from "@/lib/content";
import { getArticleAudioUrl } from "@/lib/audio";
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
  const audioUrl = getArticleAudioUrl(article.slug);

  const blocks: NewspaperBlock[] = [
    {
      type: "node",
      // Forçado a 1 (em vez de herdar o padrão de 2 colunas do desktop): este
      // bloco é um `flex-col` único e indivisível dentro do `column-count` do
      // PageChrome — com 2 colunas ele fica espremido na largura de UMA
      // sub-coluna (metade da página) e o título quebra em mais linhas do que
      // deveria. Com 1 coluna a largura total da página fica disponível.
      columns: 1,
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

          <h1 className="font-serif text-xl font-bold leading-tight text-polis-ink md:text-3xl">
            {article.title}
          </h1>

          <div className="mt-3">
            {audioUrl ? (
              <AudioPlayerButton src={audioUrl} />
            ) : (
              // Sem áudio do Piper ainda gerado para esta matéria (build mais
              // recente que a publicação, ou falha silenciosa do TTS) —
              // fallback local via Web Speech API, sem depender de rede.
              <ListenButton text={plainTextContent} />
            )}
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
        </div>
      ),
    },
  ];

  if (article.featuredImage) {
    blocks.push({
      type: "node",
      // Página própria (em vez de dividir espaço com o título): o bloco
      // acima já ocupa quase todo o orçamento de altura fixa da capa (ver
      // `contentHeightCover` em Newspaper.tsx, reduzido pelo timbre do
      // jornal) — título + resumo + foto juntos não cabem em telas mais
      // baixas (ex.: notebook 1280×720), e o que sobra some silenciosamente
      // (o `column-count` do PageChrome empurra o excesso para uma coluna
      // invisível em vez de cortar visivelmente). Com a foto na PRÓXIMA
      // página ela usa o orçamento cheio (sem o timbre), com folga de sobra.
      // `aspect-square` + `max-h` deriva o tamanho da LARGURA (eixo sempre
      // confiável, mesmo em column-count) em vez de uma altura percentual do
      // ancestral (essa sim instável nesse contexto — chegou a renderizar
      // uma foto quadrada de 512x512 com ~90px de altura ao vivo).
      // `object-contain` garante que a foto apareça inteira, nunca cortada.
      columns: 1,
      node: (
        <div className="flex h-full flex-col items-center justify-center">
          <div className="relative aspect-square w-full max-h-[280px] overflow-hidden rounded-sm bg-polis-ink/5 sm:max-h-[360px] lg:max-h-[440px]">
            <Image
              src={article.featuredImage}
              alt={article.featuredImageAlt}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-contain grayscale"
              priority
            />
          </div>
        </div>
      ),
    });
  }

  blocks.push({ type: "html", html: article.content });

  return blocks;
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
          {topStory?.featuredImage ? (
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
            <Crossword puzzle={crossword} layout="embedded" />
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
            <WordSearch puzzle={wordSearch} layout="embedded" />
          </div>
        </div>
      ),
    });
  }

  blocks.push({
    type: "node",
    columns: 1,
    node: (
      <div className="mx-auto flex h-full w-full max-w-2xl flex-col justify-center border-y border-polis-rule/20 py-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-polis-ink-soft">Entretenimento</p>
        <h3 className="mt-2 font-serif text-2xl font-bold text-polis-ink">Mais joguinhos do Portal Pólis</h3>
        <p className="mx-auto mt-3 max-w-xl text-sm text-polis-ink-soft">
          Continue a leitura com partidas rápidas no estilo retrô: Jogo da Velha, Cobrinha e Blocos.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
          <Link
            href="/entretenimento/jogos/jogo-da-velha"
            className="border border-polis-ink/25 bg-polis-paper-soft/20 px-4 py-3 font-serif font-semibold text-polis-ink transition-colors hover:border-polis-gold-muted hover:text-polis-gold-ink"
          >
            Jogo da Velha
          </Link>
          <Link
            href="/entretenimento/jogos/cobrinha"
            className="border border-polis-ink/25 bg-polis-paper-soft/20 px-4 py-3 font-serif font-semibold text-polis-ink transition-colors hover:border-polis-gold-muted hover:text-polis-gold-ink"
          >
            Cobrinha
          </Link>
          <Link
            href="/entretenimento/jogos/blocos"
            className="border border-polis-ink/25 bg-polis-paper-soft/20 px-4 py-3 font-serif font-semibold text-polis-ink transition-colors hover:border-polis-gold-muted hover:text-polis-gold-ink"
          >
            Blocos
          </Link>
        </div>

        <Link
          href="/entretenimento/jogos"
          className="mt-4 text-xs font-semibold uppercase tracking-[0.15em] text-polis-ink-soft underline hover:text-polis-gold-ink"
        >
          Ver todos os jogos
        </Link>
      </div>
    ),
  });

  return blocks;
}
