"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";

export interface GameRegistrationSlot {
  label: string;
  symbol: "X" | "O";
}

interface PlayerInput {
  name: string;
  email: string;
  wantsNewsletter: boolean;
}

interface GameRegistrationFormProps {
  slots: GameRegistrationSlot[];
  onRegistered: (names: string[]) => void;
}

export function GameRegistrationForm({ slots, onRegistered }: GameRegistrationFormProps) {
  const [players, setPlayers] = useState<PlayerInput[]>(
    slots.map(() => ({ name: "", email: "", wantsNewsletter: false }))
  );
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [error, setError] = useState<string | null>(null);

  function updatePlayer(index: number, patch: Partial<PlayerInput>) {
    setPlayers((prev) => prev.map((player, i) => (i === index ? { ...player, ...patch } : player)));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const missingEmail = players.some((player) => player.wantsNewsletter && !player.email.trim());
    if (missingEmail) {
      setError("Informe um e-mail para se inscrever na newsletter.");
      return;
    }

    setStatus("submitting");

    try {
      await Promise.all(
        players.map((player) =>
          supabase.from("game_players").insert({
            name: player.name.trim(),
            email: player.email.trim() || null,
            game: "jogo-da-velha",
            wants_newsletter: player.wantsNewsletter,
          })
        )
      );

      const subscribers = players.filter((player) => player.wantsNewsletter && player.email.trim());
      if (subscribers.length > 0) {
        await Promise.all(
          subscribers.map((player) =>
            supabase
              .from("newsletter_subscribers")
              .insert({ email: player.email.trim(), name: player.name.trim() })
          )
        );
      }
    } catch {
      // Cadastro é apenas um registro leve para a sessão de jogo — se a
      // gravação falhar (offline, etc.), deixamos a partida começar mesmo assim.
    }

    onRegistered(players.map((player) => player.name.trim()));
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-md flex-col gap-6">
      {slots.map((slot, index) => {
        const player = players[index];
        return (
          <fieldset key={slot.symbol} className="border border-polis-ink/20 p-4">
            <legend className="px-2 font-serif text-sm font-bold uppercase tracking-wide text-polis-ink">
              {slot.label} ({slot.symbol})
            </legend>

            <label htmlFor={`name-${index}`} className="mt-2 block text-xs font-semibold text-polis-ink">
              Nome
            </label>
            <input
              id={`name-${index}`}
              type="text"
              required
              value={player.name}
              onChange={(event) => updatePlayer(index, { name: event.target.value })}
              className="mt-1 w-full rounded-sm border border-polis-ink/20 px-3 py-2 text-sm focus:border-polis-gold-muted focus:outline-none"
            />

            <label className="mt-3 flex items-center gap-2 text-xs text-polis-ink-soft">
              <input
                type="checkbox"
                checked={player.wantsNewsletter}
                onChange={(event) => updatePlayer(index, { wantsNewsletter: event.target.checked })}
                className="h-4 w-4 border-polis-ink/30"
              />
              Quero me inscrever na newsletter para receber notícias e atualizações do Portal Pólis.
            </label>

            {player.wantsNewsletter && (
              <div className="mt-2">
                <label htmlFor={`email-${index}`} className="block text-xs font-semibold text-polis-ink">
                  E-mail
                </label>
                <input
                  id={`email-${index}`}
                  type="email"
                  required
                  value={player.email}
                  onChange={(event) => updatePlayer(index, { email: event.target.value })}
                  className="mt-1 w-full rounded-sm border border-polis-ink/20 px-3 py-2 text-sm focus:border-polis-gold-muted focus:outline-none"
                />
              </div>
            )}
          </fieldset>
        );
      })}

      {error && <p className="text-sm text-red-700">{error}</p>}

      <Button type="submit" disabled={status === "submitting"} className="self-center">
        {status === "submitting" ? "Preparando partida..." : "Começar a jogar"}
      </Button>

      <p className="text-center text-xs text-polis-ink-soft">
        Ao se cadastrar, você concorda com nossa{" "}
        <a href="/politica-de-privacidade" className="underline hover:text-polis-gold-ink">
          Política de Privacidade
        </a>
        .
      </p>
    </form>
  );
}
