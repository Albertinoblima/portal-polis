import { expect, test } from "@playwright/test";

const ROUTES: Array<{ path: string; heading: string }> = [
  { path: "/entretenimento/", heading: "Entretenimento" },
  { path: "/entretenimento/jogos/", heading: "Jogos" },
  { path: "/entretenimento/jogos/jogo-da-velha/", heading: "Jogo da Velha" },
  { path: "/entretenimento/jogos/cobrinha/", heading: "Jogo da Cobrinha" },
  { path: "/entretenimento/jogos/blocos/", heading: "Jogo dos Blocos" },
  { path: "/entretenimento/palavras-cruzadas/", heading: "Palavras Cruzadas" },
  { path: "/entretenimento/caca-palavras/", heading: "Caça-Palavras" },
];

for (const { path, heading } of ROUTES) {
  test(`${path} loads and shows "${heading}"`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto(path);
    await expect(page.getByRole("heading", { name: heading, level: 1 })).toBeVisible();

    expect(errors, `console errors on ${path}`).toEqual([]);
  });
}
