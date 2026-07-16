import type { Metadata } from "next";
import Link from "next/link";
import { PageChrome } from "@/components/newspaper/PageChrome";
import { Blocks } from "@/components/games/Blocks";

export const metadata: Metadata = {
  title: "Jogo dos Blocos",
  description:
    "O clássico joguinho de peças que caem e se encaixam, no espírito dos minigames dos primeiros celulares, na seção de entretenimento do Portal Pólis.",
};

export default function BlocosPage() {
  return (
    <PageChrome
      pageNumber={1}
      totalPages={1}
      sectionLabel="Jogo dos Blocos"
      columns={1}
      runningTitle={
        <Link href="/entretenimento/jogos" className="hover:text-polis-gold-ink">
          ‹ Jogos
        </Link>
      }
    >
      <Blocks />
    </PageChrome>
  );
}
