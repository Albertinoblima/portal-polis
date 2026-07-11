"use client";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Não lança erro aqui: o export estático do Next.js pré-renderiza o "shell"
// de toda página, incluindo as do admin, mesmo sendo client components — e
// isso avalia este módulo em build time, antes de qualquer .env real existir
// localmente. As chamadas de fato ao Supabase só acontecem dentro de efeitos
// (useEffect), já no navegador, então um placeholder aqui é inofensivo: em
// produção o GitHub Actions injeta as variáveis reais (veja
// .github/workflows/deploy.yml); localmente, configure .env.local.
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠ NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY não configuradas — " +
      "o painel administrativo não vai autenticar. Veja .env.local.example."
  );
}

export const supabase = createClient<Database>(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
