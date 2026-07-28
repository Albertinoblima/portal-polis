import Image from "next/image";
import Link from "next/link";
import type { Article, Edition, Editoria, User } from "@/types";
import type { NewspaperBlock } from "@/components/newspaper/Newspaper";
import { ListenButton } from "@/components/articles/ListenButton";
import { AudioPlayerButton } from "@/components/articles/AudioPlayerButton";
import { EditoriaBadge } from "@/components/ui/Badge";
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
              <AudioPlayerButton src={audioUrl} articleTitle={article.title} articleSlug={article.slug} />
            ) : (
              // Sem áudio do Piper ainda gerado para esta matéria (build mais
              // recente que a publicação, ou falha silenciosa do TTS) —
              // fallback local via Web Speech API, sem depender de rede.
              <ListenButton text={plainTextContent} articleTitle={article.title} />
            )}
          </div>

          <p className="mt-3 font-serif text-lg italic text-polis-ink-soft md:text-xl">{article.subtitle}</p>

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

  blocks.push({ type: "html", html: article.content, ttsId: article.slug });

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
      // Página própria, só com a foto de destaque (em vez de dividir espaço
      // com o índice num grid 2 colunas de altura fixa): é este bloco que
      // carrega o timbre (Masthead — só o primeiro bloco de "node" recebe o
      // orçamento `contentHeightCover`, ver Newspaper.tsx), então precisa
      // continuar sendo `type: "node"` e vir primeiro. O índice completo, por
      // maior que seja, vai para o bloco `type: "grid"` logo abaixo, que já
      // pagina automaticamente (ver itemsPerPage) em vez de cortar o excesso
      // silenciosamente como o `overflow-hidden` fazia antes.
      type: "node",
      columns: 1,
      node: topStory?.featuredImage ? (
        <div className="flex h-full flex-col items-center justify-center">
          <Link
            href={`/materia/${topStory.slug}`}
            className="relative block aspect-[4/3] w-full max-w-xl overflow-hidden rounded-sm bg-polis-ink/5"
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
        </div>
      ) : (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <p className="font-serif text-lg italic text-polis-ink-soft">Edição nº {edition.number}</p>
        </div>
      ),
    },
    {
      type: "grid",
      items: edition.articles.map((article, index) => (
        <div key={article.id} className="flex items-baseline gap-2">
          <span className="text-xs font-semibold text-polis-ink-soft">{index + 1}.</span>
          <Link href={`/materia/${article.slug}`} className="hover:text-polis-gold-ink hover:underline">
            {article.title}
          </Link>
        </div>
      )),
      itemsPerPage: { mobile: 8, desktop: 14 },
      gridClassName: "mx-auto flex h-full max-w-md flex-col justify-center gap-3 text-sm text-polis-ink",
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

  // Passatempos aparecem na capa só como uma chamada com link, não jogáveis
  // dentro do flip-book: o tabuleiro embutido (layout="embedded") competia
  // com o próprio gesto de arrastar/virar página do jornal, tornando difícil
  // tocar numa casa sem virar a folha sem querer — leitores reclamaram que
  // não conseguiam responder. A página própria do passatempo
  // (`/entretenimento/.../[slug]`) não tem esse conflito de gesto e tem mais
  // espaço para o tabuleiro.
  const crossword = getCrosswordForEdition(edition);
  if (crossword) {
    blocks.push({
      type: "node",
      columns: 1,
      node: (
        <div className="mx-auto flex h-full w-full max-w-xl flex-col items-center justify-center gap-4 border-y border-polis-rule/20 py-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-polis-ink-soft">Entretenimento</p>
          <h3 className="font-serif text-2xl font-bold text-polis-ink">Palavras Cruzadas</h3>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-polis-gold-ink">
            Edição nº {edition.number} · Tema: {crossword.theme}
          </p>
          <p className="max-w-md text-sm text-polis-ink-soft">
            Responda na página do passatempo, com mais espaço para o tabuleiro e conferência automática das respostas.
          </p>
          <Link
            href={`/entretenimento/palavras-cruzadas/${crossword.slug}/`}
            className="mt-2 border border-polis-ink/25 bg-polis-paper-soft/20 px-6 py-3 font-serif font-semibold text-polis-ink transition-colors hover:border-polis-gold-muted hover:text-polis-gold-ink"
          >
            Responder agora →
          </Link>
        </div>
      ),
    });
  }

  const wordSearch = getWordSearchForEdition(edition);
  if (wordSearch) {
    blocks.push({
      type: "node",
      columns: 1,
      node: (
        <div className="mx-auto flex h-full w-full max-w-xl flex-col items-center justify-center gap-4 border-y border-polis-rule/20 py-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-polis-ink-soft">Entretenimento</p>
          <h3 className="font-serif text-2xl font-bold text-polis-ink">Caça-Palavras</h3>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-polis-gold-ink">
            Edição nº {edition.number} · Tema: {wordSearch.theme}
          </p>
          <p className="max-w-md text-sm text-polis-ink-soft">
            Responda na página do passatempo, com mais espaço para a grade e conferência automática das respostas.
          </p>
          <Link
            href={`/entretenimento/caca-palavras/${wordSearch.slug}/`}
            className="mt-2 border border-polis-ink/25 bg-polis-paper-soft/20 px-6 py-3 font-serif font-semibold text-polis-ink transition-colors hover:border-polis-gold-muted hover:text-polis-gold-ink"
          >
            Responder agora →
          </Link>
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
