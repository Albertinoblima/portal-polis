import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jogos",
  description: "Os joguinhos da seção de entretenimento do Portal Pólis.",
};

const GAMES = [
  {
    href: "/entretenimento/jogos/jogo-da-velha",
    title: "Jogo da Velha",
    description: "Desafie o computador ou chame alguém para jogar ao seu lado.",
  },
];

export default function JogosPage() {
  return (
    <div className="paper-texture flex h-full w-full flex-col overflow-y-auto bg-polis-paper text-polis-ink">
      <div className="flex shrink-0 items-center justify-between border-b border-polis-rule/20 px-6 py-2 font-serif text-xs uppercase tracking-[0.2em]">
        <Link href="/entretenimento" className="hover:text-polis-gold-ink">
          ‹ Entretenimento
        </Link>
        <span>Jogos</span>
      </div>

      <div className="flex-1 px-6 py-8">
        <div className="mx-auto flex max-w-xl flex-col items-center text-center">
          <h1 className="font-serif text-4xl font-bold text-polis-ink">Jogos</h1>
          <p className="mt-3 text-polis-ink-soft">Escolha um joguinho para passar o tempo.</p>

          <div className="mt-10 grid w-full gap-6">
            {GAMES.map((game) => (
              <Link
                key={game.href}
                href={game.href}
                className="group flex flex-col items-center gap-2 border border-polis-ink/30 px-6 py-8 transition-colors hover:border-polis-gold-muted"
              >
                <span className="font-serif text-2xl font-bold text-polis-ink group-hover:text-polis-gold-ink">
                  {game.title}
                </span>
                <span className="text-sm text-polis-ink-soft">{game.description}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="flex h-10 shrink-0 items-center justify-between border-t border-polis-rule/20 px-6 text-[11px] tracking-wide">
        <span>Entretenimento</span>
        <span>Portal Pólis</span>
      </div>
    </div>
  );
}
