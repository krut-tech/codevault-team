# API Documentation

CodeVault Team has **no custom REST/GraphQL backend** — the "API" is Supabase's auto-generated PostgREST + Realtime + Storage + Auth API, called directly from the frontend via `@supabase/supabase-js`, gated entirely by Row Level Security. This document describes that surface as consumed by the app's data hooks (`src/hooks/*`), so it can be used as a reference for building integrations or a future mobile client against the same backend.

## Auth
| Operation | Call | Notes |
|---|---|---|
| Sign in | `supabase.auth.signInWithPassword({ email, password })` | Used in `Login.tsx` |
| Sign out | `supabase.auth.signOut()` | `authStore.signOut()` |
| Request reset | `supabase.auth.resetPasswordForEmail(email, { redirectTo })` | `ForgotPassword.tsx` |
| Complete reset | `supabase.auth.updateUser({ password })` | `ResetPassword.tsx` |
| Get session | `supabase.auth.getSession()` | `authStore.hydrate()` |
| Listen for changes | `supabase.auth.onAuthStateChange(...)` | keeps `authStore` in sync |

## Tables (PostgREST, all under RLS)
Every table below is queried via `supabase.from("<table>").select/insert/update/delete`. Full policies are in `supabase/migrations/001_init_schema.sql`.

| Table | Used by | Access rule |
|---|---|---|
| `users` | `useAdmin.ts`, `authStore.ts` | Read: any authenticated user. Write: self or admin. Delete: admin only. |
| `languages` | `useLanguages.ts` | Full CRUD for any authenticated user. |
| `projects` | `useProjects.ts` | Full CRUD for any authenticated user. |
| `folders` | `useFolders.ts`, `useFolderPath.ts` | Full CRUD for any authenticated user. Soft-delete via `is_deleted`/`deleted_at`. |
| `files` | `useFileUpload.ts`, `useFile.ts` | Full CRUD for any authenticated user. Soft-delete via `is_deleted`/`deleted_at`. |
| `versions` | `useFile.ts` | Insert on every save; full CRUD for any authenticated user (append-only in practice). |
| `collections` / `collection_folders` | `useCollections.ts` | Full CRUD for any authenticated user. |
| `tags` / `folder_tags` / `file_tags` | `useTags.ts` | Full CRUD for any authenticated user. |
| `favorites` | `useFavorites.ts` | Private — a user can only see/write their own rows (`user_id = auth.uid()`). |
| `comments` | `useComments.ts` | Full CRUD for any authenticated user. |
| `notifications` | `useNotifications.ts`, `useTeamNotify.ts` | Private — a user can only read/update their own rows. Any authenticated user can insert (used to notify teammates). |
| `activity_logs` | `useActivityLog.ts` | Insert: any authenticated user. Select: **admin only**. |
| `settings` | `useSettings.ts` | Select: any authenticated user. Write: **admin only**. |
| `snippets` | `useSnippets.ts` | Full CRUD for any authenticated user. |

## Storage
Bucket: `codevault-files` (private).
| Operation | Call | Used by |
|---|---|---|
| Upload | `supabase.storage.from(BUCKET).upload(path, file)` | `useFileUpload.ts` |
| Signed URL (preview) | `supabase.storage.from(BUCKET).createSignedUrl(path, 3600)` | `useFileUrl.ts` |
| Download | `supabase.storage.from(BUCKET).download(path)` | `useFileUpload.ts` (`useDownloadFile`) |
| Delete (purge) | `supabase.storage.from(BUCKET).remove([path])` | `purge-recycle-bin` Edge Function |

Storage path convention: `{folderId ?? "root"}/{timestamp}-{originalFileName}`.

## Realtime
Every list-fetching hook subscribes to a Postgres Changes channel and invalidates its React Query cache on any `INSERT`/`UPDATE`/`DELETE`:
```ts
supabase
  .channel("<unique-channel-name>")
  .on("postgres_changes", { event: "*", schema: "public", table: "<table>" }, () => {
    queryClient.invalidateQueries({ queryKey: [...] });
  })
  .subscribe();
```
Channels in use: `folder-contents-*`, `languages-live`, `projects-live`, `collections-live`, `tags-live`, `favorites-<userId>`, `notifications-<userId>`, `comments-<fileId|folderId>`, `snippets-live`, `activity-logs-live`.

## Edge Functions
| Function | Trigger | Purpose |
|---|---|---|
| `purge-recycle-bin` | Cron (daily, configurable) | Hard-deletes folders/files past the retention window; see `supabase/functions/purge-recycle-bin/index.ts`. |

## Client-side helper "API"
These aren't network endpoints but are the stable contract the UI relies on — useful if you build another frontend against the same data:
- `logActivity(action, entityType, entityId, metadata)` — writes one `activity_logs` row.
- `notifyTeam(message, type, relatedId)` — fans a `notifications` row out to every user except the actor.
