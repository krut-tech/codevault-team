-- =========================================
-- Fix: notifications table had SELECT/UPDATE policies for the owning user,
-- but no INSERT policy at all — every client-side notifyTeam() insert
-- (uploads, deletes, folder creation, comments, etc.) was silently
-- rejected by RLS, so team notifications never worked in production.
--
-- Any authenticated team member may create a notification FOR another
-- team member (that's the whole point of notifyTeam — fan-out to
-- teammates), so the insert check intentionally does NOT require
-- auth.uid() = user_id like the read/update policies do. It only
-- requires the recipient to be a real team member.
--
-- Also adds a DELETE policy so users can clear their own notifications
-- (there was previously no way to remove one at all).
-- =========================================

create policy "notifications_team_insert"
on public.notifications
for insert
with check (
  auth.uid() is not null
  and exists (select 1 from public.users where id = notifications.user_id)
);

create policy "notifications_own_delete"
on public.notifications
for delete
using (auth.uid() = user_id);
