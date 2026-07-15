import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import type { FolderRow } from "@/types";

export function useFolderPath(folderId: string | null) {
  return useQuery({
    queryKey: ["folder-path", folderId],
    queryFn: async () => {
      const path: FolderRow[] = [];
      let currentId: string | null = folderId;
      while (currentId) {
        const { data, error } = await supabase.from("folders").select("*").eq("id", currentId).single();
        if (error) break;
        path.unshift(data as FolderRow);
        currentId = (data as FolderRow).parent_folder_id;
      }
      return path;
    },
    enabled: !!folderId,
  });
}
