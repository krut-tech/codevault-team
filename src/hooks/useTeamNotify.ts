import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/store/authStore";

/**
 * Notifies every OTHER team member (not the actor) about an event.
 * Since this is a 4-person trusted team with no follow/subscription model,
 * every shared-content event fans out to all other users' notification feed.
 */
export async function notifyTeam(message: string, type: string, relatedId: string | null = null) {
  const actorId = useAuthStore.getState().user?.id;
  const { data: users, error } = await supabase.from("users").select("id").neq("id", actorId ?? "");
  if (error || !users) {
    console.error("notifyTeam: failed to fetch team members", error);
    return;
  }

  const rows = users.map((u) => ({
    user_id: u.id,
    type,
    message,
    related_id: relatedId,
  }));
  if (rows.length > 0) {
    const { error: insertErr } = await supabase.from("notifications").insert(rows);
    if (insertErr) {
      // Don't let a notification failure look like nothing happened —
      // surface it so RLS/permission regressions are caught in QA instead
      // of silently disappearing (see 002_notifications_rls_fix.sql).
      console.error("notifyTeam: insert failed", insertErr);
    }
  }
}
