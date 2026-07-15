# Vercel Deployment Guide

## Option A — Vercel Dashboard (recommended, no CLI)
1. Push the project to a GitHub/GitLab/Bitbucket repo.
2. Go to [vercel.com/new](https://vercel.com/new) → **Import Project** → select your repo.
3. Vercel auto-detects Vite (confirmed by `vercel.json` in this repo). Leave:
   - **Build command**: `npm run build`
   - **Output directory**: `dist`
4. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   (same values as your local `.env`)
5. Click **Deploy**. First build takes ~1–2 minutes.
6. Once live, open the generated `*.vercel.app` URL and log in with one of the 4 seeded accounts.

## Option B — Vercel CLI
```bash
npm i -g vercel
vercel login
cd codevault-team
vercel            # first deploy, follow prompts (link to a new project)
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel --prod     # promote to production
```

## Why `vercel.json` matters
This is a client-side-routed SPA (React Router). Without a rewrite rule, refreshing on `/dashboard` or any deep link 404s on Vercel's static host. The included config fixes that:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

## Custom domain (optional)
Project → Settings → Domains → add your domain and follow Vercel's DNS instructions.

## Post-deploy checklist
- [ ] Log in with all 4 seeded accounts, confirm role-based access (only Krut sees Admin pages)
- [ ] Upload a test file and a test ZIP, confirm realtime shows up for a second logged-in session
- [ ] Confirm Supabase project is **not** in a paused/free-tier-sleep state that would break cold starts
- [ ] Add the production URL to Supabase → Authentication → URL Configuration → Site URL / Redirect URLs (needed for password reset emails to link back correctly)
