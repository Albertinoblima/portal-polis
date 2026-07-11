"use client";

import Link from "next/link";
import { useState } from "react";
import { requestPasswordReset } from "@/lib/supabase/auth";
import { Button } from "@/components/ui/Button";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await requestPasswordReset(email);
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-polis-navy px-4">
      <div className="w-full max-w-sm rounded-sm bg-white p-8 shadow-xl">
        <h1 className="font-sans text-xl font-bold text-polis-navy">Recuperar senha</h1>

        {status === "sent" ? (
          <p className="mt-4 text-sm text-polis-slate">
            Se o e-mail existir na nossa base, você receberá um link para redefinir sua senha.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-polis-navy">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full rounded-sm border border-polis-navy/20 px-4 py-2.5 focus:border-polis-gold focus:outline-none"
              />
            </div>
            {status === "error" && (
              <p role="alert" className="text-sm text-red-700">
                Não foi possível enviar o e-mail agora. Tente novamente.
              </p>
            )}
            <Button type="submit" className="w-full">
              Enviar link de recuperação
            </Button>
          </form>
        )}

        <div className="mt-4 text-center text-sm">
          <Link href="/admin/login/" className="text-polis-slate hover:text-polis-gold">
            Voltar ao login
          </Link>
        </div>
      </div>
    </div>
  );
}
