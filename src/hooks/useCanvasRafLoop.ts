"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Roda um loop de `requestAnimationFrame` chamando `draw(ctx)` a cada frame,
 *  redimensionando o canvas (com correção de devicePixelRatio para nitidez
 *  em telas retina) sempre que `sizePx` mudar. `draw` é lido de uma ref
 *  atualizada a cada render — assim o loop não precisa reiniciar quando o
 *  estado do jogo muda, só quando o tamanho em pixels muda de verdade.
 *
 *  Devolve um CALLBACK ref (não aceita um `useRef` pronto) de propósito: um
 *  mesmo jogo pode ter mais de um `<canvas>` (ex.: tabuleiro + painel
 *  "Próxima" no Jogo dos Blocos) e, em alguns layouts, um deles desmonta e
 *  outro monta no lugar (ex.: troca entre layout mobile/desktop, inclusive
 *  na primeira hidratação, quando useMediaQuery começa em `false` e corrige
 *  para o valor real do viewport logo em seguida). Com um `useRef` comum, o
 *  efeito abaixo só reexecuta quando `sizePx` muda — para um canvas de
 *  tamanho fixo, isso nunca acontece, então o loop ficava desenhando pra
 *  sempre no elemento ANTIGO (já removido do DOM), enquanto o canvas novo e
 *  visível nunca recebia nenhum frame. O callback ref dispara sempre que o
 *  nó de fato muda, então o efeito reinicia no elemento certo mesmo sem o
 *  tamanho ter mudado. */
export function useCanvasRafLoop(sizePx: { width: number; height: number } | null, draw: (ctx: CanvasRenderingContext2D) => void) {
  // O nó em si mora numa ref (não em useState): o canvas.width/height
  // precisa ser MUTADO diretamente (é assim que se redimensiona o buffer
  // de pixels de um <canvas>), e um valor guardado via useState não deve
  // ser mutado depois de renderizado. `generation` existe só para AVISAR o
  // efeito abaixo que o nó mudou (o callback ref incrementa a cada
  // montagem/desmontagem) — o efeito então lê o nó atual através da ref.
  const nodeRef = useRef<HTMLCanvasElement | null>(null);
  const [generation, setGeneration] = useState(0);
  const ref = useCallback((el: HTMLCanvasElement | null) => {
    nodeRef.current = el;
    setGeneration((g) => g + 1);
  }, []);

  const drawRef = useRef(draw);
  useEffect(() => {
    drawRef.current = draw;
  });

  useEffect(() => {
    const node = nodeRef.current;
    if (!node || !sizePx || sizePx.width <= 0 || sizePx.height <= 0) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    node.width = Math.round(sizePx.width * dpr);
    node.height = Math.round(sizePx.height * dpr);
    const ctx = node.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let rafId = 0;
    function frame() {
      drawRef.current(ctx as CanvasRenderingContext2D);
      rafId = requestAnimationFrame(frame);
    }
    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `generation` é o gatilho de troca de nó de propósito
  }, [generation, sizePx?.width, sizePx?.height]);

  return ref;
}
