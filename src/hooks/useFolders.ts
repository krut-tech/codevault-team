import { useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import type { FolderRow, FileRow } from "@/types";
import { logActivity } from "@/hooks/useActivityLog";
import { useAuthStore } from "@/store/authStore";
import { notifyTeam } from "@/hooks/useTeamNotify";

// Fetch folders + files for a given parent (null = root)
export function useFolderContents(parentFolderId: string | null) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["folder-contents", parentFolderId],
    queryFn: async () => {
      let folderQuery = supabase.from("folders").select("*").eq("is_deleted", false).order("name");
      folderQuery = parentFolderId
        ? folderQuery.eq("parent_folder_id", parentFolderId)
        : folderQuery.is("parent_folder_id", null);

      let fileQuery = supabase.from("files").select("*").eq("is_deleted", false).order("name");
      fileQuery = parentFolderId
        ? fileQuery.eq("folder_id", parentFolderId)
        : fileQuery.is("folder_id", null);

      const [{ data: folders, error: fErr }, { data: files, error: fiErr }] = await Promise.all([
        folderQuery,
        fileQuery,
      ]);
      if (fErr) throw fErr;
      if (fiErr) throw fiErr;
      return { folders: (folders ?? []) as FolderRow[], files: (files ?? []) as FileRow[] };
    },
  });

  // Realtime: any insert/update/delete on folders or files refetches this view
  useEffect(() => {
    const channel = supabase
      .channel(`folder-contents-${parentFolderId ?? "root"}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "folders" }, () => {
        qc.invalidateQueries({ queryKey: ["folder-contents"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "files" }, () => {
        qc.invalidateQueries({ queryKey: ["folder-contents"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [parentFolderId, qc]);

  return query;
}

// Fetch the folders + files that sit at the root of a language (i.e. not
// nested inside any folder). Once you navigate into a subfolder, regular
// useFolderContents(folderId) takes over — subfolders/files stay scoped
// automatically because they're only reachable via that folder's id.
export function useLanguageRootContents(languageId: string | null) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["language-root-contents", languageId],
    queryFn: async () => {
      const [{ data: folders, error: fErr }, { data: files, error: fiErr }] = await Promise.all([
        supabase
          .from("folders")
          .select("*")
          .eq("language_id", languageId)
          .is("parent_folder_id", null)
          .eq("is_deleted", false)
          .order("name"),
        supabase
          .from("files")
          .select("*")
          .eq("language_id", languageId)
          .is("folder_id", null)
          .eq("is_deleted", false)
          .order("name"),
      ]);
      if (fErr) throw fErr;
      if (fiErr) throw fiErr;
      return { folders: (folders ?? []) as FolderRow[], files: (files ?? []) as FileRow[] };
    },
    enabled: !!languageId,
  });

  useEffect(() => {
    if (!languageId) return;
    const channel = supabase
      .channel(`language-root-contents-${languageId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "folders" }, () => {
        qc.invalidateQueries({ queryKey: ["language-root-contents", languageId] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "files" }, () => {
        qc.invalidateQueries({ queryKey: ["language-root-contents", languageId] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [languageId, qc]);

  return query;
}

export function useCreateFolder() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: async (params: { name: string; parentFolderId: string | null; languageId?: string | null }) => {
      const { data, error } = await supabase
        .from("folders")
        .insert({
          name: params.name,
          parent_folder_id: params.parentFolderId,
          language_id: params.languageId ?? null,
          created_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      await logActivity("folder.created", "folder", data.id, { name: params.name });
      await notifyTeam(`${user?.full_name ?? "Someone"} created folder "${params.name}"`, "folder.created", data.id);
      return data as FolderRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["folder-contents"] });
      qc.invalidateQueries({ queryKey: ["language-root-contents"] });
    },
  });
}

export function useRenameFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from("folders").update({ name, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
      await logActivity("folder.renamed", "folder", id, { name });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["folder-contents"] });
      qc.invalidateQueries({ queryKey: ["language-root-contents"] });
    },
  });
}

/**
 * Soft-deletes a folder AND everything nested inside it (subfolders and
 * files, at any depth). Without this, only the folder row itself was
 * marked is_deleted, leaving descendants invisible in the Folder Browser
 * (their parent is hidden) but NOT marked deleted — so they never showed
 * up in the Recycle Bin either, yet still consumed storage and could
 * still surface in Search. Worse, when the parent later crossed the
 * retention window, purge-recycle-bin hard-deletes it, and Postgres'
 * ON DELETE CASCADE silently removes those never-flagged descendant rows
 * too — without ever removing their Storage objects, leaking storage
 * forever.
 */
async function collectDescendantIds(rootFolderId: string): Promise<{ folderIds: string[]; fileIds: string[] }> {
  const folderIds: string[] = [];
  const fileIds: string[] = [];
  let frontier = [rootFolderId];

  while (frontier.length > 0) {
    const { data: childFolders } = await supabase
      .from("folders")
      .select("id")
      .in("parent_folder_id", frontier);
    const { data: childFiles } = await supabase.from("files").select("id").in("folder_id", frontier);

    fileIds.push(...(childFiles ?? []).map((f) => f.id));
    const nextFolderIds = (childFolders ?? []).map((f) => f.id);
    folderIds.push(...nextFolderIds);
    frontier = nextFolderIds;
  }

  return { folderIds, fileIds };
}

export function useSoftDeleteFolder() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: folder } = await supabase.from("folders").select("name").eq("id", id).single();

      // Also soft-delete every file directly in this folder, plus every
      // nested subfolder and its files, at any depth.
      const { folderIds: descendantFolderIds, fileIds: descendantFileIds } = await collectDescendantIds(id);
      const { data: directFiles } = await supabase.from("files").select("id").eq("folder_id", id);
      const allFileIds = [...(directFiles ?? []).map((f) => f.id), ...descendantFileIds];
      const now = new Date().toISOString();

      const { error } = await supabase
        .from("folders")
        .update({ is_deleted: true, deleted_at: now })
        .eq("id", id);
      if (error) throw error;

      if (descendantFolderIds.length > 0) {
        const { error: subErr } = await supabase
          .from("folders")
          .update({ is_deleted: true, deleted_at: now })
          .in("id", descendantFolderIds);
        if (subErr) throw subErr;
      }
      if (allFileIds.length > 0) {
        const { error: fileErr } = await supabase
          .from("files")
          .update({ is_deleted: true, deleted_at: now })
          .in("id", allFileIds);
        if (fileErr) throw fileErr;
      }

      await logActivity("folder.deleted", "folder", id, {
        cascaded_folders: descendantFolderIds.length,
        cascaded_files: allFileIds.length,
      });
      await notifyTeam(`${user?.full_name ?? "Someone"} deleted folder "${folder?.name ?? ""}"`, "folder.deleted", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["folder-contents"] });
      qc.invalidateQueries({ queryKey: ["language-root-contents"] });
    },
  });
}

export function useRestoreFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { folderIds: descendantFolderIds, fileIds: descendantFileIds } = await collectDescendantIds(id);
      const { data: directFiles } = await supabase.from("files").select("id").eq("folder_id", id);
      const allFileIds = [...(directFiles ?? []).map((f) => f.id), ...descendantFileIds];

      const { error } = await supabase
        .from("folders")
        .update({ is_deleted: false, deleted_at: null })
        .eq("id", id);
      if (error) throw error;

      if (descendantFolderIds.length > 0) {
        await supabase.from("folders").update({ is_deleted: false, deleted_at: null }).in("id", descendantFolderIds);
      }
      if (allFileIds.length > 0) {
        await supabase.from("files").update({ is_deleted: false, deleted_at: null }).in("id", allFileIds);
      }

      await logActivity("folder.restored", "folder", id, {});
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["folder-contents"] });
      qc.invalidateQueries({ queryKey: ["language-root-contents"] });
    },
  });
}

export function useMoveFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, newParentId }: { id: string; newParentId: string | null }) => {
      const { error } = await supabase
        .from("folders")
        .update({ parent_folder_id: newParentId, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      await logActivity("folder.moved", "folder", id, { newParentId });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["folder-contents"] });
      qc.invalidateQueries({ queryKey: ["language-root-contents"] });
    },
  });
}

export function useRecycleBin() {
  return useQuery({
    queryKey: ["recycle-bin"],
    queryFn: async () => {
      const [{ data: folders }, { data: files }] = await Promise.all([
        supabase.from("folders").select("*").eq("is_deleted", true).order("deleted_at", { ascending: false }),
        supabase.from("files").select("*").eq("is_deleted", true).order("deleted_at", { ascending: false }),
      ]);
      return { folders: (folders ?? []) as FolderRow[], files: (files ?? []) as FileRow[] };
    },
  });
}

export function useRestoreFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("files").update({ is_deleted: false, deleted_at: null }).eq("id", id);
      if (error) throw error;
      await logActivity("file.restored", "file", id, {});
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recycle-bin"] });
      qc.invalidateQueries({ queryKey: ["folder-contents"] });
    },
  });
}
