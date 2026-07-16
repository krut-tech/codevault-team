import { test, expect } from "../fixtures/auth";

const parentFolder = { id: "20000000-0000-4000-8000-000000000001", name: "Parent", parent_folder_id: null, is_deleted: false };
const childFolder = { id: "20000000-0000-4000-8000-000000000002", name: "Child", parent_folder_id: parentFolder.id, is_deleted: false };
const nestedFile = { id: "30000000-0000-4000-8000-000000000001", name: "nested.py", folder_id: childFolder.id, is_deleted: false };

test.describe("Folder delete cascades to descendants (regression: Finding #6)", () => {
  test("deleting a parent folder marks nested subfolders and files deleted too, not just the parent", async ({
    page,
  }) => {
    const patchedIds: { folders: Set<string>; files: Set<string> } = { folders: new Set(), files: new Set() };

    await page.route("**/rest/v1/folders*", async (route) => {
      const method = route.request().method();
      if (method === "GET") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([parentFolder, childFolder]),
        });
      }
      if (method === "PATCH") {
        const url = new URL(route.request().url());
        const idFilter = url.searchParams.get("id");
        for (const id of [parentFolder.id, childFolder.id]) {
          if (idFilter?.includes(id)) patchedIds.folders.add(id);
        }
        return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
      }
      return route.continue();
    });

    await page.route("**/rest/v1/files*", async (route) => {
      const method = route.request().method();
      if (method === "GET") {
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([nestedFile]) });
      }
      if (method === "PATCH") {
        const url = new URL(route.request().url());
        const idFilter = url.searchParams.get("id") ?? url.searchParams.get("folder_id");
        if (idFilter?.includes(nestedFile.id) || idFilter?.includes(childFolder.id)) {
          patchedIds.files.add(nestedFile.id);
        }
        return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
      }
      return route.continue();
    });

    await page.goto(`/folders/${parentFolder.id}`);
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: /delete folder/i }).click();

    // Both the child folder AND the file nested inside it must be part of
    // the delete cascade — before the fix, only parentFolder.id was ever
    // sent, leaving these two rows orphaned (is_deleted: false forever).
    await expect.poll(() => patchedIds.folders.has(childFolder.id)).toBe(true);
    await expect.poll(() => patchedIds.files.has(nestedFile.id)).toBe(true);
  });
});
