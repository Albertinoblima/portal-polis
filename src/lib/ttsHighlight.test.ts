import { describe, expect, it } from "vitest";
import { buildWordSchedule, countWords, findActiveWordIndex, wrapWordsForHighlight } from "./ttsHighlight";

describe("wrapWordsForHighlight", () => {
  it("envolve cada palavra em um span, preservando as tags intactas", () => {
    const html = "<p>O <strong>Congresso</strong> aprovou.</p>";
    expect(wrapWordsForHighlight(html)).toBe(
      '<p><span class="tts-word">O</span> <strong><span class="tts-word">Congresso</span></strong> <span class="tts-word">aprovou.</span></p>'
    );
  });

  it("não confunde atributos de tag (ex.: alt de imagem) com palavras", () => {
    const html = '<img src="a.jpg" alt="uma foto qualquer">Legenda</img>';
    const result = wrapWordsForHighlight(html);
    expect(result).toContain('<img src="a.jpg" alt="uma foto qualquer">');
    expect(result).toContain('<span class="tts-word">Legenda</span>');
    expect(result).not.toContain('tts-word">uma');
  });

  it("mantém o texto vazio/só-tags sem alterações", () => {
    expect(wrapWordsForHighlight("<p></p>")).toBe("<p></p>");
    expect(wrapWordsForHighlight("")).toBe("");
  });
});

describe("countWords", () => {
  it("conta o mesmo nº de tokens que wrapWordsForHighlight envolve em spans", () => {
    const html = "<p>O <strong>Congresso</strong> aprovou.</p>";
    expect(countWords(html)).toBe(3);
  });

  it("ignora atributos de tag (ex.: alt de imagem) na contagem", () => {
    const html = '<img src="a.jpg" alt="uma foto qualquer">Legenda</img>';
    expect(countWords(html)).toBe(1);
  });

  it("retorna 0 para texto vazio/só-tags", () => {
    expect(countWords("<p></p>")).toBe(0);
    expect(countWords("")).toBe(0);
  });

  it("bate com o nº de spans que wrapWordsForHighlight de fato produz", () => {
    const html = "<p>Texto de teste com <em>várias</em> palavras diferentes.</p>";
    const wrapped = wrapWordsForHighlight(html);
    const spanCount = (wrapped.match(/class="tts-word"/g) ?? []).length;
    expect(countWords(html)).toBe(spanCount);
  });
});

describe("buildWordSchedule", () => {
  it("retorna array vazio para lista vazia ou duração inválida", () => {
    expect(buildWordSchedule([], 10)).toEqual([]);
    expect(buildWordSchedule(["a"], 0)).toEqual([]);
    expect(buildWordSchedule(["a"], Number.NaN)).toEqual([]);
    expect(buildWordSchedule(["a"], -5)).toEqual([]);
  });

  it("o último item da agenda bate exatamente com a duração total", () => {
    const schedule = buildWordSchedule(["Isso", "é", "um", "teste."], 37.4);
    expect(schedule[schedule.length - 1]).toBeCloseTo(37.4, 5);
  });

  it("dá mais tempo para palavras mais longas", () => {
    const [oi, desenvolvimentista] = wordDurations(buildWordSchedule(["oi", "desenvolvimentista"], 10));
    expect(desenvolvimentista).toBeGreaterThan(oi);
  });

  it("dá uma pausa extra depois de pontuação de frase, tirando tempo do resto", () => {
    const withPunctuation = buildWordSchedule(["fim.", "novo", "texto"], 10);
    const withoutPunctuation = buildWordSchedule(["fim", "novo", "texto"], 10);
    // mesma duração total, mas a 1ª palavra ocupa uma fatia maior quando termina em ponto
    expect(withPunctuation[0]).toBeGreaterThan(withoutPunctuation[0]);
  });

  it("nunca deixa uma palavra de 1 letra com peso menor que o piso mínimo", () => {
    const [a, b] = wordDurations(buildWordSchedule(["a", "e"], 10));
    expect(a).toBeCloseTo(b, 10);
  });
});

describe("findActiveWordIndex", () => {
  const schedule = [1, 2, 3, 4, 5];

  it("retorna -1 para uma agenda vazia", () => {
    expect(findActiveWordIndex([], 0)).toBe(-1);
  });

  it("encontra a palavra correta em vários instantes, incluindo bordas", () => {
    expect(findActiveWordIndex(schedule, 0)).toBe(0);
    expect(findActiveWordIndex(schedule, 0.5)).toBe(0);
    expect(findActiveWordIndex(schedule, 1)).toBe(0);
    expect(findActiveWordIndex(schedule, 1.001)).toBe(1);
    expect(findActiveWordIndex(schedule, 4.9)).toBe(4);
  });

  it("fica presa no último índice depois do fim da agenda (currentTime > duração)", () => {
    expect(findActiveWordIndex(schedule, 100)).toBe(4);
  });
});

function wordDurations(schedule: number[]): number[] {
  return schedule.map((end, i) => end - (schedule[i - 1] ?? 0));
}
