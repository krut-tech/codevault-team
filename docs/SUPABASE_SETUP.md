# Supabase Setup Guide

## 1. Create a project
1. Go to [supabase.com](https://supabase.com) → **New project**.
2. Pick a name (e.g. `codevault-team`), a strong database password (save it), and the region closest to your team.
3. Wait for provisioning (~2 minutes).

## 2. Run the schema migration
1. Open **SQL Editor** in the Supabase Dashboard.
2. Paste the entire contents of `supabase/migrations/001_init_schema.sql`.
3. Click **Run**. This creates:
   - 16 tables (`users`, `languages`, `projects`, `folders`, `files`, `versions`, `collections`, `collection_folders`, `tags`, `folder_tags`, `file_tags`, `favorites`, `comments`, `notifications`, `activity_logs`, `settings`, `snippets`)
   - Indexes, including a trigram index for fast file-name search
   - Row Level Security policies on every table
   - The `codevault-files` Storage bucket + its access policy
   - Realtime publication for every collaborative table

If it fails partway through, it's safe to re-run — most statements use `if not exists` / `on conflict do nothing` where it matters; for a truly clean re-run, drop the tables first in reverse dependency order.

## 3. Confirm Auth settings
Authentication → Providers → **Email** should be enabled. Since sign-ups are admin-created (not public), you can optionally turn **Allow new users to sign up** OFF under Authentication → Settings, to guarantee only the 4 seeded accounts can ever exist.

## 4. Create the 4 team accounts
Authentication → Users → **Add user**, once per person (email + password, "Auto Confirm User" checked). Then, in Table Editor → `users`, insert one row per person:

| id | email | full_name | role |
|---|---|---|---|
| (paste the auth user's UUID) | krut@... | Krut | admin |
| (paste the auth user's UUID) | fenil@... | Fenil | user |
| (paste the auth user's UUID) | het@... | Het | user |
| (paste the auth user's UUID) | ishant@... | Ishant | user |

## 5. Get your API keys
Project Settings → API:
- **Project URL** → `VITE_SUPABASE_URL`
- **anon public key** → `VITE_SUPABASE_ANON_KEY`

Put both into your `.env` (see `INSTALLATION.md`).

## 6. Verify Storage
Storage → you should see a `codevault-files` bucket (private). No further action needed — the app uses signed URLs to preview/download files.

## 7. (Optional) Deploy the Recycle Bin auto-purge function
```bash
supabase login
supabase link --project-ref your-project-ref
supabase functions deploy purge-recycle-bin
supabase functions schedule purge-recycle-bin --cron "0 3 * * *"
```
This runs daily at 3am and permanently deletes anything in the Recycle Bin older than the retention window set in **Admin → System Settings**.

## 8. Sanity check
Run this in the SQL Editor to confirm RLS is active everywhere:
```sql
select relname, relrowsecurity
from pg_class
join pg_namespace on pg_namespace.oid = pg_class.relnamespace
where pg_namespace.nspname = 'public' and relkind = 'r';
```
Every row should show `relrowsecurity = true`.
