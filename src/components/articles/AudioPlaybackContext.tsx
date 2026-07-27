"use client";

// Ponte entre o botão "Ouvir matéria" (dentro da página 1 do flip-book da
// matéria) e o controle no cabeçalho do site. O motor de flip (PageFlipEngine)
// nunca desmonta as páginas ao virar — só reposiciona o DOM — então o áudio
// continua tocando em segundo plano mesmo quando o leitor já virou para a
// página 3, 4 etc. Sem isso, pausar exigia voltar até a página 1 para
// reencontrar o botão. AudioPlayerButton/ListenButton publicam seu estado
// aqui; o cabeçalho só lê.
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface ArticleAudioController {
  articleTitle: string;
  isPlaying: boolean;
  toggle: () => void;
}

interface AudioPlaybackContextValue {
  controller: ArticleAudioController | null;
  setController: (controller: ArticleAudioController | null) => void;
}

const AudioPlaybackContext = createContext<AudioPlaybackContextValue | null>(null);

export function AudioPlaybackProvider({ children }: { children: ReactNode }) {
  const [controller, setControllerState] = useState<ArticleAudioController | null>(null);
  const setController = useCallback((next: ArticleAudioController | null) => {
    setControllerState(next);
  }, []);
  const value = useMemo(() => ({ controller, setController }), [controller, setController]);

  return <AudioPlaybackContext.Provider value={value}>{children}</AudioPlaybackContext.Provider>;
}

export function useAudioPlaybackController() {
  const ctx = useContext(AudioPlaybackContext);
  if (!ctx) throw new Error("useAudioPlaybackController precisa estar dentro de <AudioPlaybackProvider>");
  return ctx;
}
