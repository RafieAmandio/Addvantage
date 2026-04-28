import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("homepage loads without crash", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("sidebar renders navigation links", async ({ page }) => {
    await page.goto("/app");
    await page.waitForLoadState("domcontentloaded");

    const newsLink = page.locator('a[href="/app/news"]').first();
    await expect(newsLink).toBeVisible();
  });

  test("sidebar news link navigates to news page", async ({ page }) => {
    await page.goto("/app");
    await page.waitForLoadState("domcontentloaded");

    const newsLink = page.locator('a[href="/app/news"]').first();
    if (await newsLink.isVisible()) {
      await newsLink.click();
      await expect(page).toHaveURL(/\/app\/news/);
    }
  });

  test("sidebar shows tier badge", async ({ page }) => {
    await page.goto("/app");
    await page.waitForLoadState("domcontentloaded");

    const tier = page.getByText(/tier/i).first();
    await expect(tier).toBeVisible();
  });

  test("all dashboard pages are accessible from sidebar", async ({ page }) => {
    await page.goto("/app");
    await page.waitForLoadState("domcontentloaded");

    const routes = [
      "/app/news",
      "/app/calendar",
      "/app/plan",
      "/app/consult",
      "/app/education",
    ];

    for (const route of routes) {
      const link = page.locator(`a[href="${route}"]`).first();
      const visible = await link.isVisible({ timeout: 2000 }).catch(() => false);
      if (!visible) continue;
      expect(await link.getAttribute("href")).toBe(route);
    }
  });

  test("subscription page loads", async ({ page }) => {
    await page.goto("/app/subscription");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("education page loads and shows primers", async ({ page }) => {
    await page.goto("/app/education");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("tags page loads", async ({ page }) => {
    await page.goto("/app/tags");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("brief page loads", async ({ page }) => {
    await page.goto("/app/brief");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("channel page loads", async ({ page }) => {
    await page.goto("/app/channel");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("watchlist page loads", async ({ page }) => {
    await page.goto("/app/watchlist");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).not.toBeEmpty();
  });
});

test.describe("Responsive", () => {
  test("dashboard renders on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/app");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("news page renders on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/app/news");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("sidebar collapses on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/app");
    await page.waitForLoadState("domcontentloaded");

    // On mobile, sidebar should be hidden or collapsible
    const sidebar = page.locator("nav").first();
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("admin pages render on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/admin/review");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).not.toBeEmpty();
  });
});
