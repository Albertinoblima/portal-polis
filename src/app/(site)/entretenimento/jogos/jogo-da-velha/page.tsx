import type { Metadata } from "next";
import Link from "next/link";
import { PageChrome } from "@/components/newspaper/PageChrome";
import { TicTacToe } from "@/components/games/TicTacToe";

export const metadata: Metadata = {
  title: "Jogo da Velha",
  description:
    "Jogue Jogo da Velha contra o computador ou com outra pessoa na seção de entretenimento do Portal Pólis.",
};

export default function JogoDaVelhaPage() {
  return (
    <PageChrome
      pageNumber={1}
      totalPages={1}
      sectionLabel="Jogo da Velha"
      columns={1}
      runningTitle={
        <Link href="/entretenimento/jogos" className="hover:text-polis-gold-ink">
          ‹ Jogos
        </Link>
      }
    >
      <TicTacToe />
    </PageChrome>
  );
}
