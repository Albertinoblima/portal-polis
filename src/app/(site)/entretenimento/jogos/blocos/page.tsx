import type { Metadata } from "next";
import Link from "next/link";
import { Blocks } from "@/components/games/Blocks";

export const metadata: Metadata = {
  title: "Jogo dos Blocos",
  description:
    "O clássico joguinho de peças que caem e se encaixam, no espírito dos minigames dos primeiros celulares, na seção de entretenimento do Portal Pólis.",
};

export default function BlocosPage() {
  return (
    <div className="paper-texture flex h-full w-full flex-col overflow-y-auto bg-polis-paper text-polis-ink">
      <div className="flex shrink-0 items-center justify-between border-b border-polis-rule/20 px-6 py-2 font-serif text-xs uppercase tracking-[0.2em]">
        <Link href="/entretenimento/jogos" className="hover:text-polis-gold-ink">
          ‹ Jogos
        </Link>
        <span>Jogo dos Blocos</span>
      </div>

      <div className="flex-1 px-6 py-8">
        <Blocks />
      </div>

      <div className="flex h-10 shrink-0 items-center justify-between border-t border-polis-rule/20 px-6 text-[11px] tracking-wide">
        <span>Entretenimento</span>
        <span>Portal Pólis</span>
      </div>
    </div>
  );
}
