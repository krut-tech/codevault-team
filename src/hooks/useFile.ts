import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import type { FileRow } from "@/types";
import { logActivity } from "@/hooks/useActivityLog";
import { useAuthStore } from "@/store/authStore";

export function useFile(fileId: string | undefined) {
  return useQuery({
    queryKey: ["file", fileId],
    enabled: !!fileId,
    queryFn: async () => {
      const { data, error } = await supabase.from("files").select("*").eq("id", fileId).single();
      if (error) throw error;
      return data as FileRow;
    },
  });
}

export function useSaveFile() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const { error: updateErr } = await supabase
        .from("files")
        .update({ content, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (updateErr) throw updateErr;

      const { error: versionErr } = await supabase.from("versions").insert({
        file_id: id,
        content,
        edited_by: user?.id,
      });
      if (versionErr) throw versionErr;

      await logActivity("file.edited", "file", id, {});
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["file", vars.id] });
      qc.invalidateQueries({ queryKey: ["file-versions", vars.id] });
    },
  });
}

export function useFileVersions(fileId: string | undefined) {
  return useQuery({
    queryKey: ["file-versions", fileId],
    enabled: !!fileId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("versions")
        .select("*, users:edited_by(full_name)")
        .eq("file_id", fileId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
