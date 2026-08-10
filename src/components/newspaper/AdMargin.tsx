import type { Banner } from "@/types";

interface AdMarginProps {
  banners: Banner[];
  slotCount?: number;
  isDesktop?: boolean;
}

const SLOT_COUNT = 4;
const MOBILE_SLOT_COUNT = 2;
const PLACEHOLDER_TILE_COUNT = 6;

/**
 * Folha de classificados pareada com a capa na primeira dobra dupla do
 * desktop (ver Newspaper.tsx — é inserida como página real antes do timbre,
 * não como overlay solto, para virar como papel comum junto do resto do
 * livro). Até 4 anúncios configuráveis pelo painel (banners com
 * position="sidebar"), em grade 2×2; slots sem anúncio mostram um convite
 * "Anuncie Aqui!".
 *
 * IMPORTANTE: Este componente é passado como `children` direto ao PageChrome,
 * que aplica `height: contentHeightPx` explícita ao container. Portanto, toda
 * a altura disponível já está definida no nível do PageChrome. O AdMargin não
 * precisa fazer flex tricks — apenas ocupar 100% e distribuir via grid.
 */
export function AdMargin({ banners, slotCount = SLOT_COUNT, isDesktop = false }: AdMarginProps) {
  const slots = Array.from({ length: slotCount }, (_, index) => banners[index] ?? null);

  // Determine grid layout based on actual desktop detection
  const isDesktopLayout = isDesktop && slotCount !== MOBILE_SLOT_COUNT;
  const cols = isDesktopLayout ? 2 : 1;
  const rows = isDesktopLayout ? 2 : 2; // Mobile: 2 ads per page, desktop: 2x2

  return (
    <div className="flex h-full w-full flex-col bg-polis-paper">
      {/* Título */}
      <div className="shrink-0 py-3 text-center font-serif text-[10px] uppercase tracking-[0.3em] text-polis-ink-soft">
        Espaço Publicitário
      </div>

      {/* Grid: ocupa 100% da altura restante após o título.
          min-h-0 é OBRIGATÓRIO aqui: como item flex (flex-1) dentro do
          wrapper flex-col, o grid por padrão tem min-height:auto, ou seja,
          se recusa a encolher abaixo do tamanho intrínseco do conteúdo das
          imagens dos slots. Sem min-h-0, o grid cresce além do espaço
          alocado e o container pai (com overflow-hidden) corta a segunda
          linha de anúncios — sintoma visto: linha 1 ok, linha 2 cortada. */}
      <div
        className="w-full min-h-0 flex-1"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          gap: "0.75rem",
        }}
      >
        {slots.map((banner, index) =>
          banner ? <AdSlot key={banner.id} banner={banner} /> : <AdPlaceholder key={index} />
        )}
      </div>
    </div>
  );
}

function AdSlot({ banner }: { banner: Banner }) {
  return (
    <a
      href={banner.linkUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="relative flex h-full min-h-0 w-full overflow-hidden border-[5px] border-double border-polis-ink/70 bg-polis-paper"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={banner.imageUrl} alt={banner.title} className="h-full min-h-0 w-full object-contain lg:object-cover" />
    </a>
  );
}

function AdPlaceholder() {
  return (
    <div className="relative flex h-full min-h-0 w-full items-center justify-center overflow-hidden border-[5px] border-double border-polis-ink/40 bg-polis-paper">
      <div className="pointer-events-none absolute inset-0 flex flex-wrap content-center items-center justify-center gap-x-3 gap-y-2 opacity-[0.16]">
        {Array.from({ length: PLACEHOLDER_TILE_COUNT }).map((_, i) => (
          <span
            key={i}
            className="rotate-[-8deg] whitespace-nowrap font-serif text-xs font-bold uppercase tracking-widest text-polis-ink"
          >
            Anuncie Aqui!
          </span>
        ))}
      </div>
      <span className="relative font-serif text-sm italic tracking-wide text-polis-ink-soft">Anuncie Aqui!</span>
    </div>
  );
}
