"use client";

import {
  cloneElement,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type MutableRefObject,
  type ReactElement,
} from "react";
import { PageFlip, type WidgetEvent } from "page-flip";

export interface PageFlipHandle {
  flipNext: () => void;
  flipPrev: () => void;
  turnToPage: (page: number) => void;
  getCurrentPageIndex: () => number;
  getPageCount: () => number;
}

interface PageFlipEngineProps {
  /** Uma página React (com ref encaminhável para um elemento DOM) por folha. */
  pages: ReactElement[];
  width: number;
  height: number;
  className?: string;
  usePortrait?: boolean;
  showCover?: boolean;
  onFlip?: (pageIndex: number) => void;
}

function attachRef(
  child: ReactElement,
  index: number,
  collector: MutableRefObject<HTMLElement[]>
): ReactElement {
  return cloneElement(child, {
    key: child.key ?? index,
    ref: (dom: HTMLElement | null) => {
      if (dom) collector.current[index] = dom;
    },
  } as { key: string | number; ref: (dom: HTMLElement | null) => void });
}

export const PageFlipEngine = forwardRef<PageFlipHandle, PageFlipEngineProps>(
  function PageFlipEngine(
    { pages, width, height, className, usePortrait = true, showCover = false, onFlip },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const pageElementsRef = useRef<HTMLElement[]>([]);
    const pageFlipRef = useRef<PageFlip | null>(null);

    // Renderizado de forma síncrona (sem passar por estado/efeito) para que o
    // HTML de cada folha já exista no SSR/SSG — essencial para SEO e para
    // quem navega sem JavaScript. O efeito abaixo só liga o motor de flip
    // por cima do DOM que o React já montou.
    pageElementsRef.current = [];
    const renderedPages = pages.map((page, index) => attachRef(page, index, pageElementsRef));

    useEffect(() => {
      if (renderedPages.length === 0 || !containerRef.current) return;
      if (pageElementsRef.current.length !== renderedPages.length) return;

      const reducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (!pageFlipRef.current) {
        const flip = new PageFlip(containerRef.current, {
          width,
          height,
          size: "stretch",
          minWidth: 280,
          maxWidth: 1400,
          minHeight: 360,
          maxHeight: 1600,
          usePortrait,
          showCover,
          drawShadow: true,
          flippingTime: reducedMotion ? 1 : 700,
          maxShadowOpacity: 0.35,
          mobileScrollSupport: false,
          useMouseEvents: true,
          showPageCorners: true,
          disableFlipByClick: false,
          swipeDistance: 20,
        });
        flip.loadFromHTML(pageElementsRef.current);
        pageFlipRef.current = flip;
      } else {
        pageFlipRef.current.updateFromHtml(pageElementsRef.current);
      }

      const flip = pageFlipRef.current;
      const handleFlip = (event: WidgetEvent) => onFlip?.(event.data as number);
      flip.on("flip", handleFlip);
      return () => flip.off("flip");
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pages, width, height, usePortrait, showCover]);

    useImperativeHandle(ref, () => ({
      flipNext: () => pageFlipRef.current?.flipNext(),
      flipPrev: () => pageFlipRef.current?.flipPrev(),
      turnToPage: (page: number) => pageFlipRef.current?.turnToPage(page),
      getCurrentPageIndex: () => pageFlipRef.current?.getCurrentPageIndex() ?? 0,
      getPageCount: () => pageFlipRef.current?.getPageCount() ?? 0,
    }));

    return (
      <div ref={containerRef} className={className}>
        {renderedPages}
      </div>
    );
  }
);
