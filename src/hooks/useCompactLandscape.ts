"use client";

import { useMemo, useSyncExternalStore } from "react";

const noopSubscribe = () => () => { };

/**
 * Detecta viewports com pouca altura em modo paisagem (ex.: celular deitado)
 * — nesses casos o empilhamento vertical padrão de placar+tabuleiro+controles
 * não cabe na área disponível. Os jogos com D-pad (Cobrinha, Blocos) usam
 * isso para rearranjar tabuleiro e controles lado a lado em vez de
 * empilhados, mantendo tudo visível sem rolagem.
 */
export function useCompactLandscape(enabled: boolean, maxHeightPx = 480): boolean {
    const query = useMemo(
        () => `(orientation: landscape) and (max-height: ${maxHeightPx}px)`,
        [maxHeightPx]
    );

    return useSyncExternalStore(
        (onStoreChange) => {
            if (!enabled || typeof window === "undefined") return noopSubscribe();
            const media = window.matchMedia(query);
            media.addEventListener("change", onStoreChange);
            return () => media.removeEventListener("change", onStoreChange);
        },
        () => {
            if (!enabled || typeof window === "undefined") return false;
            return window.matchMedia(query).matches;
        },
        () => false
    );
}
