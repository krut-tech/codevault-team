import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/store/authStore";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ActivityLogRow } from "@/types";

export async function logActivity(
  action: string,
  entityType: string,
  entityId: string | null,
  metadata: Record<string, unknown> = {}
) {
  const user = useAuthStore.getState().user;
  const { error } = await supabase.from("activity_logs").insert({
    user_id: user?.id ?? null,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata,
  });
  if (error) console.error("logActivity: insert failed", error);
}

// Admin-only: live activity feed
export function useActivityLogs() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["activity-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*, users:user_id(full_name, avatar_url)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as (ActivityLogRow & { users: { full_name: string; avatar_url: string | null } | null })[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("activity-logs-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_logs" }, () => {
        qc.invalidateQueries({ queryKey: ["activity-logs"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return query;
}
