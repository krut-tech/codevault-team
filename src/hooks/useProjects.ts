import { useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import type { ProjectRow } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { logActivity } from "@/hooks/useActivityLog";
import { notifyTeam } from "@/hooks/useTeamNotify";

export function useProjects() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*, languages:language_id(name, color)")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as (ProjectRow & { languages: { name: string; color: string } | null })[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("projects-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, () => qc.invalidateQueries({ queryKey: ["projects"] }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  return query;
}

export function useCreateProject() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: async (params: { name: string; description?: string; languageId?: string | null }) => {
      const { data, error } = await supabase
        .from("projects")
        .insert({ name: params.name, description: params.description ?? null, language_id: params.languageId ?? null, created_by: user?.id })
        .select()
        .single();
      if (error) throw error;
      await logActivity("project.created", "project", data.id, { name: params.name });
      await notifyTeam(`${user?.full_name ?? "Someone"} created project "${params.name}"`, "project.created", data.id);
      return data as ProjectRow;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
      await logActivity("project.deleted", "project", id, {});
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}
