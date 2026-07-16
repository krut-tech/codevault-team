import { test, expect } from "../fixtures/auth";

test.describe("Authenticated navigation", () => {
  test("a session in storage grants access to /dashboard without redirect to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("every sidebar link resolves to a real, non-blank route (regression: dead /settings link, Finding #8)", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    const sidebarLinks = await page.locator("aside nav a[href^='/']").evaluateAll((els) =>
      els.map((el) => (el as HTMLAnchorElement).getAttribute("href"))
    );

    expect(sidebarLinks.length).toBeGreaterThan(0);
    expect(sidebarLinks).not.toContain("/settings");

    for (const href of sidebarLinks) {
      if (!href) continue;
      await page.goto(href);
      // A route that doesn't exist renders nothing under <Routes> before the
      // 404 catch-all fix — assert we always get *some* visible content.
      const bodyText = await page.locator("body").innerText();
      expect(bodyText.trim().length, `Route ${href} rendered blank`).toBeGreaterThan(0);
    }
  });

  test("admin nav section is visible for an admin user", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("link", { name: /users/i })).toBeVisible();
  });
});
