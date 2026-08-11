"use client";

import type { WordSearchCell } from "@/lib/wordsearch";
import { segmentFor } from "./wordSearchEngine";

export interface FoundWordSegment {
  word: string;
  colorVar: string;
  cells: WordSearchCell[];
}

interface WordSearchOverlayProps {
  size: number;
  foundSegments: FoundWordSegment[];
  dragCells: WordSearchCell[];
  missCells: WordSearchCell[] | null;
}

/**
 * Camada de desenho da seleção — um único `<svg>` absolutamente posicionado
 * por cima da grade de letras (`pointer-events-none`, nunca captura toque/
 * clique). `viewBox` usa 1 unidade por célula, então os traços acompanham
 * o tabuleiro em qualquer tamanho de tela sem precisar recalcular pixels.
 *
 * Três tipos de traço, todos com pontas arredondadas (`strokeLinecap`) e
 * semitransparentes, estilo marca-texto:
 * - Arrasto ao vivo: acompanha o dedo/mouse enquanto o jogador seleciona.
 * - Palavras encontradas: fixas, cada uma na sua cor da paleta harmônica.
 * - Erro: um traço vermelho breve quando a seleção não bate com nenhuma
 *   palavra (limpo automaticamente pelo componente pai).
 */
export function WordSearchOverlay({ size, foundSegments, dragCells, missCells }: WordSearchOverlayProps) {
  return (
    <svg viewBox={`0 0 ${size} ${size}`} preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full">
      {foundSegments.map(({ word, colorVar, cells }) => {
        if (cells.length < 2) return null;
        const seg = segmentFor(cells);
        return (
          <line
            key={word}
            x1={seg.x1}
            y1={seg.y1}
            x2={seg.x2}
            y2={seg.y2}
            stroke={colorVar}
            strokeWidth={0.42}
            strokeLinecap="round"
            opacity={0.55}
          />
        );
      })}

      {dragCells.length >= 2 &&
        (() => {
          const seg = segmentFor(dragCells);
          return (
            <line
              x1={seg.x1}
              y1={seg.y1}
              x2={seg.x2}
              y2={seg.y2}
              stroke="var(--color-gold)"
              strokeWidth={0.62}
              strokeLinecap="round"
              opacity={0.5}
            />
          );
        })()}

      {missCells && missCells.length >= 2 && (
        <line {...segmentFor(missCells)} stroke="#b91c1c" strokeWidth={0.5} strokeLinecap="round" opacity={0.75} />
      )}
    </svg>
  );
}
