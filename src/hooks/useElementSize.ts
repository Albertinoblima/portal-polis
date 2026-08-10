"use client";

import { useCallback, useEffect, useState } from "react";

interface ElementSize {
  width: number;
  height: number;
}

const ZERO_SIZE: ElementSize = { width: 0, height: 0 };

/**
 * Mede via ResizeObserver o tamanho real (em px) de um elemento — usado pelos
 * tabuleiros dos jogos para calcular exatamente quantos px cabem na área
 * disponível (ver Newspaper.tsx, que já mede o viewport do jeito). Começa em
 * {0,0} até a primeira medição no cliente; o chamador deve tratar esse
 * estado inicial (ex.: esconder o tabuleiro) para não piscar um tamanho
 * errado antes da primeira medição real.
 *
 * Usa callback ref (não `useRef` + `useEffect([])`) de propósito: o
 * elemento medido pode só existir várias renderizações depois da primeira
 * (ex.: o tabuleiro do Jogo da Velha, que só monta depois que o jogador sai
 * das telas de "escolher modo"/"cadastro"). Com `useRef`, o efeito de
 * montagem roda uma vez só, vê `ref.current === null` (o elemento ainda não
 * existia) e nunca mais tenta de novo — o tabuleiro fica preso em 0×0 para
 * sempre. O callback ref dispara toda vez que o nó é anexado/removido,
 * então o ResizeObserver é sempre religado no elemento certo.
 */
export function useElementSize<T extends HTMLElement>() {
  const [node, setNode] = useState<T | null>(null);
  const [size, setSize] = useState<ElementSize>(ZERO_SIZE);

  const ref = useCallback((el: T | null) => {
    setNode(el);
  }, []);

  useEffect(() => {
    if (!node) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);

  return [ref, size] as const;
}
