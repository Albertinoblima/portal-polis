"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** Indica se já estamos no cliente (pós-hidratação), sem usar useEffect+setState. */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
