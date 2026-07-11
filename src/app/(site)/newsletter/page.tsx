import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Newsletter",
  description: "Assine a newsletter do Pólis e receba as principais análises políticas.",
};

export default function NewsletterPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center md:px-6">
      <h1 className="font-sans text-4xl font-bold text-polis-navy">Newsletter Pólis</h1>
      <p className="mt-3 text-polis-slate">
        Receba, direto no seu e-mail, as principais análises políticas selecionadas pela nossa
        redação.
      </p>

      <form className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
        <input
          type="email"
          name="email"
          required
          placeholder="seu@email.com"
          className="w-full rounded-sm border border-polis-navy/20 px-4 py-3 focus:border-polis-gold focus:outline-none"
        />
        <Button type="submit" className="whitespace-nowrap">
          Inscrever-se
        </Button>
      </form>

      <p className="mt-4 text-xs text-polis-gray">
        Você receberá um e-mail de confirmação (double opt-in). Pode cancelar a inscrição a
        qualquer momento.
      </p>
    </div>
  );
}
