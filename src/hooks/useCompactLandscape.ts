"use client";

import { useMemo, useSyncExternalStore } from "react";

const noopSubscribe = () => () => { };

/**
 * Detecta viewports com pouca altura em modo paisagem, úteis para comprimir
 * interfaces de jogos sem comprometer legibilidade no restante dos breakpoints.
 */
export function useCompactLandscape(enabled: boolean, maxHeightPx = 560): boolean {
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