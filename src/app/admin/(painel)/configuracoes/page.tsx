import type { Metadata } from "next";
import { AdminTopbar } from "@/components/admin/Topbar";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Configurações",
};

export default function AdminConfiguracoesPage() {
  return (
    <>
      <AdminTopbar title="Configurações" description="Configurações gerais do portal e de SEO." />

      <form className="max-w-2xl space-y-6 p-6">
        <fieldset className="rounded-sm border border-polis-navy/10 bg-white p-4">
          <legend className="px-1 text-sm font-semibold text-polis-navy">Geral</legend>
          <div className="space-y-3">
            <div>
              <label htmlFor="siteName" className="block text-xs font-semibold text-polis-slate">
                Nome do site
              </label>
              <input
                id="siteName"
                name="siteName"
                defaultValue="Pólis"
                className="mt-1 w-full rounded-sm border border-polis-navy/20 px-3 py-2 text-sm focus:border-polis-gold focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="tagline" className="block text-xs font-semibold text-polis-slate">
                Slogan
              </label>
              <input
                id="tagline"
                name="tagline"
                defaultValue="Onde a política faz sentido"
                className="mt-1 w-full rounded-sm border border-polis-navy/20 px-3 py-2 text-sm focus:border-polis-gold focus:outline-none"
              />
            </div>
          </div>
        </fieldset>

        <fieldset className="rounded-sm border border-polis-navy/10 bg-white p-4">
          <legend className="px-1 text-sm font-semibold text-polis-navy">SEO Global</legend>
          <div className="space-y-3">
            <div>
              <label htmlFor="defaultSeoTitle" className="block text-xs font-semibold text-polis-slate">
                Meta título padrão
              </label>
              <input
                id="defaultSeoTitle"
                name="defaultSeoTitle"
                defaultValue="Pólis — Onde a política faz sentido"
                className="mt-1 w-full rounded-sm border border-polis-navy/20 px-3 py-2 text-sm focus:border-polis-gold focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="defaultSeoDescription" className="block text-xs font-semibold text-polis-slate">
                Meta descrição padrão
              </label>
              <textarea
                id="defaultSeoDescription"
                name="defaultSeoDescription"
                rows={2}
                className="mt-1 w-full rounded-sm border border-polis-navy/20 px-3 py-2 text-sm focus:border-polis-gold focus:outline-none"
              />
            </div>
          </div>
        </fieldset>

        <Button type="submit">Salvar Configurações</Button>
      </form>
    </>
  );
}
