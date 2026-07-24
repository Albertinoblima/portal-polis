import Link from "next/link";
import type { Metadata } from "next";
import { PageChrome } from "@/components/newspaper/PageChrome";
import { Masthead } from "@/components/newspaper/Masthead";
import { BlocksIcon, SnakeIcon, TicTacToeIcon } from "@/components/games/GameIcons";

export const metadata: Metadata = {
  title: "Jogos",
  description: "Os joguinhos da seção de entretenimento do Portal Pólis.",
};

const GAMES = [
  {
    href: "/entretenimento/jogos/jogo-da-velha",
    title: "Jogo da Velha",
    icon: TicTacToeIcon,
    subtitle: "Estratégia clássica, ideal para partidas rápidas.",
    pacing: "2-5 min",
  },
  {
    href: "/entretenimento/jogos/cobrinha",
    title: "Jogo da Cobrinha",
    icon: SnakeIcon,
    subtitle: "Ritmo crescente e reflexos em destaque.",
    pacing: "3-8 min",
  },
  {
    href: "/entretenimento/jogos/blocos",
    title: "Jogo dos Blocos",
    icon: BlocksIcon,
    subtitle: "Montagem tática com dificuldade progressiva.",
    pacing: "5-12 min",
  },
];

export default function JogosPage() {
  return (
    <PageChrome
      pageNumber={1}
      totalPages={1}
      sectionLabel="Jogos"
      columns={1}
      header={<Masthead sectionLabel="Jogos" />}
      runningTitle={
        <Link href="/entretenimento" className="hover:text-polis-gold-ink">
          ‹ Entretenimento
        </Link>
      }
    >
      <div className="mx-auto flex max-w-xl flex-col items-center text-center">
        <h1 className="font-serif text-4xl font-bold text-polis-ink">Jogos</h1>
        <p className="mt-3 max-w-lg text-polis-ink-soft">
          Três minigames em estilo retrô, com controles modernos para web e mobile.
        </p>

        <div className="mt-10 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
          {GAMES.map((game) => (
            <Link
              key={game.href}
              href={game.href}
              className="group flex h-full flex-col items-center gap-3 border border-polis-ink/30 bg-polis-paper-soft/20 px-4 py-5 text-center transition-colors hover:border-polis-gold-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-polis-gold-muted"
            >
              <game.icon className="h-12 w-12 text-polis-ink group-hover:text-polis-gold-ink" />
              <span className="font-serif text-base font-bold text-polis-ink group-hover:text-polis-gold-ink">
                {game.title}
              </span>
              <p className="text-sm leading-relaxed text-polis-ink-soft">{game.subtitle}</p>
              <span className="mt-auto text-[11px] font-semibold uppercase tracking-[0.14em] text-polis-ink-soft">
                Duração média: {game.pacing}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </PageChrome>
  );
}
