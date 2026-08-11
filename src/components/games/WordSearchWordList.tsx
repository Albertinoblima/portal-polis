"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { wordColorVar } from "./wordSearchEngine";

interface WordSearchWordListProps {
  words: string[];
  foundWords: Set<string>;
  columns?: 2 | 3;
  className?: string;
}

function WordCheckbox({ checked, colorVar }: { checked: boolean; colorVar: string }) {
  return (
    <span
      aria-hidden="true"
      className="relative flex h-4 w-4 shrink-0 items-center justify-center border transition-colors duration-200"
      style={{ borderColor: checked ? colorVar : "var(--color-rule)", backgroundColor: checked ? colorVar : "transparent" }}
    >
      <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none">
        <motion.path
          d="M3 8.5L6.5 12L13 4"
          stroke="white"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={checked ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        />
      </svg>
    </span>
  );
}

/** Lista de palavras do dia — cada item é uma "caixa de seleção" animada
 *  (desenha o check ao ser encontrada, na mesma cor do traço daquela
 *  palavra no tabuleiro) e o texto ganha um risco que cresce da esquerda
 *  pra direita via `transform: scaleX` (mais suave entre navegadores do
 *  que animar `text-decoration-line` direto). */
export function WordSearchWordList({ words, foundWords, columns = 2, className }: WordSearchWordListProps) {
  return (
    <ul className={cn("grid gap-x-4 gap-y-2 text-sm", columns === 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2", className)}>
      {words.map((word, index) => {
        const found = foundWords.has(word);
        const colorVar = wordColorVar(index);
        return (
          <li key={word} className="flex items-center gap-2">
            <WordCheckbox checked={found} colorVar={colorVar} />
            <span className={cn("relative inline-block font-mono text-[13px] tracking-[0.04em]", found ? "text-polis-ink-soft" : "text-polis-ink")}>
              {word}
              <span
                className="pointer-events-none absolute left-0 top-1/2 h-[2px] w-full origin-left transition-transform duration-300 ease-out"
                style={{ backgroundColor: colorVar, transform: found ? "translateY(-50%) scaleX(1)" : "translateY(-50%) scaleX(0)" }}
              />
            </span>
          </li>
        );
      })}
    </ul>
  );
}
