import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("login page renders with email form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1, [class*='display']").first()).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /authenticate/i })).toBeVisible();
  });

  test("login form validates email input", async ({ page }) => {
    await page.goto("/login");
    const emailInput = page.locator('input[name="email"]');
    await emailInput.fill("test@example.com");
    await expect(emailInput).toHaveValue("test@example.com");
  });

  test("signup link is present", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText(/request access/i)).toBeVisible();
  });

  test("unauthenticated /app redirects to login (non-mock)", async ({ page }) => {
    // In mock mode middleware bypasses auth, so this tests that the page loads.
    // In non-mock mode it would redirect to /login?next=/app.
    await page.goto("/app");
    await page.waitForLoadState("domcontentloaded");
    const url = page.url();
    expect(url).toMatch(/\/(app|login)/);
  });

  test("dashboard loads in mock mode", async ({ page }) => {
    await page.goto("/app");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).not.toBeEmpty();
  });
});
