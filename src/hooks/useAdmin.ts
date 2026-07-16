import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import type { AppUser, Role } from "@/types";
import { logActivity } from "@/hooks/useActivityLog";

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

export function useRemoveUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Deleting a team member must go through a service-role edge function:
      // it needs to (a) deprovision the actual Supabase Auth account so
      // access is really revoked, not just hidden in the UI, and (b) clear
      // FK references on their content first so the delete doesn't get
      // rejected outright. See supabase/functions/remove-team-member.
      const { data, error } = await supabase.functions.invoke("remove-team-member", {
        body: { userId: id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["team-users"] }),
  });
}
