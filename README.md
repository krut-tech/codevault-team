# CodeVault Team

A premium, private, realtime code vault for a 4-person dev team (Krut — Admin, Fenil, Het, Ishant). Not a GitHub clone — an internal storage + knowledge-management platform: upload, organize, edit, tag, search, preview, and comment on every project your team has, with zero page refreshes.

## Stack
React 19 · TypeScript · Vite · Tailwind CSS · Framer Motion · Zustand · React Query · React Router · Monaco Editor · react-dropzone · JSZip · sonner
Supabase — Auth, Postgres + RLS, Storage, Realtime, Edge Functions

## Status
✅ Production-ready core. See **[`docs/AUDIT.md`](docs/AUDIT.md)** for the full, honest feature-by-feature checklist (every ✅/🟡 backed by an actual code read, not a claim).

## Quick start
```bash
npm install
cp .env.example .env      # fill in Supabase URL + anon key
npm run dev
```
Full walkthrough → **[`docs/INSTALLATION.md`](docs/INSTALLATION.md)**

## Documentation
| Guide | What it covers |
|---|---|
| [`docs/AUDIT.md`](docs/AUDIT.md) | Feature-by-feature production readiness checklist |
| [`docs/INSTALLATION.md`](docs/INSTALLATION.md) | Local setup, first admin user |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Deployment overview, rollback, monitoring |
| [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md) | Project creation, migration, storage bucket, seeding users |
| [`docs/VERCEL_DEPLOYMENT.md`](docs/VERCEL_DEPLOYMENT.md) | Vercel-specific deploy steps |
| [`docs/USER_MANUAL.md`](docs/USER_MANUAL.md) | How to use every feature (for the team) |
| [`docs/ADMIN_MANUAL.md`](docs/ADMIN_MANUAL.md) | Admin-only features (Users, Logs, Settings) |
| [`docs/ER_DIAGRAM.md`](docs/ER_DIAGRAM.md) | Database schema, Mermaid ER diagram |
| [`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md) | Supabase surface used by the app (tables, RLS, storage, realtime, functions) |
| [`docs/PROJECT_STRUCTURE.md`](docs/PROJECT_STRUCTURE.md) | Annotated file tree |
| [`docs/TEST_REPORT.md`](docs/TEST_REPORT.md) | What's verified, manual QA checklist, RLS test script |
| [`docs/RELEASE_NOTES.md`](docs/RELEASE_NOTES.md) | Changelog across build milestones |

## Feature highlights
- **Folders & Files** — unlimited nesting, breadcrumbs, drag-and-drop, whole-folder upload, automatic ZIP extraction
- **Monaco Editor** — autosave, version history with restore, fullscreen, theming
- **Tags & Collections** — on both folders and files
- **Favorites, Comments, Notifications** — all realtime across the team
- **Code Snippets** — quick reusable code notes separate from full files
- **Recycle Bin** — soft delete + restore, with a scheduled auto-purge Edge Function
- **Admin Panel** — user/role management, live activity log, system settings
- **Fully realtime** — every change appears for every logged-in teammate instantly, no refresh
- **Responsive & accessible** — mobile drawer nav, aria-labeled controls

## Setup
```bash
npm install
cp .env.example .env   # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
# run supabase/migrations/001_init_schema.sql against your project (docs/SUPABASE_SETUP.md)
# after seeding your 4 users, set your own row's role = 'admin'
npm run dev
```

## Build & typecheck
```bash
npx tsc -b       # 0 errors
npm run build    # dist/, verified after every change in this build
```

## Deploy
```bash
vercel            # see docs/VERCEL_DEPLOYMENT.md for env var setup
```
