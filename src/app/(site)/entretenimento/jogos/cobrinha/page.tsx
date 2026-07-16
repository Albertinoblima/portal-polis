import type { Metadata } from "next";
import Link from "next/link";
import { PageChrome } from "@/components/newspaper/PageChrome";
import { Snake } from "@/components/games/Snake";

export const metadata: Metadata = {
  title: "Jogo da Cobrinha",
  description:
    "Jogue a clássica cobrinha dos celulares antigos direto no navegador, na seção de entretenimento do Portal Pólis.",
};

export default function CobrinhaPage() {
  return (
    <PageChrome
      pageNumber={1}
      totalPages={1}
      sectionLabel="Jogo da Cobrinha"
      columns={1}
      runningTitle={
        <Link href="/entretenimento/jogos" className="hover:text-polis-gold-ink">
          ‹ Jogos
        </Link>
      }
    >
      <Snake />
    </PageChrome>
  );
}
