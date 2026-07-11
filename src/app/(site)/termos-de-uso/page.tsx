import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Uso",
};

export default function TermosDeUsoPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 md:px-6">
      <h1 className="font-sans text-4xl font-bold text-polis-navy">Termos de Uso</h1>
      <div className="prose prose-lg mt-8 max-w-none text-polis-navy/90">
        <p>
          Ao acessar o Pólis, o usuário concorda com os termos de uso do portal, incluindo as
          regras de moderação de comentários e uso do conteúdo publicado.
        </p>
        <p>
          Esta página será detalhada com o texto completo dos termos de uso antes do lançamento
          público do portal.
        </p>
      </div>
    </div>
  );
}
