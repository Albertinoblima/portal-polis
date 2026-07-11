"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");

    const { error } = await supabase.from("contact_messages").insert({
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
    });

    if (error) {
      setStatus("error");
      return;
    }

    setStatus("success");
    setName("");
    setEmail("");
    setMessage("");
  }

  if (status === "success") {
    return (
      <p className="mt-8 text-sm font-medium text-emerald-700">
        Mensagem enviada. Nossa redação vai analisar e responder em breve.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <div>
        <label htmlFor="name" className="block text-sm font-semibold text-polis-ink">
          Nome
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-1 w-full rounded-sm border border-polis-ink/20 px-4 py-2.5 focus:border-polis-gold-muted focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-polis-ink">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1 w-full rounded-sm border border-polis-ink/20 px-4 py-2.5 focus:border-polis-gold-muted focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="message" className="block text-sm font-semibold text-polis-ink">
          Mensagem
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="mt-1 w-full rounded-sm border border-polis-ink/20 px-4 py-2.5 focus:border-polis-gold-muted focus:outline-none"
        />
      </div>
      {status === "error" && (
        <p className="text-sm text-red-700">
          Não foi possível enviar sua mensagem. Tente novamente em instantes.
        </p>
      )}
      <Button type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? "Enviando..." : "Enviar mensagem"}
      </Button>
      <p className="text-xs text-polis-ink-soft">
        Ao enviar, você concorda com nossa{" "}
        <a href="/politica-de-privacidade" className="underline hover:text-polis-gold-ink">
          Política de Privacidade
        </a>
        .
      </p>
    </form>
  );
}
