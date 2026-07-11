import type { Metadata } from "next";
import { NewsletterForm } from "@/components/forms/NewsletterForm";

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

      <NewsletterForm />

      <p className="mt-4 text-xs text-polis-gray">
        Seus dados são usados apenas para o envio da newsletter. Você pode cancelar a inscrição
        quando quiser, escrevendo para a nossa redação.
      </p>
    </div>
  );
}
