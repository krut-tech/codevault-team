import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

/**
 * Sums `size_bytes` across all non-deleted files.
 * (Reading directly from the `files` table is far cheaper than walking
 * the Storage bucket recursively, and stays accurate since every upload
 * writes `size_bytes` at insert time.)
 */
export function useStorageUsed() {
  return useQuery({
    queryKey: ["storage-used"],
    queryFn: async () => {
      const { data, error } = await supabase.from("files").select("size_bytes").eq("is_deleted", false);
      if (error) throw error;
      return (data ?? []).reduce((sum, f) => sum + (f.size_bytes ?? 0), 0);
    },
  });
}
