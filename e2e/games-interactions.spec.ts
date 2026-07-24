import { expect, test } from "@playwright/test";

async function startSnake(page: Parameters<typeof test>[0]["page"]) {
    await page.goto("/entretenimento/jogos/cobrinha/");
    await expect(page.getByRole("heading", { level: 1, name: "Jogo da Cobrinha" })).toBeVisible();
    await page.getByRole("button", { name: "Jogar" }).click();
}

async function startBlocks(page: Parameters<typeof test>[0]["page"]) {
    await page.goto("/entretenimento/jogos/blocos/");
    await expect(page.getByRole("heading", { level: 1, name: "Jogo dos Blocos" })).toBeVisible();
    await page.getByRole("button", { name: "Jogar" }).click();
}

async function startTicTacToeCpu(page: Parameters<typeof test>[0]["page"]) {
    await page.goto("/entretenimento/jogos/jogo-da-velha/");
    await expect(page.getByRole("heading", { level: 1, name: "Jogo da Velha" })).toBeVisible();
    await page.getByRole("button", { name: "Contra o computador" }).click();
    await page.getByLabel("Nome").fill("Leitor");
    await page.getByRole("button", { name: "Começar a jogar" }).click();
}

test.describe("Jogos - teclado desktop", () => {
    test("Cobrinha permite pausar e continuar por teclado", async ({ page }) => {
        await startSnake(page);

        await page.keyboard.press("Space");
        await expect(page.getByText("Pausado")).toBeVisible();

        await page.getByRole("button", { name: "Continuar" }).first().click();
        await expect(page.getByText("Pausado")).toBeHidden();

        await page.keyboard.press("ArrowDown");
    });

    test("Blocos pausa e retoma com tecla P", async ({ page }) => {
        await startBlocks(page);

        await page.keyboard.press("KeyP");
        await expect(page.getByText("Pausado")).toBeVisible();

        await page.keyboard.press("KeyP");
        await expect(page.getByText("Pausado")).toBeHidden();

        await page.keyboard.press("ArrowLeft");
        await page.keyboard.press("Space");
    });

    test("Jogo da Velha aceita lance via teclado", async ({ page }) => {
        await startTicTacToeCpu(page);

        const firstCell = page.getByRole("button", { name: /Casa 1/ });
        await firstCell.focus();
        await page.keyboard.press("Enter");

        await expect(page.getByRole("button", { name: /Casa 1, X/ })).toBeVisible();
    });
});

test.describe("Jogos - toque retrato", () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

    test("Cobrinha responde a controles touch", async ({ page }) => {
        await startSnake(page);

        await page.getByRole("button", { name: "Direita" }).tap();
        await page.getByRole("button", { name: "Pausar" }).first().tap();
        await expect(page.getByText("Pausado")).toBeVisible();
    });

    test("Blocos responde a botões touch", async ({ page }) => {
        await startBlocks(page);

        await page.getByRole("button", { name: "Girar" }).tap();
        await page.getByRole("button", { name: "Pausar" }).tap();
        await expect(page.getByText("Pausado")).toBeVisible();
    });

    test("Jogo da Velha local registra toques nos lances", async ({ page }) => {
        await page.goto("/entretenimento/jogos/jogo-da-velha/");
        await page.getByRole("button", { name: "Com outra pessoa" }).tap();

        const names = page.getByLabel("Nome");
        await names.nth(0).fill("Leitor A");
        await names.nth(1).fill("Leitor B");
        await page.getByRole("button", { name: "Começar a jogar" }).tap();

        await page.getByRole("button", { name: /Casa 1/ }).tap();
        await expect(page.getByRole("button", { name: /Casa 1, X/ })).toBeVisible();

        await page.getByRole("button", { name: /Casa 2/ }).tap();
        await expect(page.getByRole("button", { name: /Casa 2, O/ })).toBeVisible();
    });
});

test.describe("Jogos - paisagem", () => {
    test.use({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });

    test("Cobrinha permanece funcional em viewport horizontal", async ({ page }) => {
        await startSnake(page);

        await expect(page.getByRole("button", { name: "Direita" })).toBeVisible();
        await page.getByRole("button", { name: "Direita" }).click();
        await page.getByRole("button", { name: "Pausar" }).first().click();
        await expect(page.getByText("Pausado")).toBeVisible();
    });

    test("Blocos mantém painel de suporte em viewport horizontal", async ({ page }) => {
        await startBlocks(page);
        await expect(page.getByText("Próxima")).toBeVisible();
    });

    test("Jogo da Velha segue jogável em viewport horizontal", async ({ page }) => {
        await startTicTacToeCpu(page);

        await page.getByRole("button", { name: /Casa 1/ }).click();
        await expect(page.getByRole("button", { name: /Casa 1, X/ })).toBeVisible();
    });
});