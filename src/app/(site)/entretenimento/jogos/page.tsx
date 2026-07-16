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
  },
  {
    href: "/entretenimento/jogos/cobrinha",
    title: "Jogo da Cobrinha",
    icon: SnakeIcon,
  },
  {
    href: "/entretenimento/jogos/blocos",
    title: "Jogo dos Blocos",
    icon: BlocksIcon,
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
        <p className="mt-3 text-polis-ink-soft">Escolha um joguinho para passar o tempo.</p>

        <div className="mt-10 grid w-full grid-cols-2 gap-6 sm:grid-cols-3">
          {GAMES.map((game) => (
            <Link
              key={game.href}
              href={game.href}
              className="group flex flex-col items-center gap-3 border border-polis-ink/30 px-4 py-6 transition-colors hover:border-polis-gold-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-polis-gold-muted"
            >
              <game.icon className="h-12 w-12 text-polis-ink group-hover:text-polis-gold-ink" />
              <span className="font-serif text-base font-bold text-polis-ink group-hover:text-polis-gold-ink">
                {game.title}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </PageChrome>
  );
}
