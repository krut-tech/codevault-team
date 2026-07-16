import { test, expect } from "../fixtures/auth";

const fakeFile = {
  id: "10000000-0000-4000-8000-000000000001",
  name: "app.ts",
  folder_id: null,
  storage_path: "root/app.ts",
  content: "console.log('hello')",
  created_by: "00000000-0000-4000-8000-000000000001",
  is_deleted: false,
  updated_at: new Date().toISOString(),
};

test.describe("Editor page (regression: Findings #9, #11, #13, #14)", () => {
  test.beforeEach(async ({ page }) => {
    await page.route(`**/rest/v1/files?id=eq.${fakeFile.id}*`, (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([fakeFile]) })
    );
    await page.route("**/rest/v1/versions*", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) })
    );
  });

  test("Download button actually triggers a file download (was a dead button with no onClick)", async ({ page }) => {
    await page.route(`**/storage/v1/object/*${fakeFile.storage_path}*`, (route) =>
      route.fulfill({ status: 200, contentType: "text/plain", body: fakeFile.content })
    );

    await page.goto(`/editor/${fakeFile.id}`);
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /^download$/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe(fakeFile.name);
  });

  test("editing then closing the tab with unsaved changes triggers the browser's unsaved-changes prompt", async ({
    page,
  }) => {
    await page.goto(`/editor/${fakeFile.id}`);
    let beforeUnloadFired = false;
    await page.exposeFunction("__reportBeforeUnload", () => {
      beforeUnloadFired = true;
    });
    await page.evaluate(() => {
      window.addEventListener("beforeunload", () => {
        (window as unknown as { __reportBeforeUnload: () => void }).__reportBeforeUnload();
      });
    });

    // Simulate a dirty edit by focusing the Monaco editor and typing.
    await page.locator(".monaco-editor textarea").first().click();
    await page.keyboard.type("// unsaved edit");

    await page.evaluate(() => window.dispatchEvent(new Event("beforeunload")));
    await expect.poll(() => beforeUnloadFired).toBe(true);
  });
});
