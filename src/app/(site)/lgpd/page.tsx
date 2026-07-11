import type { Metadata } from "next";
import { Newspaper, type NewspaperBlock } from "@/components/newspaper/Newspaper";

export const metadata: Metadata = {
  title: "LGPD",
};

const CONTENT_HTML = `
  <h1>LGPD</h1>
  <p>O Pólis trata dados pessoais com base nos princípios de minimização, finalidade e
  transparência previstos na Lei Geral de Proteção de Dados (LGPD).</p>
  <p>Para exercer seus direitos como titular de dados (acesso, correção, exclusão ou
  portabilidade), entre em contato pelo canal disponível na página de
  <a href="/contato">Contato</a>.</p>
`;

export default function LgpdPage() {
  const blocks: NewspaperBlock[] = [{ type: "html", html: CONTENT_HTML, columns: 1 }];

  return <Newspaper sectionLabel="LGPD" showMasthead blocks={blocks} />;
}
