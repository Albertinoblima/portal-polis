import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Newspaper, type NewspaperBlock } from "@/components/newspaper/Newspaper";

export const metadata: Metadata = {
  title: "Sobre",
  description: "Conheça o Portal Pólis, onde a política faz sentido.",
};

const CONTENT_HTML = `
  <h1>Sobre o Portal Pólis</h1>
  <p><strong>Pólis</strong> (πόλις) é a palavra grega para cidade-estado — o centro da vida
  cívica, política e democrática na Grécia Antiga. É de lá que nasce o nome do nosso portal.</p>
  <p>Somos uma plataforma de jornalismo político que acredita que a política deixa de ser
  ruído e passa a fazer sentido quando é contextualizada, aprofundada e apresentada com
  rigor jornalístico — sem sensacionalismo e sem polarização gratuita.</p>
  <p>Cobrimos política nacional, municípios, eleições e os bastidores do poder, sempre com
  pluralidade de vozes e compromisso com a precisão factual.</p>
  <p>Saiba também como tratamos seus dados: <a href="/politica-de-privacidade">Política de
  Privacidade</a>, <a href="/politica-de-cookies">Política de Cookies</a>,
  <a href="/lgpd">LGPD</a> e <a href="/termos-de-uso">Termos de Uso</a>.</p>
`;

interface TeamMember {
  name: string;
  role: string;
  photo: string;
}

const TEAM: TeamMember[] = [
  { name: "Albertino Bezerra", role: "Redator e colunista", photo: "/colunistas/albertino-bezerra.png" },
  { name: "Jurandir Júnior", role: "Redator e colunista", photo: "/colunistas/jurandir-junior.png" },
];

export default function SobrePage() {
  const blocks: NewspaperBlock[] = [
    { type: "html", html: CONTENT_HTML, columns: 1 },
    {
      type: "node",
      columns: 1,
      node: (
        <div className="flex h-full flex-col justify-center">
          <h2 className="mb-1 font-serif text-3xl font-bold text-polis-ink">Nossa Equipe Editorial</h2>
          <p className="mb-8 text-polis-ink-soft">Quem escreve o Portal Pólis.</p>
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2">
            {TEAM.map((member) => (
              <Link
                key={member.name}
                href="/colunistas"
                className="group flex flex-col items-center text-center"
              >
                <div className="relative h-48 w-48 overflow-hidden shadow-md transition-transform group-hover:scale-[1.02] sm:h-56 sm:w-56">
                  <Image src={member.photo} alt={member.name} fill className="object-cover" />
                </div>
                <h3 className="mt-4 font-serif text-xl font-bold text-polis-ink">{member.name}</h3>
                <p className="text-sm text-polis-ink-soft">{member.role} do Portal Pólis</p>
              </Link>
            ))}
          </div>
        </div>
      ),
    },
  ];

  return <Newspaper sectionLabel="Sobre" showMasthead blocks={blocks} />;
}
