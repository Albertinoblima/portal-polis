import { expect, test } from "@playwright/test";

test("home page loads and shows the site title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Pólis/);
});

test("navigating to an article from the home page works, when articles exist", async ({ page }) => {
  // O site pode legitimamente ter zero matérias publicadas (ex.: logo após o
  // setup inicial do Supabase) — ver withPlaceholderParam em src/lib/utils.ts.
  // Nesse caso não há link de matéria para clicar; o teste é pulado em vez de
  // falhar, já que "zero matérias" é um estado válido, não um bug.
  await page.goto("/");
  const articleLinks = page.locator('a[href^="/materia/"]');
  const count = await articleLinks.count();
  test.skip(count === 0, "Nenhuma matéria publicada neste ambiente.");

  await articleLinks.first().click();
  await expect(page).toHaveURL(/\/materia\//);
});

test("admin panel redirects to login when not authenticated", async ({ page }) => {
  await page.goto("/admin/dashboard/");
  await expect(page).toHaveURL(/\/admin\/login\//);
});

test("sitemap, robots and RSS are served", async ({ request }) => {
  expect((await request.get("/sitemap.xml")).ok()).toBe(true);
  expect((await request.get("/robots.txt")).ok()).toBe(true);
  expect((await request.get("/rss.xml")).ok()).toBe(true);
});
