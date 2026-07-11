import { supabase } from "@/lib/supabase/client";

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function requestPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/admin/redefinir-senha/`,
  });
  if (error) throw error;
}

export const STAFF_ROLES = ["admin", "editor_chief", "editor", "reviewer", "columnist"] as const;
