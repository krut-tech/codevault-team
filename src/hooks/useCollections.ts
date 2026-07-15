import { useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/store/authStore";

export interface CollectionRow {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  created_by: string | null;
  created_at: string;
}

export function useCollections() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["collections"],
    queryFn: async () => {
      const { data, error } = await supabase.from("collections").select("*").order("name");
      if (error) throw error;
      return data as CollectionRow[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("collections-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "collections" }, () => qc.invalidateQueries({ queryKey: ["collections"] }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  return query;
}

export function useCreateCollection() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: async (params: { name: string; description?: string; color?: string }) => {
      const { data, error } = await supabase
        .from("collections")
        .insert({ name: params.name, description: params.description ?? null, color: params.color ?? "#6366F1", created_by: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data as CollectionRow;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["collections"] }),
  });
}

export function useCollectionFolders(collectionId: string) {
  return useQuery({
    queryKey: ["collection-folders", collectionId],
    enabled: !!collectionId,
    queryFn: async () => {
      const { data, error } = await supabase.from("collection_folders").select("folder_id, folders(*)").eq("collection_id", collectionId);
      if (error) throw error;
      return data.map((d: any) => d.folders);
    },
  });
}

export function useAddFolderToCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ collectionId, folderId }: { collectionId: string; folderId: string }) => {
      const { error } = await supabase.from("collection_folders").insert({ collection_id: collectionId, folder_id: folderId });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["collection-folders", vars.collectionId] }),
  });
}

export function useRemoveFolderFromCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ collectionId, folderId }: { collectionId: string; folderId: string }) => {
      const { error } = await supabase.from("collection_folders").delete().eq("collection_id", collectionId).eq("folder_id", folderId);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["collection-folders", vars.collectionId] }),
  });
}

export function useDeleteCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("collections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["collections"] }),
  });
}
