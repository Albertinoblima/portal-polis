"use client";

import { useEffect, useRef, useState } from "react";
import { AudioButtonFrame } from "./AudioButtonFrame";
import { useAudioPlaybackController } from "./AudioPlaybackContext";
import { useAudioWordHighlight } from "./useAudioWordHighlight";

type Phase = "preamble" | "body";

/**
 * Botão "Ouvir matéria": toca o preâmbulo (nome do jornal, edição, data,
 * categoria, autor, título, subtítulo — ver src/lib/audioPreamble.ts) e, ao
 * terminar, o corpo em seguida — dois MP3 do Piper gerados separados em
 * scripts/generate-audio.mjs. Dois arquivos em vez de um só concatenado:
 * useAudioWordHighlight (destaque de palavra) fica ligado só ao elemento do
 * corpo, então nunca vê o preâmbulo — sem isso o destaque dessincronizaria.
 *
 * Sem listener de `pause`, de propósito: o único lugar que pausa um dos dois
 * elementos é o próprio `toggle()` abaixo, que já atualiza `isPlaying`
 * diretamente. Ouvir `pause` também dispararia no fim natural do preâmbulo
 * (o navegador dispara `pause` antes de `ended`), o que piscaria o rótulo do
 * botão entre as duas fases sem necessidade.
 */
export function AudioPlayerButton({
  bodySrc,
  preambleSrc,
  articleTitle,
  articleSlug,
}: {
  bodySrc: string;
  preambleSrc?: string;
  articleTitle: string;
  articleSlug: string;
}) {
  const preambleRef = useRef<HTMLAudioElement>(null);
  const bodyRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [phase, setPhase] = useState<Phase>(preambleSrc ? "preamble" : "body");
  const { setController } = useAudioPlaybackController();

  useAudioWordHighlight(bodyRef, articleSlug);

  function toggle() {
    const activeRef = phase === "preamble" ? preambleRef : bodyRef;
    const active = activeRef.current;
    if (!active) return;
    if (isPlaying) {
      active.pause();
      setIsPlaying(false);
    } else {
      active.play();
    }
  }

  function handlePreambleEnded() {
    setPhase("body");
    bodyRef.current?.play();
  }

  // Publica o controle para o botão do cabeçalho (ver AudioPlaybackContext) —
  // única forma de pausar/parar depois que o flip-book já virou passou da
  // página 1, onde este botão vive de verdade. `phase` entra nas deps: sem
  // isso, o controle publicado na fase do preâmbulo ficaria com um `toggle`
  // "preso" apontando pro elemento errado depois da transição pro corpo,
  // porque `isPlaying` pode não mudar de valor entre as duas fases.
  useEffect(() => {
    setController({ articleTitle, isPlaying, toggle });
    return () => setController(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, phase, articleTitle]);

  return (
    <>
      {preambleSrc && (
        <audio
          ref={preambleRef}
          src={preambleSrc}
          preload="none"
          className="hidden"
          onPlay={() => setIsPlaying(true)}
          onEnded={handlePreambleEnded}
        />
      )}
      <audio
        ref={bodyRef}
        src={bodySrc}
        preload="none"
        className="hidden"
        onPlay={() => setIsPlaying(true)}
        onEnded={() => setIsPlaying(false)}
      />
      <AudioButtonFrame
        active={isPlaying}
        label={isPlaying ? "Parar leitura" : "Ouvir matéria"}
        onClick={toggle}
      />
    </>
  );
}
