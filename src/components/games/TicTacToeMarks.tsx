"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const DRAW_TRANSITION = { duration: 0.32, ease: "easeInOut" } as const;

/** X e O são desenhados via `pathLength` do Framer Motion (que faz o
 *  trabalho de stroke-dasharray/stroke-dashoffset por baixo dos panos) em
 *  vez de simplesmente "aparecer" — cada traço nasce com comprimento 0 e
 *  cresce até o total, dando o efeito de traçado fluido pedido. `viewBox`
 *  fixo em 100×100 deixa as coordenadas independentes do tamanho real da
 *  casa (que varia com o tabuleiro), então a peça sempre escala junto. */
export function XMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={cn("h-[58%] w-[58%]", className)} fill="none" aria-hidden="true">
      <motion.line
        x1={24}
        y1={24}
        x2={76}
        y2={76}
        stroke="currentColor"
        strokeWidth={11}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={DRAW_TRANSITION}
      />
      <motion.line
        x1={76}
        y1={24}
        x2={24}
        y2={76}
        stroke="currentColor"
        strokeWidth={11}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ ...DRAW_TRANSITION, delay: 0.1 }}
      />
    </svg>
  );
}

export function OMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={cn("h-[58%] w-[58%]", className)} fill="none" aria-hidden="true">
      <motion.circle
        cx={50}
        cy={50}
        r={31}
        stroke="currentColor"
        strokeWidth={11}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={DRAW_TRANSITION}
      />
    </svg>
  );
}
