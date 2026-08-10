"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { SettingsGearIcon } from "@/components/games/GameIcons";
import { cn } from "@/lib/utils";

interface GameInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}

/**
 * Painel de "Configurações & Guia" acionado pela engrenagem no cabeçalho do
 * jogo. Existe para tirar do fluxo principal tudo que não é o
 * tabuleiro/controles em si (seleção de modo, regras, textos de ajuda) — é
 * isso que garante que o jogo caiba na área útil da página sem rolagem (ver
 * pedido do usuário: jogo e controles sempre visíveis, texto explicativo à
 * parte).
 */
export function GameInfoDialog({ open, onOpenChange, title, children }: GameInfoDialogProps) {
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onOpenChange(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="absolute inset-0 z-40 flex items-center justify-center bg-polis-ink/40 p-4"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="paper-texture flex max-h-full w-full max-w-sm flex-col overflow-hidden border border-polis-ink/30 bg-polis-paper shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-polis-rule/20 px-4 py-2.5">
          <h2 className="font-serif text-sm font-bold uppercase tracking-[0.14em] text-polis-ink">{title}</h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Fechar"
            className="text-lg leading-none text-polis-ink-soft hover:text-polis-gold-ink"
          >
            ×
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">{children}</div>
      </div>
    </div>
  );
}

export function GameSettingsButton({
  onClick,
  compact = false,
}: {
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Configurações e guia do jogo"
      title="Configurações e guia"
      className={cn(
        "flex shrink-0 items-center justify-center border border-polis-ink/30 text-polis-ink transition-colors hover:border-polis-gold-muted hover:text-polis-gold-ink",
        compact ? "h-7 w-7" : "h-8 w-8"
      )}
    >
      <SettingsGearIcon className={compact ? "h-4 w-4" : "h-[18px] w-[18px]"} />
    </button>
  );
}
