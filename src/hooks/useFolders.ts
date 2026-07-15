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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["folder-contents"] }),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["folder-contents"] }),
  });
}

export function useSoftDeleteFolder() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: folder } = await supabase.from("folders").select("name").eq("id", id).single();
      const { error } = await supabase
        .from("folders")
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      await logActivity("folder.deleted", "folder", id, {});
      await notifyTeam(`${user?.full_name ?? "Someone"} deleted folder "${folder?.name ?? ""}"`, "folder.deleted", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["folder-contents"] }),
  });
}

export function useRestoreFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("folders")
        .update({ is_deleted: false, deleted_at: null })
        .eq("id", id);
      if (error) throw error;
      await logActivity("folder.restored", "folder", id, {});
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["folder-contents"] }),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["folder-contents"] }),
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
