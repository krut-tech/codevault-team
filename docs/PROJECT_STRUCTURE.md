# Final Project Structure

```
codevault-team/
├── docs/                          # This documentation set
├── supabase/
│   ├── migrations/
│   │   └── 001_init_schema.sql    # Full schema: tables, RLS, indexes, storage bucket, realtime
│   └── functions/
│       └── purge-recycle-bin/
│           └── index.ts           # Scheduled Edge Function for Recycle Bin auto-purge
├── src/
│   ├── App.tsx                    # Route table (public / protected / admin), lazy-loaded heavy pages
│   ├── main.tsx                   # React root, mounts <App/>
│   ├── index.css                  # Design tokens (light/dark HSL vars) + Tailwind directives
│   │
│   ├── components/
│   │   ├── AppLayout.tsx          # Shared Sidebar + responsive topbar (search, notifications, profile)
│   │   ├── Sidebar.tsx            # Full nav, mobile drawer + desktop collapse
│   │   ├── ProtectedRoute.tsx     # <ProtectedRoute/> and <AdminRoute/> guards
│   │   ├── CommentThread.tsx      # Reusable comment list + composer (files & folders)
│   │   ├── FilePreviewModal.tsx   # Image/PDF/text preview + favorite/download + comments
│   │   ├── TagPicker.tsx          # Shared tag-assignment popover (folders & files)
│   │   └── ui/                    # Button, Card/GlassCard, Badge, Input — the design-token-driven kit
│   │
│   ├── pages/                     # One file per route (see App.tsx for the mapping)
│   │   ├── Landing.tsx, Login.tsx, ForgotPassword.tsx, ResetPassword.tsx   (public)
│   │   ├── Dashboard.tsx, Languages.tsx, Projects.tsx                     (protected)
│   │   ├── FolderBrowser.tsx      # Core folder/file browser: CRUD, upload, ZIP/folder upload, drag-drop
│   │   ├── Editor.tsx             # Monaco editor: autosave, versions, fullscreen
│   │   ├── Snippets.tsx, Search.tsx, Notifications.tsx, Favorites.tsx
│   │   ├── Collections.tsx, CollectionDetail.tsx
│   │   ├── RecycleBin.tsx, Profile.tsx
│   │   └── AdminUsers.tsx, AdminActivityLogs.tsx, AdminSettings.tsx      (admin-only)
│   │
│   ├── hooks/                     # One file per domain — React Query + Supabase, each with realtime
│   │   ├── useFolders.ts, useFileUpload.ts, useFile.ts, useFolderPath.ts, useFileUrl.ts
│   │   ├── useLanguages.ts, useProjects.ts, useCollections.ts, useTags.ts
│   │   ├── useFavorites.ts, useComments.ts, useSnippets.ts
│   │   ├── useSearch.ts, useNotifications.ts, useTeamNotify.ts
│   │   ├── useActivityLog.ts, useAdmin.ts, useSettings.ts, useStorageUsed.ts
│   │
│   ├── store/
│   │   └── authStore.ts           # Zustand store, synced with supabase.auth.onAuthStateChange
│   │
│   ├── lib/
│   │   ├── supabaseClient.ts      # Singleton Supabase client (reads VITE_ env vars)
│   │   ├── monacoLang.ts          # File extension → Monaco language mapping
│   │   └── utils.ts               # `cn()` class-merge helper
│   │
│   └── types/
│       └── index.ts               # Shared TS types mirroring the Supabase schema
│
├── tailwind.config.js              # Design tokens (colors, radius, shadows, animations)
├── postcss.config.js
├── vite.config.ts                  # `@/*` path alias → `src/*`
├── vercel.json                     # SPA rewrite + build config for Vercel
├── .env.example
└── README.md
```

## Layering, top to bottom
1. **`pages/`** — route-level screens, compose `AppLayout` + domain hooks + `components/ui`.
2. **`components/`** — shared, reusable across pages (layout chrome, modals, pickers).
3. **`hooks/`** — all Supabase I/O lives here; pages never call `supabase.*` directly except in a couple of auth screens where it's the whole point of the page (Login/ForgotPassword/ResetPassword/Profile sign-out).
4. **`store/`** — the one piece of global client state (current user/session).
5. **`lib/`** — framework-agnostic helpers with no React dependency.

This separation is what makes the codebase swappable later (e.g. a React Native client could reuse every file in `hooks/`, `lib/`, and `types/` as-is).
