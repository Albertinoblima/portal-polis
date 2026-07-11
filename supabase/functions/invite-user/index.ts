// Edge Function: invite-user
//
// Convida um novo membro da equipe por e-mail. Só pode ser chamada por um
// usuário autenticado com papel "admin". Usa a service_role key (nunca
// exposta ao navegador) para criar o usuário via Admin API do Supabase Auth
// — o trigger public.handle_new_user cria o profile correspondente
// automaticamente, já com o papel informado.

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const ALLOWED_ROLES = ["admin", "editor_chief", "editor", "reviewer", "columnist"];

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

    // Cliente com a permissão do chamador (respeita RLS) — usado só para
    // confirmar que quem está chamando é de fato um admin.
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

    if (callerProfile?.role !== "admin") {
      return json({ error: "Apenas administradores podem convidar usuários." }, 403);
    }

    const { email, name, role } = await req.json();

    if (!email || !name || !ALLOWED_ROLES.includes(role)) {
      return json({ error: "Parâmetros inválidos (email, name, role)." }, 400);
    }

    // Cliente com service_role — só aqui, nunca no navegador.
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: { name, role },
    });

    if (error) {
      return json({ error: error.message }, 400);
    }

    return json({ success: true, userId: data.user.id });
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
