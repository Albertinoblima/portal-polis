import type { Banner } from "@/types";

interface AdMarginProps {
  banners: Banner[];
  width: number;
  height: number;
}

const SLOT_COUNT = 4;
const PLACEHOLDER_TILE_COUNT = 6;

/**
 * Espaço publicitário exibido ao lado da capa (a folha de rosto do
 * page-flip ocupa só metade da largura disponível quando é a "capa" do
 * livro — a outra metade fica em branco). Reaproveita essa sobra como
 * classificados: até 4 anúncios configuráveis pelo painel (banners com
 * position="sidebar"); slots sem anúncio mostram um convite "Anuncie Aqui!".
 */
export function AdMargin({ banners, width, height }: AdMarginProps) {
  const slots = Array.from({ length: SLOT_COUNT }, (_, index) => banners[index] ?? null);

  return (
    <div
      className="paper-texture absolute left-0 top-0 flex flex-col gap-3 bg-polis-paper-soft p-3"
      style={{ width, height }}
    >
      <span className="shrink-0 text-center font-serif text-[10px] uppercase tracking-[0.3em] text-polis-ink-soft/70">
        Espaço Publicitário
      </span>
      {slots.map((banner, index) =>
        banner ? <AdSlot key={banner.id} banner={banner} /> : <AdPlaceholder key={index} />
      )}
    </div>
  );
}

function AdSlot({ banner }: { banner: Banner }) {
  return (
    <a
      href={banner.linkUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="relative block flex-1 overflow-hidden border-[5px] border-double border-polis-ink/70 bg-polis-paper"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={banner.imageUrl} alt={banner.title} className="h-full w-full object-cover" />
    </a>
  );
}

function AdPlaceholder() {
  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden border-[5px] border-double border-polis-ink/40 bg-polis-paper">
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
