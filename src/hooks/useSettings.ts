import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/store/authStore";

export function useSetting<T = unknown>(key: string) {
  return useQuery({
    queryKey: ["settings", key],
    queryFn: async () => {
      const { data, error } = await supabase.from("settings").select("*").eq("key", key).maybeSingle();
      if (error) throw error;
      return (data?.value ?? null) as T | null;
    },
  });
}

export function useUpdateSetting() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: unknown }) => {
      const { error } = await supabase.from("settings").upsert({
        key,
        value,
        updated_by: user?.id,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["settings", vars.key] }),
  });
}
