import type { Metadata } from "next";
import { Newspaper, type NewspaperBlock } from "@/components/newspaper/Newspaper";

export const metadata: Metadata = {
  title: "Termos de Uso",
};

const CONTENT_HTML = `
  <h1>Termos de Uso</h1>
  <p>Ao acessar o Portal Pólis, o usuário concorda com os termos de uso do portal, incluindo as
  regras de moderação de comentários e uso do conteúdo publicado.</p>
  <p>Esta página será detalhada com o texto completo dos termos de uso antes do lançamento
  público do portal.</p>
`;

export default function TermosDeUsoPage() {
  const blocks: NewspaperBlock[] = [{ type: "html", html: CONTENT_HTML, columns: 1 }];

  return <Newspaper sectionLabel="Termos de Uso" showMasthead blocks={blocks} />;
}
