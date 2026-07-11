import type { Metadata } from "next";
import { NewsletterForm } from "@/components/forms/NewsletterForm";
import { Newspaper, type NewspaperBlock } from "@/components/newspaper/Newspaper";

export const metadata: Metadata = {
  title: "Newsletter",
  description: "Assine a newsletter do Portal Pólis e receba as principais análises políticas.",
};

export default function NewsletterPage() {
  const blocks: NewspaperBlock[] = [
    {
      type: "node",
      dense: true,
      columns: 1,
      node: (
        <div className="mx-auto flex h-full max-w-xl flex-col justify-center text-center">
          <h1 className="font-serif text-4xl font-bold text-polis-ink">Newsletter do Portal Pólis</h1>
          <p className="mt-3 text-polis-ink-soft">
            Receba, direto no seu e-mail, as principais análises políticas selecionadas pela nossa
            redação.
          </p>
          <NewsletterForm />
          <p className="mt-4 text-xs text-polis-ink-soft/80">
            Seus dados são usados apenas para o envio da newsletter. Você pode cancelar a
            inscrição quando quiser, escrevendo para a nossa redação.
          </p>
        </div>
      ),
    },
  ];

  return <Newspaper sectionLabel="Newsletter" showMasthead blocks={blocks} />;
}
