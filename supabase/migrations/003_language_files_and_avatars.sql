-- =========================================
-- 003: language-scoped files + avatar uploads
-- =========================================

-- Files can now be tagged with a language directly (folders already had
-- this). Needed so a file uploaded at a language's root (not inside any
-- folder) still knows which language it belongs to.
alter table public.files add column if not exists language_id uuid references public.languages(id);

create index if not exists idx_files_language on public.files(language_id);
create index if not exists idx_folders_language on public.folders(language_id);

-- ---------- AVATARS ----------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Public read (so avatars render anywhere in the app without signed URLs).
create policy "avatars_public_read"
on storage.objects for select
using (bucket_id = 'avatars');

-- Each user may only write/replace/remove files under a path prefixed
-- with their own uid, e.g. avatars/<uid>/<timestamp>-<name>.
create policy "avatars_owner_insert"
on storage.objects for insert
with check (
  bucket_id = 'avatars'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "avatars_owner_update"
on storage.objects for update
using (
  bucket_id = 'avatars'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "avatars_owner_delete"
on storage.objects for delete
using (
  bucket_id = 'avatars'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);
