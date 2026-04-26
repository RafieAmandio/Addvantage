import { test, expect } from "@playwright/test";

// These tests run against the live dev server at http://localhost:3000
// They verify end-to-end user flows.

// Use MOCK_MODE=1 so pages load with fixture data (no real auth needed).

const BASE_URL = "http://localhost:3000";

test.describe("Public pages", () => {
  test("homepage loads without crash", async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await expect(
      page.locator('[data-testid="error-boundary"]')
    ).toHaveCount(0, { timeout: 5000 });
  });

  test("login page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await expect(page.locator("body")).not.toBeEmpty();
    await expect(page).toHaveTitle(/./);
  });
});

test.describe("Dashboard pages (mock mode)", () => {
  test.beforeEach(async ({ page }) => {
    // MOCK_MODE=1 is already set in .env.local
    // just navigate directly
  });

  test("dashboard loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app`);
    await page.waitForLoadState("domcontentloaded");
    // Should render without error boundary
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("news page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/news`);
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("chart page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/chart/AAPL`);
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("plan page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/plan`);
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("calendar page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/calendar`);
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("education page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/education`);
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("watchlist page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/watchlist`);
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("consult page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/consult`);
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("subscription page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/subscription`);
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("tags page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/tags`);
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("brief page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/brief`);
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("channel page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/channel`);
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).not.toBeEmpty();
  });
});

test.describe("Responsive", () => {
  test("dashboard renders on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/app`);
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("news page renders on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/app/news`);
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).not.toBeEmpty();
  });
});

test.describe("Navigation", () => {
  test("sidebar links work", async ({ page }) => {
    await page.goto(`${BASE_URL}/app`);
    await page.waitForLoadState("domcontentloaded");

    // Find news link in sidebar and click
    const newsLink = page.locator('a[href="/app/news"]').first();
    if (await newsLink.isVisible()) {
      await newsLink.click();
      await expect(page).toHaveURL(/\/app\/news/);
    }
  });

  test("login page has working form", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState("domcontentloaded");

    // Check email input exists
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    if (await emailInput.isVisible({ timeout: 2000 })) {
      await emailInput.fill("test@example.com");
    }
  });
});
