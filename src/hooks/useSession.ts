"use client";

// Sessão do painel administrativo via GitHub OAuth Device Flow — substitui
// o antigo Supabase Auth. "Staff" aqui significa "colaborador do repositório
// com permissão de escrita" (checado via getRepoWritePermission), não mais
// um papel granular armazenado em banco.
import { useCallback, useEffect, useState } from "react";
import { getAuthenticatedUser, getRepoWritePermission, type GithubUser } from "@/lib/github/client";

const TOKEN_STORAGE_KEY = "polis_admin_gh_token";

export interface GithubSession {
  accessToken: string;
  user: GithubUser;
}

interface SessionState {
  session: GithubSession | null;
  loading: boolean;
  isStaff: boolean;
  applyToken: (token: string) => Promise<void>;
  signOut: () => void;
}

export function useSession(): SessionState {
  const [session, setSession] = useState<GithubSession | null>(null);
  const [isStaff, setIsStaff] = useState(false);
  const [loading, setLoading] = useState(true);

  const applyToken = useCallback(async (token: string) => {
    const user = await getAuthenticatedUser(token);
    const hasWriteAccess = await getRepoWritePermission(token);
    if (!hasWriteAccess) {
      throw new Error("Sua conta GitHub não tem permissão de escrita neste repositório.");
    }
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    setSession({ accessToken: token, user });
    setIsStaff(true);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function restore() {
      // O `await` garante que o corpo abaixo sempre rode em um microtask
      // separado do efeito, evitando setState síncrono dentro do effect.
      await Promise.resolve();
      const stored = window.localStorage.getItem(TOKEN_STORAGE_KEY);

      if (stored) {
        try {
          await applyToken(stored);
        } catch {
          window.localStorage.removeItem(TOKEN_STORAGE_KEY);
        }
      }

      if (isMounted) setLoading(false);
    }

    restore();

    return () => {
      isMounted = false;
    };
  }, [applyToken]);

  const signOut = useCallback(() => {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    setSession(null);
    setIsStaff(false);
  }, []);

  return { session, loading, isStaff, applyToken, signOut };
}
