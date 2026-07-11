import type { Metadata } from "next";
import { Newspaper, type NewspaperBlock } from "@/components/newspaper/Newspaper";

export const metadata: Metadata = {
  title: "Política de Cookies",
  description: "Quais cookies e tecnologias de armazenamento local o Portal Pólis utiliza.",
};

const CONTENT_HTML = `
  <h1>Política de Cookies</h1>
  <p><em>Última atualização: 11 de julho de 2026.</em></p>
  <p>Cookies são pequenos arquivos que um site pode guardar no seu navegador. O Portal
  Pólis foi construído para depender do mínimo possível deles: usamos, na maior parte do
  tempo, <strong>armazenamento local do navegador (localStorage)</strong>, que funciona de
  forma parecida, mas nunca sai do seu dispositivo nem é enviado aos nossos servidores.</p>

  <h2>1. O que é essencial para o funcionamento do site</h2>
  <ul>
    <li><strong>Preferência de tema (claro/escuro):</strong> guardada em
    <code>localStorage</code> sob a chave <code>polis-theme</code>. Serve só para lembrar sua
    escolha de tema na próxima visita e não identifica você.</li>
    <li><strong>Sessão do painel administrativo:</strong> usada apenas por colaboradores da
    redação autenticados, para manter o login ativo enquanto usam o painel. Leitores comuns
    do portal nunca recebem esse armazenamento.</li>
  </ul>
  <p>Nenhum desses itens pode ser desativado individualmente porque não são opcionais — sem
  eles, o tema escolhido não seria lembrado e o painel administrativo não funcionaria — mas
  também não geram qualquer forma de rastreamento entre sites.</p>

  <h2>2. Cookies de terceiros (quando ativados)</h2>
  <p>Quando a redação ativa o Google Analytics, esse serviço pode definir cookies próprios
  (como <code>_ga</code> e <code>_gid</code>) para medir audiência de forma agregada —
  quantas pessoas visitam o portal, quais páginas são mais lidas, de onde vêm os acessos.
  Não usamos esses dados para identificar leitores individualmente nem para publicidade.
  Consulte a <a href="https://policies.google.com/technologies/cookies" target="_blank"
  rel="noopener noreferrer">política de cookies do Google</a> para mais detalhes.</p>

  <h2>3. Como gerenciar ou desativar</h2>
  <p>Você pode limpar o armazenamento local ou bloquear cookies a qualquer momento nas
  configurações do seu navegador. Isso não impede a leitura do portal — na pior das
  hipóteses, sua preferência de tema volta ao padrão (claro) a cada nova visita.</p>

  <h2>4. Mais informações</h2>
  <p>Para entender como tratamos dados pessoais de forma mais ampla — comentários,
  newsletter e formulário de contato — consulte nossa <a href="/politica-de-privacidade">
  Política de Privacidade</a> e a página <a href="/lgpd">LGPD</a>.</p>
`;

export default function PoliticaDeCookiesPage() {
  const blocks: NewspaperBlock[] = [{ type: "html", html: CONTENT_HTML, columns: 1 }];

  return <Newspaper sectionLabel="Política de Cookies" showMasthead blocks={blocks} />;
}
