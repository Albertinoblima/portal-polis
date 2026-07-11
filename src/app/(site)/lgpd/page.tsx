import type { Metadata } from "next";
import { Newspaper, type NewspaperBlock } from "@/components/newspaper/Newspaper";

export const metadata: Metadata = {
  title: "LGPD",
  description: "Como o Portal Pólis aplica a Lei Geral de Proteção de Dados e como exercer seus direitos.",
};

const CONTENT_HTML = `
  <h1>LGPD</h1>
  <p><em>Última atualização: 11 de julho de 2026.</em></p>
  <p>O Portal Pólis trata dados pessoais com base nos princípios de finalidade, adequação,
  necessidade, transparência e minimização previstos na Lei Geral de Proteção de Dados
  (Lei nº 13.709/2018 — LGPD). Esta página resume, de forma objetiva, quais direitos você
  tem como titular de dados e como exercê-los.</p>

  <h2>1. Seus direitos como titular (art. 18 da LGPD)</h2>
  <ul>
    <li>Confirmação da existência de tratamento dos seus dados;</li>
    <li>Acesso aos dados que temos sobre você;</li>
    <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
    <li>Anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos;</li>
    <li>Portabilidade dos dados a outro fornecedor de serviço;</li>
    <li>Eliminação dos dados tratados com base no seu consentimento;</li>
    <li>Informação sobre com quem compartilhamos seus dados;</li>
    <li>Revogação do consentimento, a qualquer momento.</li>
  </ul>

  <h2>2. Como exercer seus direitos</h2>
  <p>Envie sua solicitação pela nossa <a href="/contato">página de Contato</a>, informando
  qual direito deseja exercer. Para viabilizar a resposta, podemos pedir informações
  adicionais que confirmem sua identidade. Respondemos em até 15 dias.</p>

  <h2>3. Boas práticas que já adotamos</h2>
  <ul>
    <li>Coletamos apenas o dado estritamente necessário para cada finalidade (comentário,
    newsletter ou contato) — nunca informações além disso.</li>
    <li>Comentários passam por moderação editorial antes de ficarem públicos.</li>
    <li>O acesso ao painel administrativo é restrito por papel (role-based) e todas as
    ações relevantes ficam registradas em log de auditoria.</li>
    <li>Não realizamos rastreamento comportamental para fins de publicidade nem
    compartilhamos dados com terceiros para fins comerciais.</li>
  </ul>

  <h2>4. Saiba mais</h2>
  <p>Para o detalhamento completo de quais dados coletamos, por quanto tempo e com que
  base legal, consulte nossa <a href="/politica-de-privacidade">Política de Privacidade</a>.
  Para entender cookies e armazenamento local, veja a <a href="/politica-de-cookies">
  Política de Cookies</a>.</p>
`;

export default function LgpdPage() {
  const blocks: NewspaperBlock[] = [{ type: "html", html: CONTENT_HTML, columns: 1 }];

  return <Newspaper sectionLabel="LGPD" showMasthead blocks={blocks} />;
}
