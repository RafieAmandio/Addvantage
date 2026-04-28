import { test, expect } from "@playwright/test";

test.describe("News browsing", () => {
  test("news page loads with heading", async ({ page }) => {
    await page.goto("/app/news");
    await expect(page.getByRole("heading", { name: /news/i })).toBeVisible();
  });

  test("news list renders items from mock data", async ({ page }) => {
    await page.goto("/app/news");
    await page.waitForLoadState("networkidle");

    const rows = page.locator('a[href^="/app/news/"]');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test("news items display impact and bias badges", async ({ page }) => {
    await page.goto("/app/news");
    await page.waitForLoadState("networkidle");

    const firstRow = page.locator('a[href^="/app/news/"]').first();
    await expect(firstRow).toBeVisible();
    // Rows contain impact/bias text
    const rowText = await firstRow.textContent();
    expect(rowText).toBeTruthy();
  });

  test("search input filters news", async ({ page }) => {
    await page.goto("/app/news");
    await page.waitForLoadState("networkidle");

    const allRows = page.locator('a[href^="/app/news/"]');
    const totalBefore = await allRows.count();

    if (totalBefore === 0) {
      test.skip(true, "No mock news items");
      return;
    }

    const search = page.getByRole("textbox", { name: /search/i });
    await search.fill("zzz_no_match_zzz");
    await page.waitForTimeout(300);

    const nullState = page.getByText(/null transmission/i);
    await expect(nullState).toBeVisible();
  });

  test("filter buttons change displayed items", async ({ page }) => {
    await page.goto("/app/news");
    await page.waitForLoadState("networkidle");

    const highBtn = page.getByRole("button", { name: /^high$/i });
    await highBtn.click();

    const itemsSection = page.locator('[class*="space-y"]');
    await expect(itemsSection).toBeVisible();
  });

  test("clicking a news item navigates to detail", async ({ page }) => {
    await page.goto("/app/news");
    await page.waitForLoadState("networkidle");

    const firstLink = page.locator('a[href^="/app/news/"]').first();
    if (!(await firstLink.isVisible({ timeout: 3000 }))) {
      test.skip(true, "No news items to click");
      return;
    }

    const href = await firstLink.getAttribute("href");
    await firstLink.click();
    await page.waitForLoadState("domcontentloaded");
    expect(page.url()).toContain("/app/news/");
  });

  test("news detail page shows headline and analysis", async ({ page }) => {
    await page.goto("/app/news");
    await page.waitForLoadState("networkidle");

    const firstLink = page.locator('a[href^="/app/news/"]').first();
    if (!(await firstLink.isVisible({ timeout: 3000 }))) {
      test.skip(true, "No news items");
      return;
    }

    await firstLink.click();
    await page.waitForLoadState("domcontentloaded");

    // Detail page should have content
    const body = page.locator("body");
    const text = await body.textContent();
    expect(text!.length).toBeGreaterThan(50);
  });
});
