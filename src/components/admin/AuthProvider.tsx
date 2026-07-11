"use client";

import { createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/hooks/useSession";
import type { Session } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface AuthContextValue {
  session: Session;
  profile: Profile;
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
  const { session, profile, loading, isStaff } = useSession();
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

  if (!session || !profile || !isStaff) {
    return null;
  }

  return <AuthContext.Provider value={{ session, profile }}>{children}</AuthContext.Provider>;
}
