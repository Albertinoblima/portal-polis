import { cn } from "@/lib/utils";

interface GameOverlayProps {
  title: string;
  subtitle?: string;
  actionLabel: string;
  onAction: () => void;
  /** Liga o tratamento dourado de "novo recorde" — o momento de destaque do jogo. */
  isNewHighScore?: boolean;
}

/** Tela de estado (pronto/pausado/fim de jogo) compartilhada pelos jogos de
 *  tabuleiro em tempo real (Cobrinha, Blocos), no visual do jornal. */
export function GameOverlay({ title, subtitle, actionLabel, onAction, isNewHighScore }: GameOverlayProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-polis-paper/95 px-4 text-center">
      <div
        className={cn(
          "flex flex-col items-center gap-2 border px-6 py-5",
          isNewHighScore ? "border-polis-gold" : "border-polis-rule/20"
        )}
      >
        {isNewHighScore && (
          <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-polis-gold-ink">
            Novo recorde!
          </span>
        )}
        <p className="font-serif text-xl font-bold text-polis-ink">{title}</p>
        {subtitle && <p className="text-xs text-polis-ink-soft">{subtitle}</p>}
        <button
          type="button"
          onClick={onAction}
          className="mt-1 border border-polis-ink/30 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-polis-ink transition-colors hover:border-polis-gold-muted hover:text-polis-gold-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-polis-gold-muted"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
