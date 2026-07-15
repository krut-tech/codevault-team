# Deployment Guide (Overview)

CodeVault Team is a static SPA (Vite build output) backed entirely by Supabase — there is no custom backend server to deploy.

## Deployment topology
```
┌─────────────────┐        ┌───────────────────────┐
│  Vercel (static)│──────▶│  Supabase              │
│  dist/ build     │  HTTPS │  - Postgres (RLS)      │
│  (this repo)     │◀──────│  - Auth                │
└─────────────────┘        │  - Storage             │
                            │  - Realtime            │
                            │  - Edge Functions      │
                            └───────────────────────┘
```

## Steps, in order
1. **Supabase first** — see `SUPABASE_SETUP.md`. You need the project URL + anon key before the frontend can run.
2. **Frontend hosting** — see `VERCEL_DEPLOYMENT.md`. Vercel is what `vercel.json` is tuned for, but any static host that supports SPA rewrites works the same way (Netlify, Cloudflare Pages, GitHub Pages with a rewrite plugin, etc.) — just set the same two env vars and the same rewrite-to-`index.html` rule.
3. **Scheduled jobs** — deploy `supabase/functions/purge-recycle-bin` and put it on a daily cron (see `SUPABASE_SETUP.md` step 7).

## Environments
Recommended to run two Supabase projects: `codevault-team-dev` and `codevault-team-prod`, each with its own `.env`/Vercel environment variables, so schema experiments never touch real team data.

## Rollbacks
Vercel keeps every deployment; use **Instant Rollback** in the dashboard to point production traffic at any previous build with zero downtime. Database migrations are additive-only in this schema (no destructive migrations shipped), so rolling back the frontend alone is safe.

## Monitoring
- Supabase Dashboard → Logs (Postgres, Auth, Storage, Realtime, Edge Functions) for backend issues.
- Vercel Dashboard → Deployments → Function/Build logs for frontend build issues.
- `Admin → Activity Logs` inside the app itself for user-facing audit trail.
