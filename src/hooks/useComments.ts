import { useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/store/authStore";
import { logActivity } from "@/hooks/useActivityLog";
import { notifyTeam } from "@/hooks/useTeamNotify";

export function useComments(fileId?: string, folderId?: string) {
  const qc = useQueryClient();
  const key = ["comments", fileId ?? folderId];

  const query = useQuery({
    queryKey: key,
    enabled: !!(fileId || folderId),
    queryFn: async () => {
      let q = supabase.from("comments").select("*, users:user_id(full_name)").order("created_at");
      q = fileId ? q.eq("file_id", fileId) : q.eq("folder_id", folderId!);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!fileId && !folderId) return;
    const channel = supabase
      .channel(`comments-${fileId ?? folderId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, () => qc.invalidateQueries({ queryKey: key }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId, folderId, qc]);

  return query;
}

export function useAddComment() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: async ({ fileId, folderId, content }: { fileId?: string; folderId?: string; content: string }) => {
      const { data, error } = await supabase
        .from("comments")
        .insert({ file_id: fileId ?? null, folder_id: folderId ?? null, user_id: user?.id, content })
        .select()
        .single();
      if (error) throw error;
      await logActivity("comment.added", fileId ? "file" : "folder", fileId ?? folderId ?? null, {});
      const preview = content.length > 60 ? `${content.slice(0, 60)}…` : content;
      await notifyTeam(
        `${user?.full_name ?? "Someone"} commented: "${preview}"`,
        "comment.added",
        fileId ?? folderId ?? null
      );
      return data;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["comments", vars.fileId ?? vars.folderId] }),
  });
}
