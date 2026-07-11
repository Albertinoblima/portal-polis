import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LGPD",
};

export default function LgpdPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 md:px-6">
      <h1 className="font-sans text-4xl font-bold text-polis-navy">LGPD</h1>
      <div className="prose prose-lg mt-8 max-w-none text-polis-navy/90">
        <p>
          O Pólis trata dados pessoais com base nos princípios de minimização, finalidade e
          transparência previstos na Lei Geral de Proteção de Dados (LGPD).
        </p>
        <p>
          Para exercer seus direitos como titular de dados (acesso, correção, exclusão ou
          portabilidade), entre em contato pelo canal disponível na página de{" "}
          <a href="/contato">Contato</a>.
        </p>
      </div>
    </div>
  );
}
