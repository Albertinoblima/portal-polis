import { forwardRef, type ReactNode } from "react";

interface PageChromeProps {
  children: ReactNode;
  /** Conteúdo de largura cheia acima da área de colunas (ex: Masthead na capa). */
  header?: ReactNode;
  pageNumber: number;
  totalPages: number;
  sectionLabel: string;
  columns?: 1 | 2 | 3;
  /** Normalmente um rótulo curto, mas aceita qualquer nó — ex.: um link "‹ Voltar" de verdade. */
  runningTitle?: ReactNode;
  /**
   * Altura em px da área de colunas, calculada em Newspaper.tsx a partir do
   * espaço realmente disponível (altura da página menos cabeçalho/rodapé
   * daquela página específica). Necessário porque essa área usa `columns`
   * (multi-coluna do CSS), que não é um contexto flex/grid — filhos com
   * `height: 100%` dentro dela não enxergam um `flex-1` do ancestral como
   * altura definida e acabam se dimensionando pelo próprio conteúdo,
   * estourando a página (visto em blocos com imagem `fill`, por exemplo).
   * Um valor em px explícito resolve isso para qualquer filho.
   *
   * Omitido (usado fora do livro de folhear, ex.: páginas de jogos que não
   * têm um orçamento de pixels fixo por página) — a área de conteúdo vira
   * `flex-1` com rolagem própria, sem `columns` (que não faz sentido sem um
   * orçamento de altura fixo para equilibrar as colunas).
   */
  contentHeightPx?: number;
}

export const PageChrome = forwardRef<HTMLDivElement, PageChromeProps>(function PageChrome(
  { children, header, pageNumber, totalPages, sectionLabel, columns = 2, runningTitle, contentHeightPx },
  ref
) {
  return (
    <div
      ref={ref}
      className="paper-texture relative flex h-full w-full flex-col bg-polis-paper text-polis-ink"
    >
      {header}

      {runningTitle && (
        <div className="flex shrink-0 items-center justify-between border-b border-polis-rule/20 px-6 py-2 font-serif text-xs uppercase tracking-[0.2em] text-polis-ink">
          <span>{runningTitle}</span>
          <span>{sectionLabel}</span>
        </div>
      )}

      {contentHeightPx !== undefined ? (
        <div
          className="overflow-hidden px-6 py-5"
          style={{
            height: contentHeightPx,
            columnCount: columns,
            columnGap: "2.25rem",
            columnRule: "1px solid color-mix(in srgb, var(--color-rule) 25%, transparent)",
          }}
        >
          {children}
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
      )}

      <div className="flex h-10 shrink-0 items-center justify-between border-t border-polis-rule/20 px-6 text-[11px] tracking-wide text-polis-ink">
        <span>{sectionLabel}</span>
        <span>
          Página {pageNumber} de {totalPages}
        </span>
        <span>Portal Pólis</span>
      </div>
    </div>
  );
});
