# Database ER Diagram

```mermaid
erDiagram
    USERS ||--o{ FOLDERS : creates
    USERS ||--o{ FILES : creates
    USERS ||--o{ PROJECTS : creates
    USERS ||--o{ LANGUAGES : creates
    USERS ||--o{ COLLECTIONS : creates
    USERS ||--o{ COMMENTS : writes
    USERS ||--o{ FAVORITES : owns
    USERS ||--o{ NOTIFICATIONS : receives
    USERS ||--o{ ACTIVITY_LOGS : performs
    USERS ||--o{ VERSIONS : edits
    USERS ||--o{ SNIPPETS : creates
    USERS ||--o{ SETTINGS : updates

    LANGUAGES ||--o{ PROJECTS : categorizes
    LANGUAGES ||--o{ FOLDERS : categorizes

    PROJECTS ||--o{ FOLDERS : contains

    FOLDERS ||--o{ FOLDERS : "parent of (unlimited nesting)"
    FOLDERS ||--o{ FILES : contains
    FOLDERS ||--o{ COMMENTS : has
    FOLDERS ||--o{ FAVORITES : "starred as"
    FOLDERS ||--o{ FOLDER_TAGS : tagged_via
    FOLDERS ||--o{ COLLECTION_FOLDERS : grouped_via
    FOLDERS ||--o{ SNIPPETS : "optionally scoped to"

    FILES ||--o{ VERSIONS : "has history"
    FILES ||--o{ COMMENTS : has
    FILES ||--o{ FAVORITES : "starred as"
    FILES ||--o{ FILE_TAGS : tagged_via

    TAGS ||--o{ FOLDER_TAGS : "used in"
    TAGS ||--o{ FILE_TAGS : "used in"

    COLLECTIONS ||--o{ COLLECTION_FOLDERS : groups

    USERS {
        uuid id PK
        text email
        text full_name
        text avatar_url
        text role "admin | user"
        timestamptz created_at
    }
    LANGUAGES {
        uuid id PK
        text name
        text icon
        text color
        uuid created_by FK
    }
    PROJECTS {
        uuid id PK
        text name
        text description
        uuid language_id FK
        uuid created_by FK
    }
    FOLDERS {
        uuid id PK
        text name
        uuid project_id FK
        uuid parent_folder_id FK "self-referencing"
        uuid language_id FK
        boolean is_deleted
        timestamptz deleted_at
    }
    FILES {
        uuid id PK
        text name
        uuid folder_id FK
        text storage_path
        text mime_type
        bigint size_bytes
        text extension
        text content "cached text for editor"
        boolean is_deleted
        timestamptz deleted_at
    }
    VERSIONS {
        uuid id PK
        uuid file_id FK
        text content
        uuid edited_by FK
        timestamptz created_at
    }
    COLLECTIONS {
        uuid id PK
        text name
        text description
        text color
    }
    COLLECTION_FOLDERS {
        uuid collection_id FK
        uuid folder_id FK
    }
    TAGS {
        uuid id PK
        text name
        text color
    }
    FOLDER_TAGS {
        uuid folder_id FK
        uuid tag_id FK
    }
    FILE_TAGS {
        uuid file_id FK
        uuid tag_id FK
    }
    FAVORITES {
        uuid id PK
        uuid user_id FK
        uuid folder_id FK
        uuid file_id FK
    }
    COMMENTS {
        uuid id PK
        uuid file_id FK
        uuid folder_id FK
        uuid user_id FK
        text content
    }
    NOTIFICATIONS {
        uuid id PK
        uuid user_id FK
        text type
        text message
        boolean is_read
        uuid related_id
    }
    ACTIVITY_LOGS {
        uuid id PK
        uuid user_id FK
        text action
        text entity_type
        uuid entity_id
        jsonb metadata
    }
    SETTINGS {
        text key PK
        jsonb value
        uuid updated_by FK
    }
    SNIPPETS {
        uuid id PK
        text title
        text language
        text code
        uuid folder_id FK
        uuid created_by FK
    }
```

## Notes
- Every foreign key to `users` is nullable-on-delete-set-null or cascade, matching `supabase/migrations/001_init_schema.sql` exactly.
- `folders.parent_folder_id` is self-referencing with `ON DELETE CASCADE`, which is what gives unlimited nesting and makes deleting a folder also delete its full subtree.
- `folder_tags` / `file_tags` and `collection_folders` are junction tables enabling many-to-many relationships (a folder can have many tags, a tag can be on many folders; a folder can be in many collections).
