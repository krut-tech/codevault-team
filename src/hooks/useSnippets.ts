import { useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/store/authStore";
import { logActivity } from "@/hooks/useActivityLog";

export interface SnippetRow {
  id: string;
  title: string;
  language: string;
  code: string;
  description: string | null;
  folder_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useSnippets() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["snippets"],
    queryFn: async () => {
      const { data, error } = await supabase.from("snippets").select("*").order("updated_at", { ascending: false });
      if (error) throw error;
      return data as SnippetRow[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("snippets-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "snippets" }, () => qc.invalidateQueries({ queryKey: ["snippets"] }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  return query;
}

export function useCreateSnippet() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: async (params: { title: string; language: string; code: string; description?: string }) => {
      const { data, error } = await supabase
        .from("snippets")
        .insert({ ...params, created_by: user?.id })
        .select()
        .single();
      if (error) throw error;
      await logActivity("snippet.created", "snippet", data.id, { title: params.title });
      return data as SnippetRow;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["snippets"] }),
  });
}

export function useDeleteSnippet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("snippets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["snippets"] }),
  });
}
