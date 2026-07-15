# Installation Guide

## Prerequisites
- Node.js 18+ and npm
- A free [Supabase](https://supabase.com) account
- Git (optional, for version control)

## 1. Get the code
Unzip the project, or clone your repo, then:
```bash
cd codevault-team
npm install
```

## 2. Configure environment variables
```bash
cp .env.example .env
```
Fill in the two values (you'll get these after setting up Supabase — see `SUPABASE_SETUP.md`):
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 3. Set up the database
Follow `SUPABASE_SETUP.md` to run `supabase/migrations/001_init_schema.sql` against your project and create the storage bucket.

## 4. Run locally
```bash
npm run dev
```
Visit the printed local URL (typically `http://localhost:5173`).

## 5. Create your first user
Since this is a closed 4-person vault, there's no public sign-up form:
1. In the Supabase Dashboard → Authentication → Users → **Add user** (email + password) for each of the 4 team members.
2. In Table Editor → `users`, insert a matching row for each `auth.users.id`, with `role = 'admin'` for Krut and `role = 'user'` for the other three.
3. Log in at `/login` with those credentials.

## 6. Verify the build
```bash
npx tsc -b        # typecheck
npm run build     # production build → dist/
```
Both should complete with no errors (see `TEST_REPORT.md` for the latest verified run).
