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
      const { error } = await supabase.from("users").delete().eq("id", id);
      if (error) throw error;
      await logActivity("user.removed", "user", id, {});
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["team-users"] }),
  });
}
