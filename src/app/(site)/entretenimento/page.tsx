import Link from "next/link";
import type { Metadata } from "next";
import { Newspaper, type NewspaperBlock } from "@/components/newspaper/Newspaper";

export const metadata: Metadata = {
  title: "Entretenimento",
  description:
    "A seção de entretenimento do Portal Pólis — jogos, palavras cruzadas e caça-palavras entre uma matéria e outra.",
};

const SECTIONS = [
  {
    href: "/entretenimento/jogos",
    title: "Jogos",
    description: "Desafie o computador ou chame alguém para jogar ao seu lado.",
  },
  {
    href: "/entretenimento/palavras-cruzadas",
    title: "Palavras Cruzadas",
    description: "Uma edição nova todo dia, com correção automática.",
  },
  {
    href: "/entretenimento/caca-palavras",
    title: "Caça-Palavras",
    description: "Uma edição nova todo dia, com progresso salvo automaticamente.",
  },
];

export default function EntretenimentoPage() {
  const blocks: NewspaperBlock[] = [
    {
      type: "node",
      columns: 1,
      node: (
        <div className="mx-auto flex h-full max-w-xl flex-col justify-center text-center">
          <h1 className="font-serif text-4xl font-bold text-polis-ink">Entretenimento</h1>
          <p className="mt-3 text-polis-ink-soft">
            Todo jornal impresso reserva um cantinho para o entretenimento entre uma notícia e
            outra. No Portal Pólis não é diferente — aqui você encontra os passatempos da nossa
            seção de entretenimento.
          </p>

          <div className="mx-auto mt-10 grid w-full gap-6 sm:grid-cols-3">
            {SECTIONS.map((section) => (
              <Link
                key={section.href}
                href={section.href}
                className="group flex flex-col items-center gap-2 border border-polis-ink/30 px-6 py-8 transition-colors hover:border-polis-gold-muted"
              >
                <span className="font-serif text-2xl font-bold text-polis-ink group-hover:text-polis-gold-ink">
                  {section.title}
                </span>
                <span className="text-sm text-polis-ink-soft">{section.description}</span>
              </Link>
            ))}
          </div>
        </div>
      ),
    },
  ];

  return <Newspaper sectionLabel="Entretenimento" showMasthead blocks={blocks} />;
}
