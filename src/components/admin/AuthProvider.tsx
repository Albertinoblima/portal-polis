"use client";

import { createContext, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import type { Database, UserRole } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface AuthContextValue {
  profile: Profile;
  accessToken: string;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAdminSession(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAdminSession deve ser usado dentro de <AuthProvider>.");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { session, loading, isStaff, signOut } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!session || !isStaff)) {
      router.replace("/admin/login/");
    }
  }, [loading, session, isStaff, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-polis-off-white text-polis-slate">
        Carregando painel...
      </div>
    );
  }

  if (!session || !isStaff) {
    return null;
  }

  // Perfil "sintético" a partir dos dados do GitHub — mantém a mesma forma
  // usada quando o painel ainda dependia de `profiles` no Supabase, para não
  // exigir alterações em todas as telas que já leem `profile.*` (várias
  // dessas telas continuam usando Supabase para dados/gravações e serão
  // migradas nas próximas etapas).
  const profile: Profile = {
    id: String(session.user.id),
    email: session.user.email ?? `${session.user.login}@users.noreply.github.com`,
    name: session.user.name ?? session.user.login,
    avatar_url: session.user.avatar_url,
    role: "admin" as UserRole,
    bio: null,
    socials: {},
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <AuthContext.Provider value={{ profile, accessToken: session.accessToken, signOut }}>
      <div className="border-b border-yellow-400 bg-yellow-50 px-4 py-2 text-center text-xs text-yellow-900">
        Painel em migração para login via GitHub: por enquanto, Dashboard, Matérias e Biblioteca de
        Mídia estão disponíveis. As demais seções voltam nas próximas etapas.
      </div>
      {children}
    </AuthContext.Provider>
  );
}
