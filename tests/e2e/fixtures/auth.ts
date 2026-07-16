/* oxlint-disable react-hooks/rules-of-hooks -- Playwright fixture `use` callback, not a React hook */
import { test as base, type Page } from "@playwright/test";

const FAKE_USER_ID = "00000000-0000-4000-8000-000000000001";
const SUPABASE_PROJECT_REF = "nxysloupgslhnckseavp"; // matches .env.example

export const fakeUser = {
  id: FAKE_USER_ID,
  email: "krut@team.test",
  full_name: "Krut (Test)",
  avatar_url: null,
  role: "admin" as const,
  created_at: new Date().toISOString(),
};

/**
 * Seeds localStorage with a Supabase-shaped session BEFORE any app script
 * runs, so ProtectedRoute's hydrate() sees an authenticated user without a
 * real network round-trip to /auth/v1/token. Combine with mockSupabaseRest
 * to intercept the subsequent `/rest/v1/users` profile lookup.
 */
export async function seedFakeSession(page: Page) {
  const storageKey = `sb-${SUPABASE_PROJECT_REF}-auth-token`;
  const fakeSession = {
    access_token: "fake-access-token",
    refresh_token: "fake-refresh-token",
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: "bearer",
    user: { id: FAKE_USER_ID, email: fakeUser.email },
  };
  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(key as string, value as string),
    [storageKey, JSON.stringify(fakeSession)]
  );
}

/** Intercepts the core REST endpoints so authenticated pages render deterministically offline. */
export async function mockSupabaseRest(page: Page) {
  await page.route("**/auth/v1/user*", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(fakeUser) })
  );
  await page.route("**/rest/v1/users*", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([fakeUser]) })
  );
  await page.route("**/rest/v1/folders*", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) })
  );
  await page.route("**/rest/v1/files*", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) })
  );
  await page.route("**/rest/v1/notifications*", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) })
  );
  await page.route("**/realtime/v1/**", (route) => route.abort());
}

export const test = base.extend({
  page: async ({ page }, use) => {
    await seedFakeSession(page);
    await mockSupabaseRest(page);
    await use(page);
  },
});

export { expect } from "@playwright/test";
