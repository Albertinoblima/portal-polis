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
`;

export default function SobrePage() {
  const blocks: NewspaperBlock[] = [{ type: "html", html: CONTENT_HTML, columns: 1 }];

  return <Newspaper sectionLabel="Sobre" showMasthead blocks={blocks} />;
}
