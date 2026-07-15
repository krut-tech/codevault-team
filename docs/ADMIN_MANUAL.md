# Admin Manual

Everything in the User Manual applies to admins too — this covers the **Admin-only** section of the sidebar (visible only to accounts with `role = 'admin'` in the `users` table).

## User Management (`Admin → Users`)
- View every team member, their email, and current role.
- **Make Admin / Make User** — toggle a teammate's role. You cannot change your own role (self-protection, prevents accidental lockout).
- **Remove** (trash icon) — permanently removes a user's `users` row (and, if you also remove them from Supabase Auth, their login). You cannot remove yourself.

> Adding a *new* team member is a two-step manual process (there is no in-app "invite" flow by design, since this is a fixed 4-person team): create them in Supabase Auth, then insert their `users` row. See `SUPABASE_SETUP.md` step 4.

## Activity Logs (`Admin → Activity Logs`)
A live, realtime feed of every action taken across the vault — who created/renamed/deleted what, and when. Every mutation in the app writes here via `logActivity()`. Non-admins cannot see this page or query the `activity_logs` table (enforced by RLS, not just hidden UI).

## System Settings (`Admin → System Settings`)
- **Vault Name** — cosmetic label (stored in `settings.site_name`).
- **Recycle Bin Auto-Purge (days)** — how long soft-deleted items sit in the Recycle Bin before permanent deletion. This number is read by the `purge-recycle-bin` Edge Function — the setting alone does nothing until that function is deployed and scheduled (see `SUPABASE_SETUP.md` step 7).

## Security model, in plain terms
- All 4 members can fully CRUD shared content (folders, files, languages, projects, tags, collections, comments) — there's no per-item ownership lock, matching the original "trusted team" requirement.
- Only admins can: manage users, view activity logs, and change system settings. This is enforced at the database level (Row Level Security), not just hidden buttons — even a modified frontend or a direct API call from a non-admin account is rejected by Postgres.
- `favorites` and `notifications` are private per-user even from other trusted members.

## Recommended admin routine
- Skim **Activity Logs** weekly for anything unexpected.
- Review the **Recycle Bin** occasionally before the auto-purge window closes, in case something was deleted by mistake.
- Keep the **Recycle Bin retention** setting realistic for your workflow (30 days is the default).
