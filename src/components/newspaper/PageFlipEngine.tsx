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
      const container = containerRef.current;
      if (renderedPages.length === 0 || !container) return;
      if (pageElementsRef.current.length !== renderedPages.length) return;

      const reducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // O page-flip congela width/height/size no construtor — ele não se
      // readapta sozinho depois. Usamos size:"fixed" + autoSize:false (em vez
      // de "stretch") para que a biblioteca desenhe cada folha EXATAMENTE do
      // tamanho que medimos via ResizeObserver; sem isso, o layout interno
      // dela (baseado em % do container + aspect-ratio) diverge da nossa
      // medição, e a curva da página vira um corte quase instantâneo em vez
      // de uma virada real. Recriamos a instância sempre que o efeito roda
      // (mudança real de tamanho, ou primeira montagem).
      //
      // flip.destroy() não é usado: ele remove o .stf__wrapper ANTES de
      // nossos elementos reais serem migrados para a próxima instância, e o
      // React perde a referência de onde esses nós realmente estão no
      // documento (testado empiricamente — o conteúdo simplesmente some).
      // Em vez disso, guardamos o wrapper da instância anterior e só o
      // removemos DEPOIS que loadFromHTML já moveu nosso conteúdo real para
      // dentro do wrapper novo — nesse ponto o antigo já está vazio, e
      // removê-lo evita que ele fique "flutuando" por cima do conteúdo atual
      // bloqueando cliques (um wrapper vazio ainda ocupa 100%x100% e
      // intercepta ponteiro, mesmo invisível).
      const previousWrapper = container.querySelector<HTMLElement>(":scope > .stf__wrapper");

      const flip = new PageFlip(container, {
        width,
        height,
        size: "fixed",
        autoSize: false,
        minWidth: width,
        maxWidth: width,
        minHeight: height,
        maxHeight: height,
        usePortrait,
        showCover,
        drawShadow: true,
        flippingTime: reducedMotion ? 1 : 800,
        maxShadowOpacity: 0.5,
        mobileScrollSupport: false,
        useMouseEvents: true,
        showPageCorners: true,
        disableFlipByClick: false,
        clickEventForward: true,
        swipeDistance: 20,
      });
      flip.loadFromHTML(pageElementsRef.current);
      previousWrapper?.remove();
      pageFlipRef.current = flip;

      const handleFlip = (event: WidgetEvent) => onFlip?.(event.data as number);
      flip.on("flip", handleFlip);

      // A biblioteca decide sozinha, no touchend, se um toque vira a página —
      // mas essa lógica tem um bug real em dois cenários comuns: (1) um
      // "flick" rápido (<250ms) nunca chama startUserTouch (propositalmente
      // adiado por esse tempo, para não iniciar o efeito de dobra num toque
      // simples), então a checagem de swipe do próprio onTouchEnd calcula
      // isSwipe corretamente mas o userStop() que ela dispara é um no-op
      // inteiro, porque exige isUserTouch=true; (2) um arrasto lento e
      // deliberado (>250ms, o gesto natural de "puxar a página") só completa
      // a virada se soltar o dedo exatamente na borda oposta da página
      // (pos.x<=0) — qualquer coisa 1px antes disso volta ao lugar. Ou seja,
      // nenhum gesto de toque natural funciona de forma confiável. Como não
      // dá para configurar esse comportamento via settings, detectamos o
      // swipe nós mesmos e chamamos flipNext/flipPrev diretamente,
      // interceptando o evento (stopPropagation) antes que o handler
      // (quebrado) da própria biblioteca, registrado em `window`, o receba.
      const SWIPE_MIN_DISTANCE_PX = 40;
      const SWIPE_MAX_VERTICAL_DRIFT_PX = 100;
      let touchStart: { x: number; y: number } | null = null;

      // Não filtramos toques que começam num <a>/<button> aqui (ao contrário
      // do checkTarget da biblioteca): cards de matéria ocupam quase a folha
      // inteira, e o leitor precisa poder arrastar a partir de cima deles
      // também. Um toque curto (< SWIPE_MIN_DISTANCE_PX) nunca aciona
      // stopPropagation/preventDefault aqui, então o tap-to-click nativo do
      // link segue intocado — só um deslocamento horizontal de verdade conta
      // como intenção de virar página.
      const handleTouchStart = (event: TouchEvent) => {
        const touch = event.changedTouches[0];
        touchStart = touch ? { x: touch.clientX, y: touch.clientY } : null;
      };

      const handleTouchEnd = (event: TouchEvent) => {
        if (!touchStart) return;
        const touch = event.changedTouches[0];
        if (!touch) return;

        const dx = touch.clientX - touchStart.x;
        const dy = Math.abs(touch.clientY - touchStart.y);
        touchStart = null;

        if (Math.abs(dx) < SWIPE_MIN_DISTANCE_PX || dy > SWIPE_MAX_VERTICAL_DRIFT_PX) return;

        event.stopPropagation();
        if (dx < 0) pageFlipRef.current?.flipNext();
        else pageFlipRef.current?.flipPrev();
      };

      container.addEventListener("touchstart", handleTouchStart, { passive: true });
      container.addEventListener("touchend", handleTouchEnd, { passive: true });

      return () => {
        flip.off("flip");
        container.removeEventListener("touchstart", handleTouchStart);
        container.removeEventListener("touchend", handleTouchEnd);
        if (pageFlipRef.current === flip) pageFlipRef.current = null;
      };
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
