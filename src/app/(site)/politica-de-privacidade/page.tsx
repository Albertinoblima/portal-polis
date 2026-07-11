import type { Metadata } from "next";
import { Newspaper, type NewspaperBlock } from "@/components/newspaper/Newspaper";

export const metadata: Metadata = {
  title: "Política de Privacidade",
};

const CONTENT_HTML = `
  <h1>Política de Privacidade</h1>
  <p>O Pólis coleta o mínimo de dados pessoais necessário para operar o portal e a
  newsletter, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).</p>
  <p>Esta página será detalhada com o texto completo da política de privacidade antes do
  lançamento público do portal.</p>
`;

export default function PoliticaDePrivacidadePage() {
  const blocks: NewspaperBlock[] = [{ type: "html", html: CONTENT_HTML, columns: 1 }];

  return <Newspaper sectionLabel="Política de Privacidade" showMasthead blocks={blocks} />;
}
