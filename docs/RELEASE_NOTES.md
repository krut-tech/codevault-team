# Release Notes

## v0.3.0 — Production Readiness Pass (current)
**Fixed**
- Notifications table was never populated — folder/file create/delete/upload now fan out realtime notifications to the team.
- File rename was missing (folders only before).
- Recycle Bin file restore button was permanently disabled.
- Dashboard "Languages" and "Storage Used" widgets were static placeholders — now live.
- Favorites panel on Dashboard was a stub — now shows real pinned items.

**Added**
- Whole-folder upload (`webkitdirectory`) preserving relative folder structure — previously only flat multi-file and ZIP upload existed.
- File tagging (previously folder-only), via a shared `TagPicker`.
- Remove-from-collection UI.
- Folder-level comments (previously file-only).
- Real `Projects` CRUD page (the `projects` table existed in the schema but had no UI).
- Real `Admin → System Settings` page tied to the `settings` table (vault name, recycle-bin retention).
- Recycle Bin auto-purge Supabase Edge Function (`supabase/functions/purge-recycle-bin`).
- `vercel.json` for one-command Vercel deploys.
- Full mobile responsiveness — sidebar becomes a slide-over drawer under `md`, topbar adapts.
- `aria-label`s across all icon-only buttons; preview modal has proper dialog semantics.
- Full documentation set (this file, plus Installation/Deployment/Supabase/Vercel guides, User/Admin manuals, ER diagram, API docs, project structure, test report).

**Performance**
- Route-level code splitting for Editor, FolderBrowser, Collections, CollectionDetail, Snippets, Projects — largest chunk dropped from ~850 KB to ~110 KB gzipped.

## v0.2.0 — Core Feature Build
- `AppLayout` (shared sidebar + topbar with live search and notification bell)
- `Languages` CRUD with realtime
- `FolderBrowser` — unlimited nesting, breadcrumbs, drag-and-drop upload, ZIP auto-extraction, per-item context menu, realtime
- `Editor` — Monaco, autosave + manual save, version history, fullscreen, theme toggle
- `Search`, `Notifications`, `RecycleBin`, `Profile`, `ForgotPassword`/`ResetPassword`
- `AdminUsers` + `AdminActivityLogs`
- Zustand `authStore` + `ProtectedRoute`/`AdminRoute` guards
- `logActivity()` wired into every mutation

## v0.1.0 — Foundation
- Vite + React 19 + TypeScript + Tailwind scaffold
- Design tokens (light/dark HSL variables), core UI kit (Button, Card, Badge, Input)
- Landing, Login, Dashboard pages
- Full Supabase schema: 15 initial tables, RLS, indexes, Storage bucket, Realtime publication

---
_Versioning here is descriptive (tracks feature milestones in this build process), not a published semver history — treat it as a changelog, not a package registry version._
