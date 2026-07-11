import type { Metadata } from "next";
import { ContactForm } from "@/components/forms/ContactForm";
import { Newspaper, type NewspaperBlock } from "@/components/newspaper/Newspaper";

export const metadata: Metadata = {
  title: "Contato",
  description: "Fale com a redação do Portal Pólis.",
};

export default function ContatoPage() {
  const blocks: NewspaperBlock[] = [
    {
      type: "node",
      columns: 1,
      node: (
        <div className="mx-auto flex h-full max-w-md flex-col justify-center">
          <h1 className="font-serif text-4xl font-bold text-polis-ink">Contato</h1>
          <p className="mt-2 text-polis-ink-soft">
            Envie sugestões de pauta, correções ou dúvidas para a redação.
          </p>
          <ContactForm />
        </div>
      ),
    },
  ];

  return <Newspaper sectionLabel="Contato" showMasthead blocks={blocks} />;
}
