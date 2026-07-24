"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

const WHATSAPP_NUMBER = "5587988568605";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const text = [
      `Nome: ${name.trim()}`,
      `E-mail: ${email.trim()}`,
      "",
      message.trim(),
    ].join("\n");

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
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
      <Button type="submit">Enviar mensagem</Button>
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
