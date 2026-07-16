# CodeVault Team — Test Suite

Two layers of automated tests were added; neither existed before this QA pass (`package.json` had no `test` script and zero test files).

## 1. Unit / component tests (Vitest) — verified passing in this environment

```bash
npm install
npm run test        # one-shot
npm run test:watch  # watch mode
```

Current status: **16/16 passing** (`src/lib/monacoLang.test.ts`, `src/lib/utils.test.ts`,
`src/hooks/useFileUpload.test.ts`, `src/pages/NotFound.test.tsx`, `src/components/CommentThread.test.tsx`).
These run against real project code with no external services required.

## 2. End-to-end tests (Playwright) — written and ready to run, **not executed in this sandbox**

This QA environment has no outbound network access to download Playwright's browser
binaries or to reach your Vercel deployment, so these specs could not be executed here.
They're real, complete specs — run them locally or in CI:

```bash
npm install
npx playwright install --with-deps   # one-time browser download
npm run test:e2e            # headless, all 5 browser/device projects
npm run test:e2e:ui         # interactive UI mode, great for first run
```

By default `playwright.config.ts` builds the app and serves it locally
(`npm run build && npm run preview`), so `tests/e2e/public-pages.spec.ts` and
`tests/e2e/accessibility.spec.ts` run with **zero configuration** against your real
compiled app.

`tests/e2e/authenticated/*.spec.ts` seed a fake Supabase session into `localStorage`
and intercept `**/rest/v1/**`, `**/auth/v1/**`, `**/storage/v1/**`, and
`**/functions/v1/**` calls (see `tests/e2e/fixtures/auth.ts`), so they run fully
offline and deterministically — no real Supabase project or seeded test account
needed. This is what lets the admin-removal, folder-cascade-delete, and editor specs
exercise the exact regressions fixed in this pass without live credentials.

To point the suite at a **real** environment instead (e.g. staging), set:

```bash
BASE_URL=https://your-staging-url.vercel.app npm run test:e2e
```

(and make sure that URL's Vercel Deployment Protection is off — see QA report Finding #1).

### What's covered
- `public-pages.spec.ts` — landing page, login validation, client-side routing (no full reloads), 404 catch-all, responsive layout at 3 breakpoints
- `accessibility.spec.ts` — axe-core WCAG2A/AA scan on all public routes
- `authenticated/navigation.spec.ts` — every sidebar link resolves to real content (no blank-page dead links)
- `authenticated/admin-users.spec.ts` — remove-user confirmation dialog, success/error feedback, self-removal guard
- `authenticated/editor.spec.ts` — Download button actually downloads, unsaved-changes browser warning
- `authenticated/folders.spec.ts` — deleting a folder cascades to nested subfolders/files

### Not yet covered (documented gaps, not silently skipped)
Genuine multi-tab collaborative-editing conflict tests, real file-upload-to-Storage
integration tests, and cross-browser visual regression were out of scope for this
pass given time — see the "Suggested Next Testing Investments" section of the QA report.
