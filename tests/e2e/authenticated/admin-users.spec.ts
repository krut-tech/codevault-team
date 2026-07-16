import { test, expect, fakeUser } from "../fixtures/auth";

const teammate = {
  id: "00000000-0000-4000-8000-000000000002",
  email: "het@team.test",
  full_name: "Het (Test)",
  avatar_url: null,
  role: "user",
  created_at: new Date().toISOString(),
};

test.describe("Admin > User Management (regression: Findings #2 and #3)", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/rest/v1/users*", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([fakeUser, teammate]) })
    );
  });

  test("clicking remove shows a confirmation dialog before calling the edge function", async ({ page }) => {
    let edgeFunctionCalled = false;
    await page.route("**/functions/v1/remove-team-member", (route) => {
      edgeFunctionCalled = true;
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
    });

    // Auto-dismiss (Cancel) the confirm() dialog the first time.
    page.once("dialog", (dialog) => dialog.dismiss());

    await page.goto("/admin/users");
    await page.getByRole("button", { name: `Remove ${teammate.full_name}` }).click();

    // Cancelling the confirmation must NOT call the backend at all.
    expect(edgeFunctionCalled).toBe(false);
  });

  test("confirming calls the remove-team-member edge function (not a raw table delete) and shows success feedback", async ({
    page,
  }) => {
    let edgeFunctionCalled = false;
    await page.route("**/functions/v1/remove-team-member", (route) => {
      edgeFunctionCalled = true;
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
    });

    page.once("dialog", (dialog) => dialog.accept());

    await page.goto("/admin/users");
    await page.getByRole("button", { name: `Remove ${teammate.full_name}` }).click();

    await expect.poll(() => edgeFunctionCalled).toBe(true);
    await expect(page.getByText(new RegExp(`${teammate.full_name} removed`, "i"))).toBeVisible();
  });

  test("a failed removal (e.g. still-referenced content) surfaces an error toast instead of failing silently", async ({
    page,
  }) => {
    await page.route("**/functions/v1/remove-team-member", (route) =>
      route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "unexpected failure" }) })
    );
    page.once("dialog", (dialog) => dialog.accept());

    await page.goto("/admin/users");
    await page.getByRole("button", { name: `Remove ${teammate.full_name}` }).click();

    await expect(page.getByText(new RegExp(`Failed to remove ${teammate.full_name}`, "i"))).toBeVisible();
  });

  test("an admin cannot remove their own account (button disabled)", async ({ page }) => {
    await page.goto("/admin/users");
    await expect(page.getByRole("button", { name: `Remove ${fakeUser.full_name}` })).toBeDisabled();
  });
});
