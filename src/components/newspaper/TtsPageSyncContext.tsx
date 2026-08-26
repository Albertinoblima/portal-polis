"use client";

// Ponte entre o destaque de palavra do áudio (useAudioWordHighlight, dentro do
// corpo da matéria) e o flip-book (Newspaper, dono do flipRef). Sem isso,
// virar de página automaticamente exigiria "furar" a árvore de componentes —
// useAudioWordHighlight roda várias vezes por segundo (a cada timeupdate) e
// não deve causar re-render do Newspaper inteiro a cada chamada.
//
// Por isso o valor do contexto é o PRÓPRIO objeto mutável (não um número/
// estado): Newspaper cria o objeto uma única vez (useRef) e só troca o método
// `syncToWord` a cada render — a identidade do objeto nunca muda, então
// publicá-lo via Context não dispara re-render em quem o consome. Quem lê só
// chama `.syncToWord(...)` quando precisa, e sempre pega a versão mais
// recente da lógica (que fecha sobre o estado atual de páginas via refs).
import { createContext, useContext } from "react";

export interface TtsPageSyncApi {
  /**
   * Chamado pelo destaque de áudio a cada palavra ativa nova. Decide, com
   * base no mapeamento palavra→página daquela matéria (`ttsId`), se o
   * flip-book precisa virar de página para continuar acompanhando a leitura.
   * Fora de um `<Newspaper>` (nenhum Provider acima), é um no-op seguro.
   */
  syncToWord: (ttsId: string, wordIndex: number) => void;
}

const NOOP_API: TtsPageSyncApi = { syncToWord: () => {} };

export const TtsPageSyncContext = createContext<TtsPageSyncApi>(NOOP_API);

export function useTtsPageSync(): TtsPageSyncApi {
  return useContext(TtsPageSyncContext);
}
