import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test("loads and shows the primary CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i }).first()).toBeVisible();
  });

  test("Sign In navigates to /login via client-side routing (no full reload)", async ({ page }) => {
    await page.goto("/");
    // Tag a marker on window; if it survives the click, routing was client-side.
    await page.evaluate(() => ((window as unknown as Record<string, unknown>).__navMarker = true));
    await page.getByRole("button", { name: /sign in/i }).first().click();
    await expect(page).toHaveURL(/\/login$/);
    const markerSurvived = await page.evaluate(
      () => (window as unknown as Record<string, unknown>).__navMarker === true
    );
    expect(markerSurvived).toBe(true);
  });
});

test.describe("Login page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("requires email and password before submit (HTML5 validation)", async ({ page }) => {
    const emailInput = page.locator('input[type="email"]');
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(emailInput).toHaveJSProperty("validity.valid", false);
  });

  test('"Forgot password?" is a real client-side link, not a dead/reloading anchor', async ({ page }) => {
    const link = page.getByRole("link", { name: /forgot password/i });
    await expect(link).toHaveAttribute("href", "/forgot-password");
    await page.evaluate(() => ((window as unknown as Record<string, unknown>).__navMarker = true));
    await link.click();
    await expect(page).toHaveURL(/\/forgot-password$/);
    const markerSurvived = await page.evaluate(
      () => (window as unknown as Record<string, unknown>).__navMarker === true
    );
    // Regression guard for Finding #10: this used to be a raw <a href> that
    // forced a full page reload, losing all client-side app state.
    expect(markerSurvived).toBe(true);
  });

  test('"Remember me" checkbox is interactive and defaults to checked', async ({ page }) => {
    const checkbox = page.getByRole("checkbox", { name: /remember me/i });
    await expect(checkbox).toBeChecked();
    await checkbox.uncheck();
    await expect(checkbox).not.toBeChecked();
  });

  test("shows the auth provider's error message on invalid credentials", async ({ page }) => {
    await page.route("**/auth/v1/token*", (route) =>
      route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ error: "invalid_grant", error_description: "Invalid login credentials" }),
      })
    );
    await page.locator('input[type="email"]').fill("nobody@example.com");
    await page.locator('input[type="password"]').fill("wrong-password");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/invalid login credentials/i)).toBeVisible();
  });
});

test.describe("Unmatched routes (Finding #7)", () => {
  test("shows a real 404 page instead of a blank screen", async ({ page }) => {
    await page.goto("/this-route-does-not-exist");
    await expect(page.getByText(/page not found/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /back to dashboard/i })).toBeVisible();
  });
});

test.describe("Responsive layout", () => {
  const viewports = [
    { name: "mobile", width: 375, height: 812 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "desktop", width: 1440, height: 900 },
  ];

  for (const vp of viewports) {
    test(`Landing page renders without horizontal overflow at ${vp.name} (${vp.width}px)`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");
      const hasHorizontalScroll = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
      );
      expect(hasHorizontalScroll).toBe(false);
    });
  }

  test("Login form is usable at mobile width", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/login");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });
});
