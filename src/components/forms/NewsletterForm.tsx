"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage(null);

    const { error } = await supabase.from("newsletter_subscribers").insert({ email: email.trim() });

    if (error) {
      if (error.code === "23505") {
        setStatus("success");
        setMessage("Esse e-mail já está inscrito na nossa newsletter.");
      } else {
        setStatus("error");
        setMessage("Não foi possível concluir sua inscrição. Tente novamente em instantes.");
      }
      return;
    }

    setStatus("success");
    setMessage("Inscrição confirmada! Você passará a receber nossas análises por e-mail.");
    setEmail("");
  }

  if (status === "success") {
    return <p className="mx-auto mt-8 max-w-md text-sm font-medium text-emerald-700">{message}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
      <input
        type="email"
        name="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="seu@email.com"
        className="w-full rounded-sm border border-polis-ink/20 px-4 py-3 focus:border-polis-gold-muted focus:outline-none"
      />
      <Button type="submit" disabled={status === "submitting"} className="whitespace-nowrap">
        {status === "submitting" ? "Enviando..." : "Inscrever-se"}
      </Button>
      {status === "error" && <p className="text-sm text-red-700 sm:col-span-2">{message}</p>}
    </form>
  );
}
