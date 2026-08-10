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
 */
export function AdMargin({ banners, slotCount = SLOT_COUNT, isDesktop = false }: AdMarginProps) {
  const slots = Array.from({ length: slotCount }, (_, index) => banners[index] ?? null);

  // Desktop: 2x2 grid. Mobile: 1x2 grid. Use inline style for row distribution.
  const isDesktopLayout = isDesktop && slotCount !== MOBILE_SLOT_COUNT;
  const gridColsClass = isDesktopLayout ? "grid-cols-2" : "grid-cols-1";
  const rowCount = isDesktopLayout ? 2 : slotCount === MOBILE_SLOT_COUNT ? 2 : 4;

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-3">
      <span className="shrink-0 text-center font-serif text-[10px] uppercase tracking-[0.3em] text-polis-ink-soft">
        Espaço Publicitário
      </span>
      <div
        className={`grid min-h-0 flex-1 ${gridColsClass} gap-3`}
        style={{
          gridTemplateRows: `repeat(${rowCount}, 1fr)`,
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
      className="relative flex h-full w-full overflow-hidden border-[5px] border-double border-polis-ink/70 bg-polis-paper"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={banner.imageUrl} alt={banner.title} className="h-full w-full object-contain lg:object-cover" />
    </a>
  );
}

function AdPlaceholder() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden border-[5px] border-double border-polis-ink/40 bg-polis-paper">
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
