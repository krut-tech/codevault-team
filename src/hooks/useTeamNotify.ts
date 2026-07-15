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
  if (error || !users) return;

  const rows = users.map((u) => ({
    user_id: u.id,
    type,
    message,
    related_id: relatedId,
  }));
  if (rows.length > 0) {
    await supabase.from("notifications").insert(rows);
  }
}
