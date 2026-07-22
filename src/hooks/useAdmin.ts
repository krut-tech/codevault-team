import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import type { AppUser, Role } from "@/types";
import { logActivity } from "@/hooks/useActivityLog";
import { notifyTeam } from "@/hooks/useTeamNotify";
import { useAuthStore } from "@/store/authStore";

export function useTeamUsers() {
  return useQuery({
    queryKey: ["team-users"],
    queryFn: async () => {
      const { data, error } = await supabase.from("users").select("*").order("created_at");
      if (error) throw error;
      return data as AppUser[];
    },
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: Role }) => {
      const { error } = await supabase.from("users").update({ role }).eq("id", id);
      if (error) throw error;
      await logActivity("user.role_changed", "user", id, { role });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["team-users"] }),
  });
}

export function useAddTeamMember() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: async (input: { email: string; fullName: string; password?: string; role: Role }) => {
      // Creating a team member must go through a service-role edge function:
      // it needs to (a) actually create the Supabase Auth account (auth.users
      // isn't writable by a normal client session), and (b) insert the
      // matching public.users profile row, since there's no auth trigger or
      // self-signup flow doing that automatically. See
      // supabase/functions/add-team-member.
      const { data, error } = await supabase.functions.invoke("add-team-member", {
        body: input,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      await logActivity("user.added", "user", data.id, { email: input.email, role: input.role });
      await notifyTeam(`${user?.full_name ?? "Someone"} added ${input.fullName} to the team`, "user.added", data.id);
      return data as { id: string; email: string; password: string };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["team-users"] }),
  });
}

export function useRemoveUser() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: async (id: string) => {
      // Deleting a team member must go through a service-role edge function:
      // it needs to (a) deprovision the actual Supabase Auth account so
      // access is really revoked, not just hidden in the UI, and (b) clear
      // FK references on their content first so the delete doesn't get
      // rejected outright. See supabase/functions/remove-team-member.
      const { data: removedUser } = await supabase.from("users").select("full_name").eq("id", id).single();
      const { data, error } = await supabase.functions.invoke("remove-team-member", {
        body: { userId: id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      await logActivity("user.removed", "user", id, {});
      await notifyTeam(`${user?.full_name ?? "Someone"} removed ${removedUser?.full_name ?? "a team member"} from the team`, "user.removed", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["team-users"] }),
  });
}
