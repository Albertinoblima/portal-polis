// Estimativa de "karaokê" para o áudio gerado pelo Piper (ver
// scripts/generate-audio.mjs): como o Piper não emite timestamp por palavra,
// distribuímos a duração total do MP3 entre as palavras do texto, ponderando
// pelo nº de caracteres (palavra longa recebe fatia maior) e somando uma
// pausa extra depois de pontuação de frase/oração. Uma divisão puramente
// uniforme (duração_total / nº_palavras) ignora essas pausas — que toda TTS
// insere em vírgulas e pontos e duram bem mais que uma palavra — e esse erro
// se acumula frase a frase, o suficiente para destacar a frase errada perto
// do fim de matérias mais longas.

export const TTS_WORD_CLASS = "tts-word";
export const TTS_ACTIVE_WORD_CLASS = "tts-word--active";

const TAG_OR_WORD = /(<[^>]+>)|([^\s<]+)/g;

/** Envolve cada "palavra" (sequência sem espaço/tag) de `html` num `<span>` marcador, preservando as tags como estão. */
export function wrapWordsForHighlight(html: string): string {
  return html.replace(TAG_OR_WORD, (_match, tag: string | undefined, word: string | undefined) => {
    if (tag) return tag;
    return `<span class="${TTS_WORD_CLASS}">${word}</span>`;
  });
}

/**
 * Conta quantas "palavras" (mesmo critério de tokenização de `wrapWordsForHighlight`,
 * ignorando tags) existem em `html`. Usado para mapear, por página já paginada,
 * quantas palavras do áudio cada uma consome — sem isso não dá para saber a que
 * página do flip-book corresponde a palavra ativa (ver Newspaper.tsx).
 */
export function countWords(html: string): number {
  let count = 0;
  for (const match of html.matchAll(TAG_OR_WORD)) {
    if (!match[1]) count += 1; // match[1] = grupo de tag; ausente => é palavra
  }
  return count;
}

const SENTENCE_PAUSE_CHARS = new Set([".", "!", "?", "…"]);
const CLAUSE_PAUSE_CHARS = new Set([",", ";", ":"]);

// Peso em "caracteres equivalentes". Uma palavra de 1-2 letras (e, a, os)
// ainda leva um tempo mínimo perceptível para ser falada, daí o piso.
const MIN_WORD_WEIGHT = 3;
const SENTENCE_PAUSE_WEIGHT = 6;
const CLAUSE_PAUSE_WEIGHT = 3;

/**
 * Tempo cumulativo (em segundos) em que cada palavra de `words` termina,
 * distribuindo `durationSeconds` proporcionalmente ao peso de cada uma.
 * `schedule[i]` é o instante em que a palavra `i` acaba de ser falada.
 */
export function buildWordSchedule(words: string[], durationSeconds: number): number[] {
  if (words.length === 0 || !Number.isFinite(durationSeconds) || durationSeconds <= 0) return [];

  const weights = words.map((word) => {
    const lastChar = word.charAt(word.length - 1);
    const pause = SENTENCE_PAUSE_CHARS.has(lastChar)
      ? SENTENCE_PAUSE_WEIGHT
      : CLAUSE_PAUSE_CHARS.has(lastChar)
        ? CLAUSE_PAUSE_WEIGHT
        : 0;
    return Math.max(word.length, MIN_WORD_WEIGHT) + pause;
  });

  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

  const schedule: number[] = [];
  let cumulative = 0;
  for (const weight of weights) {
    cumulative += (weight / totalWeight) * durationSeconds;
    schedule.push(cumulative);
  }
  return schedule;
}

/** Índice da palavra ativa em `currentTime`, via busca binária em `schedule` (cumulativo e crescente). */
export function findActiveWordIndex(schedule: number[], currentTime: number): number {
  if (schedule.length === 0) return -1;

  let lo = 0;
  let hi = schedule.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (schedule[mid] < currentTime) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}
