"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { PageFlipEngine, type PageFlipHandle } from "./PageFlipEngine";
import { PageChrome } from "./PageChrome";
import { Masthead } from "./Masthead";
import { HotCorner } from "./HotCorner";
import { AdMargin } from "./AdMargin";
import { paginateHtml } from "./paginate";
import { useIsClient } from "@/hooks/useIsClient";
import { getActiveBanners } from "@/lib/banners";

const SIDEBAR_BANNERS = getActiveBanners("sidebar");

export type NewspaperBlock =
  | { type: "html"; html: string; columns?: 1 | 2 | 3 }
  | { type: "node"; node: ReactNode; columns?: 1 | 2 | 3 }
  | {
      type: "grid";
      items: ReactNode[];
      itemsPerPage: { mobile: number; desktop: number };
      gridClassName?: string;
      emptyState?: ReactNode;
    };

interface NewspaperProps {
  sectionLabel: string;
  runningTitle?: string;
  showMasthead?: boolean;
  /** Edição a exibir no timbre (Masthead). Se omitido, usa a edição mais recente. */
  edition?: { number: number; date: string };
  blocks: NewspaperBlock[];
}

const DESKTOP_BREAKPOINT = 1024;
/**
 * Tamanho assumido antes da primeira medição real via ResizeObserver — usado
 * tanto no SSR/SSG quanto no primeiro render do cliente (mesmo valor nos dois,
 * para não gerar mismatch de hidratação). Sem isso, o HTML estático sairia sem
 * nenhum conteúdo (links de matéria, etc.), o que quebraria SEO e crawlers sem
 * JS. A paginação real substitui esta estimativa assim que o viewport é medido.
 */
const DEFAULT_SIZE = { width: 1280, height: 800 };
const CHROME_HEADER_PX = 33;
/** Altura real do <Masthead> (medida empiricamente), bem maior que a barra
 *  fina de título corrido usada nas demais páginas. */
const MASTHEAD_HEADER_PX = { desktop: 220, mobile: 195 };
const CHROME_FOOTER_PX = 40;
const PAGE_PADDING_Y_PX = 40;
const PAGE_PADDING_X_PX = 48;

interface PreparedPage {
  content: ReactNode;
  columns: 1 | 2 | 3;
  contentHeightPx: number;
  isMasthead?: boolean;
}

export function Newspaper({ sectionLabel, runningTitle, showMasthead = false, edition, blocks }: NewspaperProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const flipRef = useRef<PageFlipHandle>(null);
  const isClient = useIsClient();
  const [size, setSize] = useState<{ width: number; height: number }>(DEFAULT_SIZE);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageCountSeen, setPageCountSeen] = useState(0);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize((prev) =>
        prev && Math.abs(prev.width - width) < 4 && Math.abs(prev.height - height) < 4
          ? prev
          : { width, height }
      );
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const isDesktop = size.width >= DESKTOP_BREAKPOINT;
  const columnsDefault: 1 | 2 = isDesktop ? 2 : 1;
  const pageWidth = isDesktop ? size.width / 2 : size.width;
  const pageHeight = size.height;
  const contentWidth = Math.max(pageWidth - PAGE_PADDING_X_PX, 0);
  const contentHeight = Math.max(pageHeight - CHROME_HEADER_PX - CHROME_FOOTER_PX - PAGE_PADDING_Y_PX, 0);
  const mastheadHeaderPx = isDesktop ? MASTHEAD_HEADER_PX.desktop : MASTHEAD_HEADER_PX.mobile;
  const contentHeightCover = Math.max(pageHeight - mastheadHeaderPx - CHROME_FOOTER_PX - PAGE_PADDING_Y_PX, 0);

  const preparedPages = useMemo<PreparedPage[]>(() => {
    if (contentWidth <= 0 || contentHeight <= 0) return [];

    const out: PreparedPage[] = [];

    // O espaço publicitário vira uma folha real (não um overlay solto), para
    // que ela vire junto com o resto do livro como uma dobra de papel comum
    // — nunca uma folha "capa dura" isolada (ver showCover mais abaixo).
    // Só faz sentido no desktop: é pareada lado a lado com a capa/timbre na
    // primeira dobra dupla; no mobile cada folha aparece sozinha mesmo.
    if (isDesktop && showMasthead) {
      out.push({
        content: <AdMargin banners={SIDEBAR_BANNERS} />,
        columns: 1,
        contentHeightPx: contentHeightCover,
      });
    }

    let isFirstContentBlock = true;
    for (const block of blocks) {
      if (block.type === "node") {
        const columns = block.columns ?? columnsDefault;
        const isMasthead = isFirstContentBlock && showMasthead;
        out.push({
          content: block.node,
          columns,
          contentHeightPx: isMasthead ? contentHeightCover : contentHeight,
          isMasthead,
        });
        isFirstContentBlock = false;
        continue;
      }
      if (block.type === "grid") {
        const perPage = Math.max(isDesktop ? block.itemsPerPage.desktop : block.itemsPerPage.mobile, 1);
        if (block.items.length === 0) {
          if (block.emptyState) out.push({ content: block.emptyState, columns: 1, contentHeightPx: contentHeight });
          isFirstContentBlock = false;
          continue;
        }
        for (let i = 0; i < block.items.length; i += perPage) {
          const chunk = block.items.slice(i, i + perPage);
          out.push({
            content: <div className={block.gridClassName}>{chunk}</div>,
            columns: 1,
            contentHeightPx: contentHeight,
          });
        }
        isFirstContentBlock = false;
        continue;
      }

      const columns = block.columns ?? columnsDefault;
      const isMasthead = isFirstContentBlock && showMasthead;
      const budgetHeight = isMasthead ? contentHeightCover : contentHeight;
      // No primeiro render do cliente (hidratação), o layout real de colunas do
      // navegador já existe — diferente do servidor, onde `document` não existe
      // e paginateHtml sempre devolve o HTML inteiro como uma única folha. Sem
      // este `isClient`, a hidratação produziria uma contagem de páginas
      // diferente da renderizada pelo servidor (mismatch garantido em qualquer
      // matéria cujo corpo não caiba inteiro numa folha). Só medimos de verdade
      // depois que `isClient` vira true, no ciclo de render seguinte à hidratação.
      const fragments = isClient
        ? paginateHtml(block.html, {
            pageWidthPx: contentWidth,
            columnHeightPx: budgetHeight,
            columnsPerPage: columns,
          })
        : [block.html];
      fragments.forEach((html, fragmentIndex) => {
        out.push({
          content: (
            <div
              className="prose prose-sm md:prose-base max-w-none prose-headings:font-sans prose-blockquote:font-serif prose-blockquote:italic"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ),
          columns,
          contentHeightPx: fragmentIndex === 0 ? budgetHeight : contentHeight,
          isMasthead: fragmentIndex === 0 && isMasthead,
        });
      });
      isFirstContentBlock = false;
    }

    // O motor de flip trata qualquer folha que sobre sozinha (sem par) numa
    // dobra dupla como "capa dura" e força uma virada rígida nela — sempre
    // que o total for ímpar isso pegaria justo a última folha. Uma folha em
    // branco no final garante número par e todas as folhas viram como papel.
    if (out.length % 2 !== 0) {
      out.push({
        content: (
          <p className="flex h-full items-center justify-center font-serif text-sm italic text-polis-ink-soft">
            Esta página foi deixada em branco intencionalmente.
          </p>
        ),
        columns: 1,
        contentHeightPx: contentHeight,
      });
    }

    return out;
  }, [blocks, contentWidth, contentHeight, contentHeightCover, columnsDefault, isDesktop, isClient, showMasthead]);

  if (preparedPages.length !== pageCountSeen) {
    setPageCountSeen(preparedPages.length);
    setPageIndex(0);
  }

  const flipPages = useMemo(
    () =>
      preparedPages.map((page, index) => (
        <PageChrome
          key={index}
          pageNumber={index + 1}
          totalPages={preparedPages.length}
          sectionLabel={sectionLabel}
          columns={page.columns}
          contentHeightPx={page.contentHeightPx}
          runningTitle={index === 0 || page.isMasthead ? undefined : runningTitle}
          header={page.isMasthead ? <Masthead sectionLabel={sectionLabel} edition={edition} /> : undefined}
        >
          {page.content}
        </PageChrome>
      )),
    [preparedPages, sectionLabel, runningTitle, edition]
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight") flipRef.current?.flipNext();
      if (event.key === "ArrowLeft") flipRef.current?.flipPrev();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const totalPages = preparedPages.length;

  return (
    <div ref={viewportRef} className="relative h-full w-full">
      {flipPages.length > 0 && contentWidth > 0 && (
        <>
          <PageFlipEngine
            // Força remontagem completa sempre que a contagem de páginas muda
            // (ex.: da paginação de fallback do SSR para a real do cliente, ou
            // após um resize). Sem isso, o React tentaria reconciliar (inserir/
            // remover) filhos individuais que a biblioteca já reparentou para
            // dentro do próprio DOM dela — removeChild falha porque o nó não
            // está mais onde o React acha que está. Remontar em vez de
            // reconciliar evita esse conflito de propriedade do DOM por completo.
            key={totalPages}
            ref={flipRef}
            pages={flipPages}
            width={Math.max(pageWidth, 280)}
            height={Math.max(pageHeight, 360)}
            usePortrait={!isDesktop}
            // showCover:false (padrão) de propósito: a biblioteca marca a
            // capa como folha "dura" e vira com rotação rígida, sem a curva
            // macia das folhas internas — errado para um jornal, que não tem
            // capa de papelão. Ver o preenchimento de folha em branco acima:
            // junto disso, garante nº par de folhas, evitando que qualquer
            // folha sobre sozinha numa dobra e também vire rígida.
            className="mx-auto h-full"
            onFlip={setPageIndex}
          />

          <HotCorner />

          {/* Recurso de acessibilidade (teclado/leitor de tela) — a interação
              principal é clicar/arrastar o canto da página, como num jornal real. */}
          <nav
            aria-label="Navegação de páginas"
            className="pointer-events-none absolute inset-x-0 bottom-1 z-30 flex items-center justify-center gap-3 opacity-60 transition-opacity hover:opacity-100"
          >
            <button
              type="button"
              onClick={() => flipRef.current?.flipPrev()}
              disabled={pageIndex <= 0}
              aria-label="Página anterior"
              className="pointer-events-auto rounded-full border border-polis-rule/20 bg-polis-paper/80 px-2.5 py-0.5 text-[11px] text-polis-ink-soft disabled:opacity-30"
            >
              ‹
            </button>
            <span className="pointer-events-none text-[11px] text-polis-ink-soft">
              {pageIndex + 1} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => flipRef.current?.flipNext()}
              disabled={pageIndex >= totalPages - 1}
              aria-label="Próxima página"
              className="pointer-events-auto rounded-full border border-polis-rule/20 bg-polis-paper/80 px-2.5 py-0.5 text-[11px] text-polis-ink-soft disabled:opacity-30"
            >
              ›
            </button>
          </nav>
        </>
      )}
    </div>
  );
}
