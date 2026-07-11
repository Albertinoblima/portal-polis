"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { PageFlipEngine, type PageFlipHandle } from "./PageFlipEngine";
import { PageChrome } from "./PageChrome";
import { Masthead } from "./Masthead";
import { HotCorner } from "./HotCorner";
import { paginateHtml } from "./paginate";

export type NewspaperBlock =
  | { type: "html"; html: string; columns?: 1 | 2 | 3 }
  | { type: "node"; node: ReactNode; dense?: boolean; columns?: 1 | 2 | 3 }
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
const CHROME_FOOTER_PX = 40;
const PAGE_PADDING_Y_PX = 40;
const PAGE_PADDING_X_PX = 48;

interface PreparedPage {
  content: ReactNode;
  columns: 1 | 2 | 3;
  dense?: boolean;
}

export function Newspaper({ sectionLabel, runningTitle, showMasthead = false, blocks }: NewspaperProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const flipRef = useRef<PageFlipHandle>(null);
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

  const preparedPages = useMemo<PreparedPage[]>(() => {
    if (contentWidth <= 0 || contentHeight <= 0) return [];

    const out: PreparedPage[] = [];
    for (const block of blocks) {
      if (block.type === "node") {
        const columns = block.columns ?? columnsDefault;
        out.push({ content: block.node, columns, dense: block.dense });
        continue;
      }
      if (block.type === "grid") {
        const perPage = Math.max(isDesktop ? block.itemsPerPage.desktop : block.itemsPerPage.mobile, 1);
        if (block.items.length === 0) {
          if (block.emptyState) out.push({ content: block.emptyState, columns: 1 });
          continue;
        }
        for (let i = 0; i < block.items.length; i += perPage) {
          const chunk = block.items.slice(i, i + perPage);
          out.push({
            content: <div className={block.gridClassName}>{chunk}</div>,
            columns: 1,
          });
        }
        continue;
      }

      const columns = block.columns ?? columnsDefault;
      const fragments = paginateHtml(block.html, {
        pageWidthPx: contentWidth,
        columnHeightPx: contentHeight,
        columnsPerPage: columns,
      });
      for (const html of fragments) {
        out.push({
          content: (
            <div
              className="prose prose-sm md:prose-base max-w-none prose-headings:font-sans prose-headings:text-polis-ink prose-p:text-polis-ink/90 prose-blockquote:border-polis-gold-muted prose-blockquote:font-serif prose-blockquote:italic prose-a:text-polis-gold-muted"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ),
          columns,
        });
      }
    }
    return out;
  }, [blocks, contentWidth, contentHeight, columnsDefault, isDesktop]);

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
          dense={page.dense}
          runningTitle={index === 0 ? undefined : runningTitle}
          header={index === 0 && showMasthead ? <Masthead sectionLabel={sectionLabel} /> : undefined}
        >
          {page.content}
        </PageChrome>
      )),
    [preparedPages, sectionLabel, runningTitle, showMasthead]
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
            ref={flipRef}
            pages={flipPages}
            width={Math.max(pageWidth, 280)}
            height={Math.max(pageHeight, 360)}
            usePortrait={!isDesktop}
            showCover={showMasthead}
            className="mx-auto h-full"
            onFlip={setPageIndex}
          />

          <HotCorner onFlip={() => flipRef.current?.flipNext()} />

          <nav
            aria-label="Navegação de páginas"
            className="pointer-events-none absolute inset-x-0 bottom-1 z-30 flex items-center justify-center gap-4"
          >
            <button
              type="button"
              onClick={() => flipRef.current?.flipPrev()}
              disabled={pageIndex <= 0}
              aria-label="Página anterior"
              className="pointer-events-auto rounded-full border border-polis-rule/30 bg-polis-paper/90 px-3 py-1 text-xs text-polis-ink shadow-sm disabled:opacity-30"
            >
              ‹ Anterior
            </button>
            <span className="pointer-events-none text-xs text-polis-ink-soft">
              {pageIndex + 1} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => flipRef.current?.flipNext()}
              disabled={pageIndex >= totalPages - 1}
              aria-label="Próxima página"
              className="pointer-events-auto rounded-full border border-polis-rule/30 bg-polis-paper/90 px-3 py-1 text-xs text-polis-ink shadow-sm disabled:opacity-30"
            >
              Próxima ›
            </button>
          </nav>
        </>
      )}
    </div>
  );
}
