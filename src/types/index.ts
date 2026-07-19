export type Role = "admin" | "user";

export interface AppUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: Role;
  created_at: string;
}

export interface Language {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  created_by: string | null;
  created_at: string;
}

export interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  language_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface FolderRow {
  id: string;
  name: string;
  project_id: string | null;
  parent_folder_id: string | null;
  language_id: string | null;
  created_by: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FileRow {
  id: string;
  name: string;
  folder_id: string | null;
  language_id: string | null;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  extension: string | null;
  content: string | null;
  created_by: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  message: string;
  is_read: boolean;
  related_id: string | null;
  created_at: string;
}

export interface ActivityLogRow {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}
