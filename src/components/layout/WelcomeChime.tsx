"use client";

import { useEffect } from "react";

const WELCOME_AUDIO_SRC = "/assets/audio/welcome.mp3";
const SESSION_KEY = "portal-polis:welcome-played";

/**
 * Toca a saudação de boas-vindas (Piper TTS gerado uma vez em CI, ver
 * WELCOME_TEXT em scripts/generate-audio.mjs) no primeiro clique do leitor
 * em qualquer lugar do site — nunca ao carregar a página sozinho, porque
 * nenhum navegador toca áudio com som sem um gesto prévio do usuário
 * (política de autoplay); mesma razão pela qual "Ouvir matéria"
 * (AudioPlayerButton.tsx) também depende de clique.
 *
 * Toca só uma vez por sessão do navegador (sessionStorage, não
 * localStorage): monta no layout de `(site)`, que sobrevive a navegações
 * client-side entre páginas (RouteFlipTransition) — então normalmente só o
 * primeiro clique da visita já dispara isso. O sessionStorage cobre os casos
 * em que o componente remonta do zero (recarregar a página, abrir o site
 * numa aba nova) sem tocar de novo até a aba/sessão fechar.
 */
export function WelcomeChime() {
  useEffect(() => {
    if (alreadyPlayedThisSession()) return;

    function handleFirstClick() {
      markPlayedThisSession();
      new Audio(WELCOME_AUDIO_SRC).play().catch(() => {});
    }

    window.addEventListener("click", handleFirstClick, { once: true });
    return () => window.removeEventListener("click", handleFirstClick);
  }, []);

  return null;
}

function alreadyPlayedThisSession(): boolean {
  try {
    return window.sessionStorage.getItem(SESSION_KEY) !== null;
  } catch {
    // sessionStorage indisponível (modo privado restrito, etc.) — melhor
    // tocar em toda visita do que nunca tocar.
    return false;
  }
}

function markPlayedThisSession() {
  try {
    window.sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    // Sem persistência: pode tocar de novo numa próxima navegação com
    // remount, mas não vale travar o clique do leitor por causa disso.
  }
}
