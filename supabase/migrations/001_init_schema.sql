-- =========================================
-- CodeVault Team — Initial Schema
-- 4 trusted users, shared ownership, admin-only user mgmt
-- =========================================

create extension if not exists "uuid-ossp";

-- ---------- USERS (mirrors auth.users) ----------
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text not null,
  avatar_url text,
  role text not null default 'user' check (role in ('admin','user')),
  created_at timestamptz default now()
);

-- ---------- LANGUAGES ----------
create table public.languages (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  icon text,
  color text,
  created_by uuid references public.users(id),
  created_at timestamptz default now()
);

-- ---------- PROJECTS ----------
create table public.projects (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  language_id uuid references public.languages(id) on delete set null,
  created_by uuid references public.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---------- FOLDERS (unlimited nesting) ----------
create table public.folders (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  project_id uuid references public.projects(id) on delete cascade,
  parent_folder_id uuid references public.folders(id) on delete cascade,
  language_id uuid references public.languages(id),
  created_by uuid references public.users(id),
  is_deleted boolean default false,
  deleted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---------- FILES ----------
create table public.files (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  folder_id uuid references public.folders(id) on delete cascade,
  storage_path text not null,
  mime_type text,
  size_bytes bigint,
  extension text,
  content text, -- for text/code files, cached for editor
  created_by uuid references public.users(id),
  is_deleted boolean default false,
  deleted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---------- VERSIONS ----------
create table public.versions (
  id uuid primary key default uuid_generate_v4(),
  file_id uuid references public.files(id) on delete cascade,
  content text,
  storage_path text,
  edited_by uuid references public.users(id),
  created_at timestamptz default now()
);

-- ---------- COLLECTIONS ----------
create table public.collections (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  color text,
  created_by uuid references public.users(id),
  created_at timestamptz default now()
);

create table public.collection_folders (
  collection_id uuid references public.collections(id) on delete cascade,
  folder_id uuid references public.folders(id) on delete cascade,
  primary key (collection_id, folder_id)
);

-- ---------- TAGS ----------
create table public.tags (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  color text default '#6366F1'
);

create table public.folder_tags (
  folder_id uuid references public.folders(id) on delete cascade,
  tag_id uuid references public.tags(id) on delete cascade,
  primary key (folder_id, tag_id)
);

create table public.file_tags (
  file_id uuid references public.files(id) on delete cascade,
  tag_id uuid references public.tags(id) on delete cascade,
  primary key (file_id, tag_id)
);

-- ---------- FAVORITES ----------
create table public.favorites (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  folder_id uuid references public.folders(id) on delete cascade,
  file_id uuid references public.files(id) on delete cascade,
  created_at timestamptz default now()
);

-- ---------- COMMENTS ----------
create table public.comments (
  id uuid primary key default uuid_generate_v4(),
  file_id uuid references public.files(id) on delete cascade,
  folder_id uuid references public.folders(id) on delete cascade,
  user_id uuid references public.users(id),
  content text not null,
  created_at timestamptz default now()
);

-- ---------- NOTIFICATIONS ----------
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  type text not null,
  message text not null,
  is_read boolean default false,
  related_id uuid,
  created_at timestamptz default now()
);

-- ---------- ACTIVITY LOGS (admin only view) ----------
create table public.activity_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id),
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz default now()
);

-- ---------- SETTINGS ----------
create table public.settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references public.users(id),
  updated_at timestamptz default now()
);

-- ---------- INDEXES ----------
create index idx_folders_project on public.folders(project_id);
create index idx_folders_parent on public.folders(parent_folder_id);
create index idx_files_folder on public.files(folder_id);
create index idx_files_name_trgm on public.files using gin (name gin_trgm_ops);
create index idx_versions_file on public.versions(file_id);
create index idx_activity_logs_user on public.activity_logs(user_id);
create index idx_activity_logs_created on public.activity_logs(created_at desc);
create index idx_notifications_user_unread on public.notifications(user_id, is_read);

create extension if not exists pg_trgm;

-- =========================================
-- ROW LEVEL SECURITY
-- 4 trusted members: any authenticated user can CRUD shared content.
-- Admin-only: users table writes, activity_logs reads, settings writes.
-- =========================================

alter table public.users enable row level security;
alter table public.languages enable row level security;
alter table public.projects enable row level security;
alter table public.folders enable row level security;
alter table public.files enable row level security;
alter table public.versions enable row level security;
alter table public.collections enable row level security;
alter table public.tags enable row level security;
alter table public.favorites enable row level security;
alter table public.comments enable row level security;
alter table public.notifications enable row level security;
alter table public.activity_logs enable row level security;
alter table public.settings enable row level security;

-- Helper: is admin
create or replace function public.is_admin()
returns boolean language sql stable as $$
  select exists (
    select 1 from public.users where id = auth.uid() and role = 'admin'
  );
$$;

-- USERS: everyone can read; only admin can insert/update/delete others
create policy "users_select_all" on public.users for select using (auth.uid() is not null);
create policy "users_update_self_or_admin" on public.users for update using (auth.uid() = id or public.is_admin());
create policy "users_admin_manage" on public.users for delete using (public.is_admin());

-- SHARED TABLES: any authenticated team member can fully CRUD
create policy "languages_all" on public.languages for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "projects_all" on public.projects for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "folders_all" on public.folders for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "files_all" on public.files for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "versions_all" on public.versions for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "collections_all" on public.collections for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "tags_all" on public.tags for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "comments_all" on public.comments for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- FAVORITES: private to each user
create policy "favorites_own" on public.favorites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- NOTIFICATIONS: private to each user
create policy "notifications_own" on public.notifications for select using (auth.uid() = user_id);
create policy "notifications_own_update" on public.notifications for update using (auth.uid() = user_id);

-- ACTIVITY LOGS: insert by anyone authenticated, read only by admin
create policy "activity_logs_insert" on public.activity_logs for insert with check (auth.uid() is not null);
create policy "activity_logs_admin_select" on public.activity_logs for select using (public.is_admin());

-- SETTINGS: read by all, write by admin only
create policy "settings_select" on public.settings for select using (auth.uid() is not null);
create policy "settings_admin_write" on public.settings for all using (public.is_admin()) with check (public.is_admin());

-- =========================================
-- REALTIME
-- =========================================
alter publication supabase_realtime add table public.folders, public.files, public.notifications, public.activity_logs, public.favorites, public.comments;

-- =========================================
-- STORAGE BUCKET
-- =========================================
insert into storage.buckets (id, name, public)
values ('codevault-files', 'codevault-files', false)
on conflict (id) do nothing;

create policy "storage_authenticated_all"
on storage.objects for all
using (bucket_id = 'codevault-files' and auth.uid() is not null)
with check (bucket_id = 'codevault-files' and auth.uid() is not null);

-- =========================================
-- CODE SNIPPETS (quick reusable code notes,
-- separate from full files — lighter weight)
-- =========================================
create table public.snippets (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  language text not null default 'plaintext',
  code text not null,
  description text,
  folder_id uuid references public.folders(id) on delete set null,
  created_by uuid references public.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.snippets enable row level security;
create policy "snippets_all" on public.snippets for all using (auth.uid() is not null) with check (auth.uid() is not null);
alter publication supabase_realtime add table public.snippets;

create index idx_snippets_folder on public.snippets(folder_id);
