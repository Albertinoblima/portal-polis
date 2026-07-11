import type { Metadata } from "next";
import { ContactForm } from "@/components/forms/ContactForm";

export const metadata: Metadata = {
  title: "Contato",
  description: "Fale com a redação do Pólis.",
};

export default function ContatoPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 md:px-6">
      <h1 className="font-sans text-4xl font-bold text-polis-navy">Contato</h1>
      <p className="mt-2 text-polis-slate">
        Envie sugestões de pauta, correções ou dúvidas para a redação.
      </p>

      <ContactForm />
    </div>
  );
}
