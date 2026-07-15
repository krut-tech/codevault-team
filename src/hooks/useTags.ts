import { useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import type { Tag } from "@/types";

export function useTags() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tags").select("*").order("name");
      if (error) throw error;
      return data as Tag[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("tags-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "tags" }, () => qc.invalidateQueries({ queryKey: ["tags"] }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  return query;
}

export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, color }: { name: string; color?: string }) => {
      const { data, error } = await supabase.from("tags").insert({ name, color: color ?? "#6366F1" }).select().single();
      if (error) throw error;
      return data as Tag;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tags"] }),
  });
}

// ---------- Folder tags ----------

export function useFolderTags(folderId: string) {
  return useQuery({
    queryKey: ["folder-tags", folderId],
    queryFn: async () => {
      const { data, error } = await supabase.from("folder_tags").select("tag_id, tags(*)").eq("folder_id", folderId);
      if (error) throw error;
      return data.map((d: any) => d.tags as Tag);
    },
  });
}

export function useAssignTagToFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ folderId, tagId }: { folderId: string; tagId: string }) => {
      const { error } = await supabase.from("folder_tags").insert({ folder_id: folderId, tag_id: tagId });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["folder-tags", vars.folderId] }),
  });
}

export function useRemoveTagFromFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ folderId, tagId }: { folderId: string; tagId: string }) => {
      const { error } = await supabase.from("folder_tags").delete().eq("folder_id", folderId).eq("tag_id", tagId);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["folder-tags", vars.folderId] }),
  });
}

// ---------- File tags ----------

export function useFileTags(fileId: string) {
  return useQuery({
    queryKey: ["file-tags", fileId],
    queryFn: async () => {
      const { data, error } = await supabase.from("file_tags").select("tag_id, tags(*)").eq("file_id", fileId);
      if (error) throw error;
      return data.map((d: any) => d.tags as Tag);
    },
  });
}

export function useAssignTagToFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ fileId, tagId }: { fileId: string; tagId: string }) => {
      const { error } = await supabase.from("file_tags").insert({ file_id: fileId, tag_id: tagId });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["file-tags", vars.fileId] }),
  });
}

export function useRemoveTagFromFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ fileId, tagId }: { fileId: string; tagId: string }) => {
      const { error } = await supabase.from("file_tags").delete().eq("file_id", fileId).eq("tag_id", tagId);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["file-tags", vars.fileId] }),
  });
}
