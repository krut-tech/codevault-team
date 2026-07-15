import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import type { FolderRow, FileRow } from "@/types";

export function useSearch(query: string) {
  return useQuery({
    queryKey: ["search", query],
    enabled: query.trim().length > 1,
    queryFn: async () => {
      const [{ data: folders }, { data: files }] = await Promise.all([
        supabase.from("folders").select("*").eq("is_deleted", false).ilike("name", `%${query}%`).limit(30),
        supabase.from("files").select("*").eq("is_deleted", false).ilike("name", `%${query}%`).limit(30),
      ]);
      return { folders: (folders ?? []) as FolderRow[], files: (files ?? []) as FileRow[] };
    },
  });
}
