import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";

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

      <form className="mt-8 space-y-5">
        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-polis-navy">
            Nome
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="mt-1 w-full rounded-sm border border-polis-navy/20 px-4 py-2.5 focus:border-polis-gold focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-polis-navy">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-sm border border-polis-navy/20 px-4 py-2.5 focus:border-polis-gold focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="message" className="block text-sm font-semibold text-polis-navy">
            Mensagem
          </label>
          <textarea
            id="message"
            name="message"
            rows={5}
            required
            className="mt-1 w-full rounded-sm border border-polis-navy/20 px-4 py-2.5 focus:border-polis-gold focus:outline-none"
          />
        </div>
        <Button type="submit">Enviar mensagem</Button>
      </form>
    </div>
  );
}
