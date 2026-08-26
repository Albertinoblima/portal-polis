"use client";

import { useEffect, useRef, type RefObject } from "react";
import { buildWordSchedule, findActiveWordIndex, TTS_ACTIVE_WORD_CLASS, TTS_WORD_CLASS } from "@/lib/ttsHighlight";
import { useTtsPageSync } from "@/components/newspaper/TtsPageSyncContext";

/**
 * Destaca, dentro do corpo da matéria, a palavra correspondente à posição
 * atual de reprodução do `<audio>` (ver ttsHighlight.ts para a estimativa de
 * tempo por palavra — o Piper não gera timestamps reais). Também é quem
 * decide se o flip-book precisa virar de página para acompanhar a leitura —
 * a cada palavra ativa nova, avisa `TtsPageSyncContext` (ver lá), que sabe em
 * que página do jornal aquela palavra cai; a interação do leitor com o
 * player fica só em "ouvir/parar", o resto acontece sozinho.
 *
 * Reconsulta os spans a cada `timeupdate` em vez de cachear os elementos uma
 * única vez: um resize de viewport re-pagina a matéria (ver paginate.ts) e
 * recria os nós `<span>` do zero, o que invalidaria silenciosamente uma
 * referência guardada antes. Reconsultar é barato (algumas centenas de nós,
 * poucas vezes por segundo) e imune a isso.
 */
export function useAudioWordHighlight(audioRef: RefObject<HTMLAudioElement | null>, articleSlug: string) {
  const scheduleRef = useRef<number[] | null>(null);
  const activeIndexRef = useRef(-1);
  const { syncToWord } = useTtsPageSync();

  useEffect(() => {
    const maybeAudio = audioRef.current;
    if (!maybeAudio || typeof document === "undefined") return;
    // TS não propaga a narrowing de `maybeAudio` para dentro das funções
    // aninhadas abaixo (chamadas de forma assíncrona pelos listeners) —
    // `audio` é a mesma referência, só com o tipo já estreitado uma vez.
    const audio: HTMLAudioElement = maybeAudio;

    const selector = `[data-tts-body="${CSS.escape(articleSlug)}"] .${TTS_WORD_CLASS}`;
    const getWords = () => Array.from(document.querySelectorAll<HTMLElement>(selector));

    function setActiveIndex(index: number, words: HTMLElement[]) {
      if (index === activeIndexRef.current) return;
      words[activeIndexRef.current]?.classList.remove(TTS_ACTIVE_WORD_CLASS);
      words[index]?.classList.add(TTS_ACTIVE_WORD_CLASS);
      activeIndexRef.current = index;
      // -1 é só o estado de "nada destacado" (limpeza/fim) — nunca corresponde
      // a uma página real, então não há o que sincronizar nesse caso.
      if (index >= 0) syncToWord(articleSlug, index);
    }

    function handleLoadedMetadata() {
      const words = getWords();
      scheduleRef.current =
        words.length > 0 && Number.isFinite(audio.duration)
          ? buildWordSchedule(
              words.map((word) => word.textContent ?? ""),
              audio.duration
            )
          : null;
    }

    function handleTimeUpdate() {
      const schedule = scheduleRef.current;
      if (!schedule || schedule.length === 0) return;
      const words = getWords();
      // Nº de palavras mudou desde que a agenda foi calculada (relayout no
      // meio da leitura) — mais seguro pausar o destaque do que arriscar
      // apontar para a palavra errada com índices fora de sincronia.
      if (words.length !== schedule.length) return;
      setActiveIndex(findActiveWordIndex(schedule, audio.currentTime), words);
    }

    function handleEnded() {
      setActiveIndex(-1, getWords());
    }

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    // Metadados já podem ter carregado antes deste efeito rodar (ex.: áudio já em cache do navegador).
    if (audio.readyState >= 1) handleLoadedMetadata();

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      setActiveIndex(-1, getWords());
    };
  }, [audioRef, articleSlug, syncToWord]);
}
