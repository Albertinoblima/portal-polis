import type { Metadata } from "next";
import { Newspaper, type NewspaperBlock } from "@/components/newspaper/Newspaper";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Como o Portal Pólis coleta, usa e protege dados pessoais dos leitores.",
};

const CONTENT_HTML = `
  <h1>Política de Privacidade</h1>
  <p><em>Última atualização: 11 de julho de 2026.</em></p>
  <p>Esta política explica, em linguagem direta, quais dados pessoais o Portal Pólis coleta,
  por que coleta, com quem compartilha e como você pode exercer seus direitos como titular,
  em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).</p>

  <h2>1. Quem é o responsável pelos seus dados</h2>
  <p>O Portal Pólis é o responsável (controlador, nos termos da LGPD) pelo tratamento dos
  dados pessoais coletados através deste site. Dúvidas, solicitações ou reclamações sobre
  privacidade podem ser enviadas a qualquer momento pela nossa <a href="/contato">página de
  Contato</a>.</p>

  <h2>2. Quais dados coletamos e por quê</h2>
  <ul>
    <li><strong>Formulário de contato:</strong> ao clicar em "Enviar", você é direcionado para
    uma conversa no WhatsApp com a redação — nome, telefone e o conteúdo da mensagem ficam
    apenas no WhatsApp (seu e da redação); nosso site não armazena nada desse formulário em
    nenhum servidor.</li>
    <li><strong>Preferência de tema (claro/escuro):</strong> fica salva apenas no seu
    próprio navegador (armazenamento local) e nunca chega aos nossos servidores. Não é um
    dado pessoal.</li>
    <li><strong>Acesso ao painel administrativo:</strong> exclusivo para colaboradores da
    redação com permissão de escrita no repositório do código-fonte — login feito via GitHub,
    sem cadastro de e-mail/senha próprio do portal.</li>
  </ul>
  <p>Não coletamos dados sensíveis (art. 5º, II, da LGPD) e não fazemos rastreamento
  comportamental para fins publicitários.</p>

  <h2>3. Google Analytics</h2>
  <p>Quando ativado pela redação, usamos o Google Analytics para entender, de forma
  agregada e anônima, como os leitores navegam pelo portal — páginas mais lidas, tempo de
  leitura, origem do acesso. Esse serviço pode definir cookies próprios do Google. Veja
  detalhes na nossa <a href="/politica-de-cookies">Política de Cookies</a>.</p>

  <h2>4. Base legal para o tratamento</h2>
  <ul>
    <li><strong>Formulário de contato:</strong> nosso legítimo interesse editorial em manter
    um canal de interação com os leitores (art. 7º, IX), sempre respeitando finalidade,
    necessidade e os seus direitos. Como a mensagem é enviada via WhatsApp, o tratamento dos
    dados nessa conversa segue a política de privacidade do próprio WhatsApp.</li>
    <li><strong>Dados de colaboradores da redação:</strong> execução da relação de
    colaboração e cumprimento de obrigações de responsabilidade editorial (art. 7º, II e V).</li>
  </ul>

  <h2>5. Com quem compartilhamos seus dados</h2>
  <p>O site público é 100% estático e hospedado no GitHub Pages; não há banco de dados nem
  servidor próprio armazenando dados de leitores. O formulário de contato é um link direto
  para o WhatsApp — a conversa fica entre você, a redação e a Meta (operadora do WhatsApp).
  Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins de
  marketing.</p>

  <h2>6. Por quanto tempo guardamos seus dados</h2>
  <p>Não guardamos dados pessoais de leitores em nossos servidores. Mensagens enviadas pelo
  formulário de contato ficam apenas no histórico do WhatsApp, sujeitas à política de retenção
  daquele serviço.</p>

  <h2>7. Seus direitos como titular</h2>
  <p>A qualquer momento você pode solicitar confirmação de tratamento, acesso, correção,
  anonimização, eliminação ou portabilidade dos seus dados, além de revogar consentimentos
  já concedidos. Basta entrar em contato pela nossa <a href="/contato">página de Contato</a>
  — respondemos em até 15 dias.</p>

  <h2>8. Segurança</h2>
  <p>Adotamos medidas técnicas e organizacionais razoáveis — como controle de acesso ao painel
  administrativo restrito a colaboradores do repositório do código-fonte — para proteger
  nossos sistemas contra acessos não autorizados.</p>

  <h2>9. Alterações desta política</h2>
  <p>Esta política pode ser atualizada para refletir mudanças no portal ou na legislação. A
  data da última atualização está sempre indicada no topo desta página. Para saber mais
  sobre cookies e armazenamento local, veja a <a href="/politica-de-cookies">Política de
  Cookies</a>; para o resumo dos seus direitos como titular, veja a página <a href="/lgpd">LGPD</a>.</p>
`;

export default function PoliticaDePrivacidadePage() {
  const blocks: NewspaperBlock[] = [{ type: "html", html: CONTENT_HTML, columns: 1 }];

  return <Newspaper sectionLabel="Política de Privacidade" showMasthead blocks={blocks} />;
}
