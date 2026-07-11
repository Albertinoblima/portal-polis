import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sobre",
  description: "Conheça o Pólis, onde a política faz sentido.",
};

export default function SobrePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 md:px-6">
      <h1 className="font-sans text-4xl font-bold text-polis-navy">Sobre o Pólis</h1>
      <div className="prose prose-lg mt-8 max-w-none text-polis-navy/90">
        <p>
          <strong>Pólis</strong> (πόλις) é a palavra grega para cidade-estado — o centro da vida
          cívica, política e democrática na Grécia Antiga. É de lá que nasce o nome do nosso portal.
        </p>
        <p>
          Somos uma plataforma de jornalismo político que acredita que a política deixa de ser
          ruído e passa a fazer sentido quando é contextualizada, aprofundada e apresentada com
          rigor jornalístico — sem sensacionalismo e sem polarização gratuita.
        </p>
        <p>
          Cobrimos política nacional, municípios, eleições e os bastidores do poder, sempre com
          pluralidade de vozes e compromisso com a precisão factual.
        </p>
      </div>
    </div>
  );
}
