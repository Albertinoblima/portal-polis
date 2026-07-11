import { expect, test } from "@playwright/test";

test("home page loads and shows the site title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Pólis/);
});

test("navigating to an article from the home page works", async ({ page }) => {
  await page.goto("/");
  const articleLink = page.locator('a[href^="/materia/"]').first();
  await articleLink.click();
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
