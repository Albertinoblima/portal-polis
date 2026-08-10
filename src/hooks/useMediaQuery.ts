"use client";

import { useMemo, useSyncExternalStore } from "react";

const noopSubscribe = () => () => { };

/**
 * Resultado de uma media query CSS arbitrária, sincronizado via
 * matchMedia. Começa em `false` no servidor/primeira renderização (sem
 * acesso a `window`) — quem usa isto para decidir QUAL layout montar deve
 * aceitar essa hidratação em duas etapas (ver useCompactLandscape.ts, que
 * segue o mesmo padrão).
 */
export function useMediaQuery(query: string): boolean {
  const media = useMemo(() => query, [query]);

  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") return noopSubscribe();
      const mql = window.matchMedia(media);
      mql.addEventListener("change", onStoreChange);
      return () => mql.removeEventListener("change", onStoreChange);
    },
    () => {
      if (typeof window === "undefined") return false;
      return window.matchMedia(media).matches;
    },
    () => false
  );
}
