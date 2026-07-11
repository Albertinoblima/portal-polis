import type { Metadata } from "next";
import { Newspaper, type NewspaperBlock } from "@/components/newspaper/Newspaper";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "Regras de uso do Portal Pólis: comentários, propriedade intelectual e responsabilidades.",
};

const CONTENT_HTML = `
  <h1>Termos de Uso</h1>
  <p><em>Última atualização: 11 de julho de 2026.</em></p>
  <p>Ao acessar e usar o Portal Pólis, você concorda com estes termos. Se não concordar com
  algum ponto, pedimos que não utilize o portal.</p>

  <h2>1. O que é o Portal Pólis</h2>
  <p>O Portal Pólis é um portal de jornalismo político independente. A leitura das matérias
  não exige cadastro; apenas alguns recursos — como comentar ou assinar a newsletter — pedem
  um nome e/ou e-mail, conforme detalhado na nossa <a href="/politica-de-privacidade">
  Política de Privacidade</a>.</p>

  <h2>2. Comentários e conduta do usuário</h2>
  <p>Ao comentar em uma matéria, você concorda em:</p>
  <ul>
    <li>Não publicar conteúdo ofensivo, discurso de ódio, assédio, ameaças ou discriminação
    de qualquer natureza;</li>
    <li>Não publicar spam, propaganda não solicitada ou conteúdo ilegal;</li>
    <li>Não se passar por outra pessoa nem divulgar dados pessoais de terceiros sem
    consentimento;</li>
    <li>Manter o debate civil, mesmo em discordância com o conteúdo publicado.</li>
  </ul>
  <p>Todo comentário passa por moderação da redação antes de ficar visível publicamente.
  Reservamo-nos o direito de não publicar ou de remover comentários que violem estas
  regras, sem aviso prévio.</p>

  <h2>3. Propriedade intelectual</h2>
  <p>Os textos, fotografias, ilustrações, marca e logotipo do Portal Pólis são protegidos
  por direitos autorais. Você pode compartilhar links e trechos curtos das nossas matérias
  para uso pessoal e não comercial, sempre citando a fonte e o link original. A reprodução
  integral de matérias, uso comercial do conteúdo ou da marca "Portal Pólis" exige
  autorização prévia — entre em contato pela nossa <a href="/contato">página de Contato</a>.</p>

  <h2>4. Links para sites de terceiros</h2>
  <p>Nossas matérias podem conter links para sites de terceiros (fontes, referências,
  redes sociais). Não somos responsáveis pelo conteúdo, pelas políticas de privacidade ou
  pelas práticas desses sites externos.</p>

  <h2>5. Rigor jornalístico e correções</h2>
  <p>Buscamos precisão factual em tudo o que publicamos. Ainda assim, erros podem ocorrer.
  Se você identificar uma informação incorreta em uma matéria, avise-nos pela
  <a href="/contato"> página de Contato</a> — correções são analisadas pela redação e, quando
  procedentes, publicadas de forma transparente.</p>

  <h2>6. Limitação de responsabilidade</h2>
  <p>O conteúdo do Portal Pólis tem finalidade informativa e não constitui aconselhamento
  jurídico, financeiro ou de qualquer outra natureza profissional. Não nos responsabilizamos
  por decisões tomadas com base exclusivamente no conteúdo aqui publicado.</p>

  <h2>7. Alterações destes termos</h2>
  <p>Podemos atualizar estes termos para refletir mudanças no portal ou na legislação. A
  data da última atualização estará sempre indicada no topo desta página.</p>

  <h2>8. Legislação aplicável</h2>
  <p>Estes termos são regidos pela legislação brasileira. Para tratamento de dados
  pessoais, consulte também a <a href="/politica-de-privacidade">Política de Privacidade</a>,
  a <a href="/politica-de-cookies">Política de Cookies</a> e a página <a href="/lgpd">LGPD</a>.</p>
`;

export default function TermosDeUsoPage() {
  const blocks: NewspaperBlock[] = [{ type: "html", html: CONTENT_HTML, columns: 1 }];

  return <Newspaper sectionLabel="Termos de Uso" showMasthead blocks={blocks} />;
}
