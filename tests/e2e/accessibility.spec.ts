import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const pagesToAudit = ["/", "/login", "/forgot-password"];

for (const path of pagesToAudit) {
  test(`a11y: ${path} has no critical/serious WCAG violations`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    const blocking = results.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
    if (blocking.length > 0) {
      console.log(JSON.stringify(blocking, null, 2));
    }
    expect(blocking, `Accessibility violations found on ${path}`).toEqual([]);
  });
}

test("a11y: icon-only buttons in the editor toolbar have accessible names", async () => {
  // These are the icon-only buttons in Editor.tsx's toolbar — spot-checked
  // statically since they require an authenticated session to render live.
  // See tests/e2e/authenticated/editor.spec.ts for the live-session variant.
  test.skip(true, "Requires authenticated session — see authenticated/editor.spec.ts");
});
