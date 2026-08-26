import { describe, expect, it } from "vitest";
import { buildAudioPreambleText, formatDateSpoken } from "./audioPreamble";

describe("formatDateSpoken", () => {
  it("formata sem zero à esquerda no dia, mês por extenso", () => {
    expect(formatDateSpoken("2026-07-09T12:00:00.000Z")).toBe("9 de julho de 2026");
  });
});

describe("buildAudioPreambleText", () => {
  const base = {
    editionNumber: 12,
    publishedAt: "2026-07-09T12:00:00.000Z",
    editoriaName: "Política",
    authorName: "Ana Clara",
    title: "Reforma tributária avança no Congresso",
    subtitle: "Entenda o que muda na sua vida",
  };

  it("inclui a frase fixa sempre, no início", () => {
    expect(buildAudioPreambleText(base)).toMatch(/^Jornal Portal Pólis — Onde a Política faz sentido\./);
  });

  it("monta as partes na ordem: edição, data, editoria, autor, título, subtítulo", () => {
    expect(buildAudioPreambleText(base)).toBe(
      "Jornal Portal Pólis — Onde a Política faz sentido. " +
        "Edição número 12, 9 de julho de 2026. " +
        "Editoria: Política. " +
        "Por Ana Clara. " +
        "Reforma tributária avança no Congresso. " +
        "Entenda o que muda na sua vida."
    );
  });

  it("omite edição quando editionNumber não é informado, mas mantém a data", () => {
    const rest = {
      publishedAt: base.publishedAt,
      editoriaName: base.editoriaName,
      authorName: base.authorName,
      title: base.title,
      subtitle: base.subtitle,
    };
    expect(buildAudioPreambleText(rest)).toContain("9 de julho de 2026.");
    expect(buildAudioPreambleText(rest)).not.toContain("Edição número");
  });

  it("omite editoria/autor/subtítulo graciosamente quando ausentes", () => {
    const result = buildAudioPreambleText({
      publishedAt: base.publishedAt,
      title: base.title,
    });
    expect(result).not.toContain("Editoria:");
    expect(result).not.toContain("Por ");
    expect(result).toBe("Jornal Portal Pólis — Onde a Política faz sentido. 9 de julho de 2026. Reforma tributária avança no Congresso.");
  });
});
