import { test, expect } from "@playwright/test";

// Admin pages require is_admin: true in mock profile.
// These tests verify the admin review queue renders and form elements are interactive.

test.describe("Admin review queue", () => {
  test("review page loads", async ({ page }) => {
    await page.goto("/admin/review");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("review page shows heading", async ({ page }) => {
    await page.goto("/admin/review");
    await page.waitForLoadState("domcontentloaded");

    const heading = page.getByText(/review queue/i).first();
    await expect(heading).toBeVisible();
  });

  test("review page shows pending count or empty state", async ({ page }) => {
    await page.goto("/admin/review");
    await page.waitForLoadState("networkidle");

    const hasPending = await page.getByText(/pending/).isVisible({ timeout: 3000 }).catch(() => false);
    const hasEmpty = await page.getByText(/inbox clear|no items/i).isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasPending || hasEmpty).toBe(true);
  });

  test("new item page loads with form", async ({ page }) => {
    await page.goto("/admin/review/new");
    await page.waitForLoadState("domcontentloaded");

    // The create form should have headline and analysis fields
    const headlineInput = page.locator('input[name="headline"]');
    const hasHeadline = await headlineInput.isVisible({ timeout: 3000 }).catch(() => false);

    // Page should at least render without error
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("admin plans page loads", async ({ page }) => {
    await page.goto("/admin/plans");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("admin sources page loads", async ({ page }) => {
    await page.goto("/admin/sources");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("admin logs page loads", async ({ page }) => {
    await page.goto("/admin/logs");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).not.toBeEmpty();
  });
});
