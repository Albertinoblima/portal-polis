"use client";

import { createContext, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import type { UserRole } from "@/types";

// Perfil "sintético" a partir dos dados do GitHub — todo colaborador do
// repositório com permissão de escrita é tratado como admin (não há papéis
// granulares por editoria, ao contrário do antigo modelo com Supabase Auth).
interface Profile {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  role: UserRole;
  bio: string | null;
  socials: Record<string, string>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

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
      {children}
    </AuthContext.Provider>
  );
}
