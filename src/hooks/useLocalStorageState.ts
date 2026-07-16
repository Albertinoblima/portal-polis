"use client";

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { useIsClient } from "./useIsClient";

interface UseLocalStorageStateOptions<T> {
  serialize?: (value: T) => string;
  deserialize?: (raw: string) => T;
}

/**
 * Estado sincronizado com localStorage, seguro para SSR/hidratação: sempre
 * começa em `defaultValue` (igual no servidor e na primeira renderização do
 * cliente — nenhum acesso a `window` antes de montar) e só troca para o
 * valor salvo depois que `useIsClient()` confirma que já estamos no
 * cliente, evitando o erro "hydration mismatch" do React para qualquer
 * leitor que já tenha progresso/recorde salvo.
 *
 * Se `key` mudar depois de montado (ex.: troca de placar por par de
 * jogadores), o hook recarrega para a nova chave em vez de manter o valor
 * antigo.
 */
export function useLocalStorageState<T>(
  key: string,
  defaultValue: T,
  options?: UseLocalStorageStateOptions<T>
): [T, Dispatch<SetStateAction<T>>] {
  const isClient = useIsClient();
  const serialize = options?.serialize ?? ((value: T) => JSON.stringify(value));
  const deserialize = options?.deserialize ?? ((raw: string) => JSON.parse(raw) as T);

  const [state, setState] = useState<T>(defaultValue);
  const loadedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isClient) return;

    const timer = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(key);
        setState(raw !== null ? deserialize(raw) : defaultValue);
      } catch {
        setState(defaultValue);
      }
      loadedKeyRef.current = key;
    }, 0);

    return () => window.clearTimeout(timer);
    // defaultValue/deserialize ficam de fora de propósito: são configuração
    // inicial, não gatilhos — incluí-los recarregaria a cada render sempre
    // que o chamador passar um literal/objeto novo (comum, ex.: `new Set()`
    // ou `{ deserialize: ... }` inline).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, key]);

  useEffect(() => {
    if (loadedKeyRef.current !== key) return;
    try {
      window.localStorage.setItem(key, serialize(state));
    } catch {
      // localStorage indisponível (modo privado, etc.) — estado segue só em memória.
    }
    // serialize fica de fora pelo mesmo motivo do efeito acima.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, state]);

  return [state, setState];
}
