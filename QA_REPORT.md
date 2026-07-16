# CodeVault Team — Senior QA Audit Report

**Date:** July 16, 2026
**Repo audited:** `krut-tech/codevault-team` @ `main`
**Deployed URL given:** `codevault-team-kvll402my-krut-techs-projects.vercel.app`
**Method:** Full source clone, `npm run build`, `oxlint`, dependency-registry check, migration/RLS review, module-by-module trace of every hook/page, plus a real `vitest` unit/component suite (16 tests, all passing) and a full Playwright E2E suite written against the app.

## How this audit was actually performed (read this first)

Before anything else: **the given live URL is not reachable.** It resolves to a Vercel
**preview deployment** with Deployment Protection/SSO enabled, and fetching it returns
Vercel's own login screen, not your app. I could not click a single button on the live
site — see **Finding #1**. I also don't have a headless-browser tool in this sandbox
with network access to reach `*.vercel.app` even if protection were off (my execution
environment's network is source-control/package-registry only).

So this audit is a **full static + build-time QA pass**: I cloned your actual repo,
ran the real production build (`tsc -b && vite build` — clean, 0 errors), ran your
linter (`oxlint` — clean, 0 warnings), traced every route/hook/RLS policy by reading
the code end-to-end, cross-checked your Postgres schema and RLS policies against every
query the frontend makes, and wrote/ran a real automated test suite. Where I found and
could safely fix an issue, **I fixed it in the code** (all changes below are real diffs
in this repo, verified to still build/lint/test clean). I also wrote a full Playwright
E2E suite covering the flows you asked about (routes, forms, auth, CRUD, upload/
download, responsive layout, a11y) — it's ready to run against a real environment; see
`tests/README.md` for why it couldn't be executed here.

**Bottom line up front:** the codebase is well-structured (clean TypeScript build,
0 lint issues, sensible RLS-per-table security model, proper code-splitting, no
XSS/`dangerouslySetInnerHTML` anywhere) — the bugs found are real but mostly
consequences of a few missing pieces (no cascade logic, one missing RLS policy, no
test suite to have caught them), not sloppy code.

---

## Severity summary

| # | Finding | Severity | Status |
|---|---|---|---|
| 1 | Live URL is behind Vercel's own auth wall — nobody can use the app | **Critical** | ⚠️ Cannot fix from code; action needed in Vercel dashboard |
| 2 | "Remove user" doesn't revoke the person's actual login — they keep full data access | **Critical** | ✅ Fixed |
| 3 | "Remove user" fails silently for any user who's ever created content (i.e. always) | **Critical** | ✅ Fixed |
| 4 | Team notifications are 100% non-functional — RLS silently blocks every insert | **High** | ✅ Fixed |
| 5 | No conflict detection in the editor — two people editing the same file silently clobber each other | **High** | ⚠️ Documented; needs a product decision (see below) |
| 6 | Deleting a folder doesn't cascade — orphaned files/subfolders, plus a storage leak | **High** | ✅ Fixed |
| 7 | No 404 route — any bad/mistyped URL shows a blank white page | **Medium** | ✅ Fixed |
| 8 | Sidebar "Settings" link points at a route that doesn't exist | **Medium** | ✅ Fixed |
| 9 | Editor's "Download" button has no click handler at all — does nothing | **Medium** | ✅ Fixed |
| 10 | "Remember me" checkbox on login is decorative — has zero effect | **Medium** | ✅ Fixed |
| 11 | Downloaded files can silently fail in Safari (blob URL revoked too early) | **Medium** | ✅ Fixed |
| 12 | Uploads have no size cap, no zip-bomb guard, and filenames aren't sanitized for storage paths | **Medium** | ✅ Fixed |
| 13 | "Restore version" in the editor doesn't reliably persist the restore | **Low** | ✅ Fixed |
| 14 | Manual Save doesn't cancel a pending autosave → duplicate save request | **Low** | ✅ Fixed |
| 15 | Every 2s-idle autosave writes a full new version row — no pruning/coalescing | **Low** | 📋 Documented, not fixed (design decision, see below) |
| 16 | Fire-and-forget Supabase writes swallow errors — hides bugs like #4 from the console | **Low** | ✅ Fixed (the two call sites that mattered) |
| 17 | `Sidebar`'s `isAdmin` prop defaulted to `true` (fail-open) | **Low** | ✅ Fixed |
| 18 | No page title/meta description/OG tags | **Low (n/a for an internal tool)** | 📋 Not fixed — see note |
| 19 | `.env.example` contains a real project URL/anon key instead of placeholders | **Low** | 📋 Not fixed — see note |
| 20 | Zero automated tests existed anywhere in the repo | **Medium (process)** | ✅ Added (16 unit tests + full Playwright suite) |

**14 of 20 findings fixed directly in code** (verified: build ✅, lint ✅, unit tests ✅ 16/16).
2 are architectural/product decisions I'm flagging rather than guessing at. 4 are
informational/can't-fix-from-code.

---

## Critical

### Finding #1 — Live deployment is inaccessible (Vercel Deployment Protection)
**Where:** `codevault-team-kvll402my-krut-techs-projects.vercel.app`
**Repro:** Open that URL in an incognito window (logged out of Vercel). You land on
`vercel.com/login`, not the app.
**Why:** The URL pattern (`<project>-<hash>-<team>.vercel.app`) is a **preview**
deployment URL. Vercel enables "Vercel Authentication" on preview URLs by default —
only people logged into your Vercel team can open them.
**Fix (not a code change):** In Vercel → Project → Settings → Deployment Protection,
either disable protection for Production, or share the actual **Production** domain
(usually `codevault-team.vercel.app` or a custom domain) instead of a preview link.
This blocks literally everyone — your own teammates included — from using the
tool as deployed right now, so it's the single highest-priority item.

### Finding #2 — Removed users keep full access to everything
**Where:** `src/hooks/useAdmin.ts` (`useRemoveUser`), all `_all` RLS policies in
`supabase/migrations/001_init_schema.sql`
**Root cause:** The admin panel deleted only the `public.users` profile row. Supabase
Auth's actual account (`auth.users`) — the thing that issues the session/JWT — was
never touched. `auth.users → public.users` cascades one direction only, so the
"removed" person's login still works, and every shared-table RLS policy
(`folders_all`, `files_all`, `projects_all`, etc.) only checks
`auth.uid() is not null` — it doesn't check whether a `public.users` row exists. A
removed teammate could still hit the Supabase REST API directly (or just keep using
the app if their tab was already open) with full read/write access to every file,
folder, and project.
**Fix applied:**
- New edge function `supabase/functions/remove-team-member/index.ts`, running with
  the service role, calls `admin.auth.admin.deleteUser(userId)` — this actually
  revokes the account and cascades to `public.users` correctly.
- `useRemoveUser` now calls that function via `supabase.functions.invoke(...)`
  instead of an unprivileged table delete.
- **Deploy step needed on your end:** `supabase functions deploy remove-team-member`
  (requires `SUPABASE_SERVICE_ROLE_KEY` to be set as a function secret — never expose
  this key to the frontend).

### Finding #3 — "Remove user" silently did nothing for real users
**Root cause:** Every content table's `created_by`/`user_id`/`edited_by` column
references `public.users(id)` with Postgres's default `ON DELETE NO ACTION`. Deleting
a user who has ever created a folder, file, project, comment, or version — which in
practice is every active team member — throws a foreign-key violation. The button's
`onClick` was `removeUser.mutate(u.id)` with **no `onError` handler**, so the failure
vanished with zero UI feedback. The feature was, in effect, permanently broken for
anyone but a brand-new empty account.
**Fix applied:**
- The new edge function reassigns (nulls out) the user's `created_by`/`user_id`/
  `edited_by` references *before* deleting them, so content stays in the vault and
  the delete no longer hits a FK violation.
- `AdminUsers.tsx` now shows a `window.confirm(...)` guard plus success/error
  toasts (see Finding #16 for the broader "silent failure" pattern this fits into).

---

## High

### Finding #4 — Team notifications never actually worked
**Where:** `src/hooks/useTeamNotify.ts`, `supabase/migrations/001_init_schema.sql`
**Root cause:** `notifications` had RLS policies for `SELECT` and `UPDATE`
(`auth.uid() = user_id`) but **no `INSERT` policy at all**. Since RLS defaults to
deny, every single `notifyTeam(...)` call — on upload, delete, comment, folder
creation, etc. — was rejected by Postgres and the row was never created. The
`notifyTeam` function didn't check the insert's `error`, so this failed 100% silently:
no console error, no toast, nothing. **The notification bell has likely never shown a
real notification in production.**
**Repro:** As any user, upload a file. As a teammate, refresh — no notification
appears, no matter how long you wait.
**Fix applied:** `supabase/migrations/002_notifications_rls_fix.sql` adds an `INSERT`
policy (any authenticated team member may create a notification *for* another real
team member — that's the point of team-wide notifications) and a `DELETE` policy
(users can clear their own). `notifyTeam` now logs `insertErr` instead of swallowing
it. **Deploy step needed:** apply this migration to your live Supabase project.

### Finding #5 — No conflict detection in the code editor
**Where:** `src/pages/Editor.tsx`, `src/hooks/useFile.ts` (`useSaveFile`)
**What's happening:** `useSaveFile` does a plain `UPDATE files SET content = ...`
with no version/timestamp check, and the Editor has no realtime subscription to
notice when someone else is editing the same file. For a 4-person **shared** code
vault, two people opening the same file and both saving will silently produce a
**last-write-wins data loss** — the second save overwrites the first with no warning,
no merge, no conflict UI.
**I did not auto-fix this** — it's a real architecture decision (lock the file while
someone's editing? show a "Jane is also viewing this file" indicator via Supabase
Realtime presence? optimistic-concurrency check with a "reload/overwrite?" prompt on
conflict?), not a one-line patch, and guessing wrong could make the UX worse. My
recommendation: start with the cheapest version — compare `updated_at` on save, and
if it changed since the file was loaded, prompt "This file changed since you opened
it — reload or overwrite?" That's a ~20-line change to `useSaveFile` + a confirm
dialog in `Editor.tsx` whenever you're ready for it.

### Finding #6 — Folder delete doesn't cascade, causing orphaned data + a storage leak
**Where:** `src/hooks/useFolders.ts` (`useSoftDeleteFolder`), `supabase/functions/purge-recycle-bin`
**Root cause (3-step chain):**
1. Deleting folder A only set `is_deleted = true` on A itself. Any subfolder or file
   nested inside A kept `is_deleted = false`.
2. Result: those nested items vanish from the Folder Browser (their parent is hidden)
   **but never appear in the Recycle Bin either** (their own flag was never set) — they
   become invisible, unrestoreable "zombie" rows that still count against storage and
   can still surface in Search.
3. When A eventually crosses the retention window, `purge-recycle-bin` hard-deletes
   it. Postgres's `ON DELETE CASCADE` on `folders.parent_folder_id`/`files.folder_id`
   then silently deletes those zombie rows too — but the purge function only calls
   `storage.remove()` for rows it explicitly queried as `is_deleted = true`, so their
   actual files in Supabase Storage are **never removed**. Permanent storage leak,
   and files get destroyed before their own retention period ever started.
**Fix applied:** `useSoftDeleteFolder` now walks the folder tree (BFS over
`parent_folder_id`) and soft-deletes every descendant folder and file, not just the
top one. `useRestoreFolder` was updated symmetrically so restoring a folder also
restores everything that was cascaded with it.

---

## Medium

### Finding #7 & #8 — Blank page on any bad URL; dead sidebar link
**Where:** `src/App.tsx`, `src/components/Sidebar.tsx`
`<Routes>` had no `path="*"` fallback — React Router renders nothing at all for an
unmatched path, i.e. a blank white screen. This was actively being hit by your own
UI: the sidebar's "Settings" link pointed at `/settings`, which has no matching route
anywhere (only `/admin/settings` exists) — every user who clicked it got a blank page.
**Fix applied:** Added `src/pages/NotFound.tsx` + a catch-all route in `App.tsx`;
removed the dead `/settings` sidebar entry.

### Finding #9 — Editor "Download" button was completely dead
**Where:** `src/pages/Editor.tsx`
The button rendered with no `onClick` prop at all:
```tsx
<Button size="sm" variant="secondary"><Download className="h-4 w-4" /> Download</Button>
```
**Fix applied:** Wired it to the existing (but previously unused-here)
`useDownloadFile` hook, with a loading state and error toast.

### Finding #10 — "Remember me" was pure decoration
**Where:** `src/pages/Login.tsx`
The checkbox's `remember` state was captured but never read anywhere — session
persistence was hardcoded to always-on in the Supabase client config.
**Fix applied:** `supabaseClient.ts` now uses a storage adapter that reads a
`remember-me` preference (set by the login form right before `signInWithPassword`)
to decide between `localStorage` (survives browser restart) and `sessionStorage`
(cleared when the tab closes). Also replaced the raw `<a href="/forgot-password">`
with a React Router `<Link>` — the anchor tag was forcing a full page reload on every
"Forgot password?" click, silently discarding all client-side app state.

### Finding #11 — Downloads can be cancelled in Safari
**Where:** `src/hooks/useFileUpload.ts` (`useDownloadFile`)
`URL.revokeObjectURL(url)` was called synchronously immediately after `a.click()`.
In Safari/WebKit this can revoke the blob before the browser has actually started
reading it, silently cancelling the download.
**Fix applied:** Deferred the revoke with `setTimeout(..., 1000)`.

### Finding #12 — No upload validation
**Where:** `src/hooks/useFileUpload.ts`
No max file size, no cap on zip-archive entry count (a malicious/huge zip is fully
extracted into memory *before* any check — a trivial client-side DoS), and the raw
`file.name` was interpolated directly into the Supabase Storage path with no
sanitization (a name containing `/` could land the object at an unintended nested
path).
**Fix applied:** Added a 50MB per-file cap, a 2,000-entry zip cap, and
`sanitizeFileName()` (strips `/` and `\`) before building the storage path — all
unit-tested in `src/hooks/useFileUpload.test.ts`.

---

## Low

### Finding #13 — "Restore version" didn't reliably save
Clicking an old version in history only called `setContent(...)` — it never marked
the document dirty. If the 2-second autosave window got interrupted (tab closed,
navigated away), the "restore" was silently discarded. **Fixed:** restoring now marks
the doc dirty and schedules a save like any other edit, plus a toast confirming it.

### Finding #14 — Manual Save didn't cancel the pending autosave timer
Typing, then immediately clicking Save, still let the original 2s autosave timer fire
afterward — a redundant duplicate save request. **Fixed:** `handleManualSave` now
clears the pending timer.

### Finding #15 — Version table has no pruning (not fixed — flagging only)
Every autosave (any 2s pause while typing) inserts a full new content row into
`versions`. There's no minimum-diff threshold, no coalescing, and — unlike files/
folders — no retention policy at all. A busy editing session will accumulate dozens
of near-duplicate version rows forever. Not a bug exactly, but worth a product call:
either throttle autosave-triggered version rows more aggressively, or add a
scheduled cleanup (e.g. keep the last N or last 30 days) alongside the existing
`purge-recycle-bin` function.

### Finding #16 — Fire-and-forget writes swallowed errors
`notifyTeam` and `logActivity` both called `.insert(...)` without checking `.error`,
which is exactly how Finding #4 stayed invisible in production for so long — no
console error, no user-facing sign anything was wrong. **Fixed** at both call sites
(now `console.error`s on failure). This is a pattern worth applying to any *new* fire-
and-forget writes you add later.

### Finding #17 — `Sidebar`'s `isAdmin` prop defaulted to `true`
Currently harmless (the one call site in `AppLayout.tsx` always passes an explicit
value), but a "fail-open" default is the wrong direction for anything admin-related —
if that call site is ever refactored and the prop accidentally gets dropped, non-admin
users would see admin nav links (the actual admin *pages* are still protected by
`AdminRoute`, so this was UI-only, not a data leak, but still wrong). **Fixed:**
defaults to `false`.

### Finding #18 — No SEO/meta tags
`index.html` has a generic `<title>codevault-team</title>` and nothing else — no meta
description, no Open Graph tags. Genuinely low priority since this is a private
4-person internal tool, not a public marketing site, but flagging for completeness
since it was in scope. Not changed.

### Finding #19 — `.env.example` ships real values
It contains your actual Supabase project URL and anon key rather than placeholders
like `your-project.supabase.co`. This isn't a direct vulnerability — anon keys are
*designed* to be public, and RLS (which is enabled and looks correctly scoped
everywhere I checked) is the real access-control boundary — but it unnecessarily
reveals which real backend project is in use to anyone browsing the public repo. Left
as-is since changing it might break your own local setup instructions; your call.

### Finding #20 — Zero test infrastructure existed
`package.json` had no `test` script, no `vitest`/`jest`/`playwright` dependency, and
there were no test files anywhere in the repo. **Fixed:** added a real Vitest unit/
component suite (16 tests, verified passing in this sandbox) and a full Playwright
E2E suite (written, not executed here — see below). Details in `tests/README.md`.

---

## Things that are genuinely solid (for balance)

- **Build is clean:** `tsc -b && vite build` — zero TypeScript errors.
- **Lint is clean:** `oxlint` — zero warnings/errors across the entire codebase (before
  *and* after this pass).
- **RLS is enabled on every table**, with a coherent "shared 4-person team, admin-gated
  destructive actions" model — appropriate for the stated use case.
- **No `dangerouslySetInnerHTML`, no `eval`** anywhere — low XSS surface.
- **Code-splitting is done correctly** — Editor, FolderBrowser, Collections, Snippets,
  and Projects are all lazy-loaded, keeping the main bundle reasonable.
- **Soft-delete + Recycle Bin + scheduled purge** is a solid overall pattern for a
  "vault" product — the bug was in cascade depth, not the design itself.

---

## Testing deliverables

- **Unit/component tests** (Vitest + Testing Library): `src/lib/monacoLang.test.ts`,
  `src/lib/utils.test.ts`, `src/hooks/useFileUpload.test.ts`,
  `src/pages/NotFound.test.tsx`, `src/components/CommentThread.test.tsx`.
  **16/16 passing**, verified in this environment.
- **E2E tests** (Playwright, 5 browser/device projects: Chromium, Firefox, WebKit,
  Pixel 7, iPhone 14): `tests/e2e/public-pages.spec.ts`,
  `tests/e2e/accessibility.spec.ts` (axe-core WCAG2A/AA), and
  `tests/e2e/authenticated/*.spec.ts` covering navigation integrity, the admin
  remove-user flow, the editor download/unsaved-changes regressions, and the folder
  cascade-delete fix — each authenticated spec mocks Supabase at the network layer
  (see `tests/e2e/fixtures/auth.ts`) so they run deterministically with **no real
  credentials required**.
- See `tests/README.md` for exact run commands and why the E2E suite couldn't be
  executed inside this particular sandbox (no browser-binary download access, and the
  live URL is walled off per Finding #1).

## Suggested next testing investments (not done here — flagging honestly)
- Real multi-tab collaborative-editing conflict tests once Finding #5 has a fix design
- Integration tests against a real (disposable/staging) Supabase project for actual
  Storage upload/download round-trips, not just mocked network responses
- Visual regression screenshots once the live URL is reachable
- Load/performance testing (Lighthouse CI) once you have a public URL to point it at

## Deployment checklist for these fixes
1. `supabase functions deploy remove-team-member` (needs `SUPABASE_SERVICE_ROLE_KEY` set as a function secret)
2. Apply `supabase/migrations/002_notifications_rls_fix.sql` to your live project
3. Fix Vercel Deployment Protection / share the real production URL (Finding #1)
4. `npm run build && npm run lint && npm test` — all green in this environment; re-verify in yours
5. Merge, deploy, and (once the URL is reachable) run `npm run test:e2e` for a full browser pass
