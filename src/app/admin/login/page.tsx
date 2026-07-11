import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Entrar",
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-polis-navy px-4">
      <div className="w-full max-w-sm rounded-sm bg-white p-8 shadow-xl">
        <div className="flex flex-col items-center gap-3">
          <Image src="/brand/LOGO_MARCA.png" alt="Pólis" width={56} height={56} className="h-14 w-14" />
          <h1 className="font-sans text-xl font-bold text-polis-navy">Painel Administrativo</h1>
        </div>

        <form className="mt-8 space-y-4">
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
            <label htmlFor="password" className="block text-sm font-semibold text-polis-navy">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1 w-full rounded-sm border border-polis-navy/20 px-4 py-2.5 focus:border-polis-gold focus:outline-none"
            />
          </div>
          <Button type="submit" className="w-full">
            Entrar
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          <Link href="#" className="text-polis-slate hover:text-polis-gold">
            Esqueci minha senha
          </Link>
        </div>
      </div>
    </div>
  );
}
