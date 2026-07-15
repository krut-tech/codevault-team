# Test Report

## What was actually run and verified in this build
| Check | Command | Result |
|---|---|---|
| TypeScript strict typecheck | `npx tsc -b` | ✅ 0 errors |
| Production build | `npm run build` (`vite build`) | ✅ succeeds, ~964 KB total `dist/` output, largest single JS chunk ~110 KB gzipped |
| Dependency install | `npm install` | ✅ clean install, 2 pre-existing low/moderate `npm audit` advisories in transitive deps (no direct fix available at time of writing — re-run `npm audit` before shipping) |

This was re-verified after every feature added in this pass, not just once at the start.

## What was NOT run (and why)
There is **no automated test suite** (unit/integration/e2e) in this project yet — that's a real gap, stated plainly rather than implied. Also not run: live queries against a real Supabase project (this sandbox has no live Supabase credentials), and a live Vercel deployment. The sections below give you a concrete script to close both gaps yourself in a few minutes.

## Manual QA checklist (run this after your first deploy)
- [ ] Sign in as each of the 4 seeded users
- [ ] Create a language, confirm it appears instantly in a second browser tab logged in as another user (realtime)
- [ ] Create a folder, rename it, tag it, add it to a collection, delete it, restore it from Recycle Bin
- [ ] Upload a single file, a multi-file selection, an entire folder (webkitdirectory), and a `.zip` — confirm the ZIP's internal structure is recreated as nested folders
- [ ] Open a code file in the Editor, edit it, wait 2s for autosave, refresh, confirm the change persisted; check Version History shows the prior version
- [ ] Preview an image, a PDF, and a code file — confirm inline rendering; preview an unsupported type (e.g. `.exe`) — confirm the "download to view" fallback
- [ ] Star a folder and a file, confirm they show on the Favorites page and the Dashboard
- [ ] Leave a comment on a file and on a folder, confirm the other logged-in user sees it appear without refreshing
- [ ] Trigger a notification (upload as User A) and confirm User B's bell badge updates live
- [ ] As a non-admin, confirm `/admin/users`, `/admin/logs`, `/admin/settings` all redirect away
- [ ] As an admin, change a user's role, confirm they gain/lose Admin sidebar access on their next load
- [ ] Resize the browser to a phone width — confirm the sidebar collapses to a hamburger drawer and the layout doesn't break
- [ ] Run through the app with keyboard-only navigation (Tab / Enter / Escape) at least once

## RLS verification script
Run in the Supabase SQL Editor **as different authenticated roles** (use `set local role` or test via the app with two different logged-in accounts, which is more realistic):
```sql
-- Confirm RLS is enabled everywhere (should return 0 rows)
select relname
from pg_class
join pg_namespace on pg_namespace.oid = pg_class.relnamespace
where pg_namespace.nspname = 'public' and relkind = 'r' and not relrowsecurity;

-- As a non-admin user, this should return 0 rows (no access):
select * from activity_logs;

-- As a non-admin user, this should fail or return 0 rows:
update settings set value = '"hacked"' where key = 'site_name';

-- As any authenticated user, this should succeed:
insert into languages (name, color) values ('Test Lang', '#000000');
```

## Known limitations to track
- No automated tests (unit/integration/e2e) — recommended next step: Vitest + React Testing Library for hooks/components, Playwright for the critical CRUD/upload/realtime flows.
- Bundle size is reasonable but not minimal — `lucide-react` and `framer-motion` are the two largest third-party contributors; tree-shaking is already in effect via ESM imports, further gains would need per-icon imports.
- Large folders (thousands of items) are not virtualized — fine at current team scale.
