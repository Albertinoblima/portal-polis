import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade",
};

export default function PoliticaDePrivacidadePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 md:px-6">
      <h1 className="font-sans text-4xl font-bold text-polis-navy">Política de Privacidade</h1>
      <div className="prose prose-lg mt-8 max-w-none text-polis-navy/90">
        <p>
          O Pólis coleta o mínimo de dados pessoais necessário para operar o portal e a
          newsletter, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
        </p>
        <p>
          Esta página será detalhada com o texto completo da política de privacidade antes do
          lançamento público do portal.
        </p>
      </div>
    </div>
  );
}
