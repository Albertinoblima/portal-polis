import { expect, test, type Page } from "@playwright/test";

async function startSnake(page: Page) {
    await page.goto("/entretenimento/jogos/cobrinha/");
    await expect(page.getByRole("heading", { level: 1, name: "Jogo da Cobrinha" })).toBeVisible();
    await page.getByRole("button", { name: "Jogar" }).click();
}

async function startBlocks(page: Page) {
    await page.goto("/entretenimento/jogos/blocos/");
    await expect(page.getByRole("heading", { level: 1, name: "Jogo dos Blocos" })).toBeVisible();
    await page.getByRole("button", { name: "Jogar" }).click();
}

async function startTicTacToeCpu(page: Page) {
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

    test("Blocos responde a cliques e arrastos de mouse no tabuleiro", async ({ page }) => {
        // Regressão: o tabuleiro só escutava Touch Events, então mouse (sem
        // tela sensível ao toque) não conseguia jogar de jeito nenhum. Ver
        // handleBoardPointer* em Blocks.tsx (Pointer Events unificam mouse e
        // toque).
        const errors: string[] = [];
        page.on("pageerror", (err) => errors.push(err.message));

        await startBlocks(page);
        const canvas = page.getByRole("img", { name: /Tabuleiro do Jogo dos Blocos/ });
        const box = await canvas.boundingBox();
        if (!box) throw new Error("Tabuleiro sem bounding box");

        // Clique simples (sem arrasto) gira a peça.
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

        // Arrasto lateral com o mouse move a peça.
        await page.mouse.move(box.x + box.width / 2, box.y + 40);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 + 60, box.y + 40, { steps: 5 });
        await page.mouse.up();

        expect(errors).toEqual([]);
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

    test("Cobrinha responde a gestos de arrasto no tabuleiro", async ({ page }) => {
        // Sem D-pad: arrastar sobre o tabuleiro vira a cobra (ver
        // handleBoardPointer* em Snake.tsx — Pointer Events unificam mouse e
        // toque, mesmo padrão já coberto para o Jogo dos Blocos abaixo).
        await startSnake(page);

        const canvas = page.getByRole("img", { name: /Tabuleiro do Jogo da Cobrinha/ });
        const box = await canvas.boundingBox();
        if (!box) throw new Error("Tabuleiro sem bounding box");

        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 60, { steps: 5 });
        await page.mouse.up();

        await page.getByRole("button", { name: "Pausar" }).first().tap();
        await expect(page.getByText("Pausado")).toBeVisible();
    });

    test("Blocos responde a gestos de toque no tabuleiro", async ({ page }) => {
        await startBlocks(page);

        // Sem D-pad: toque rápido sem deslocamento no tabuleiro gira a peça
        // (ver handleBoardTouchEnd em Blocks.tsx). O botão "Pausar" continua
        // existindo à parte, fora do tabuleiro.
        await page.getByRole("img", { name: /Tabuleiro do Jogo dos Blocos/ }).tap();
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

        const canvas = page.getByRole("img", { name: /Tabuleiro do Jogo da Cobrinha/ });
        await expect(canvas).toBeVisible();
        const box = await canvas.boundingBox();
        if (!box) throw new Error("Tabuleiro sem bounding box");

        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 60, { steps: 5 });
        await page.mouse.up();

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