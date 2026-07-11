// Edge Function: trigger-rebuild
//
// Dispara um novo build+deploy do site estático via GitHub Actions
// (repository_dispatch). Chamada pelo painel administrativo depois de
// publicar/editar conteúdo, e pelo botão manual "Sincronizar site".
// Só pode ser chamada por um usuário autenticado com papel de staff.

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const GITHUB_PAT = Deno.env.get("GITHUB_PAT")!;
const GITHUB_REPO = Deno.env.get("GITHUB_REPO") ?? "Albertinoblima/portal-polis";

const STAFF_ROLES = ["admin", "editor_chief", "editor", "reviewer", "columnist"];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Não autenticado." }, 401);
    }

    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
    } = await callerClient.auth.getUser();

    if (!user) {
      return json({ error: "Não autenticado." }, 401);
    }

    const { data: callerProfile } = await callerClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!callerProfile || !STAFF_ROLES.includes(callerProfile.role)) {
      return json({ error: "Apenas a equipe editorial pode sincronizar o site." }, 403);
    }

    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/dispatches`, {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${GITHUB_PAT}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({ event_type: "content-updated" }),
    });

    if (!response.ok) {
      const detail = await response.text();
      return json({ error: `GitHub respondeu ${response.status}: ${detail}` }, 502);
    }

    return json({ success: true }, 202);
  } catch (error) {
    return json({ error: (error as Error).message }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
