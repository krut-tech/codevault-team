import { useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import type { Language } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { logActivity } from "@/hooks/useActivityLog";
import { notifyTeam } from "@/hooks/useTeamNotify";

export function useLanguages() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["languages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("languages").select("*").order("name");
      if (error) throw error;
      return data as Language[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("languages-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "languages" }, () => {
        qc.invalidateQueries({ queryKey: ["languages"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return query;
}

export function useLanguage(id: string | null) {
  return useQuery({
    queryKey: ["language", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("languages").select("*").eq("id", id).single();
      if (error) throw error;
      return data as Language;
    },
    enabled: !!id,
  });
}

export function useCreateLanguage() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: async (params: { name: string; color?: string; icon?: string }) => {
      const { data, error } = await supabase
        .from("languages")
        .insert({ name: params.name, color: params.color ?? "#6366F1", icon: params.icon ?? null, created_by: user?.id })
        .select()
        .single();
      if (error) throw error;
      await logActivity("language.created", "language", data.id, { name: params.name });
      await notifyTeam(`${user?.full_name ?? "Someone"} added language "${params.name}"`, "language.created", data.id);
      return data as Language;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["languages"] }),
  });
}

export function useDeleteLanguage() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: language } = await supabase.from("languages").select("name").eq("id", id).single();
      const { error } = await supabase.from("languages").delete().eq("id", id);
      if (error) throw error;
      await logActivity("language.deleted", "language", id, {});
      await notifyTeam(`${user?.full_name ?? "Someone"} deleted language "${language?.name ?? ""}"`, "language.deleted", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["languages"] }),
  });
}
