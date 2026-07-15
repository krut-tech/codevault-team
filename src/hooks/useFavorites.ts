import { useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/store/authStore";

export function useFavorites() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["favorites", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("*, folders:folder_id(id,name,updated_at), files:file_id(id,name,updated_at,extension)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`favorites-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "favorites", filter: `user_id=eq.${user.id}` }, () => {
        qc.invalidateQueries({ queryKey: ["favorites", user.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, qc]);

  return query;
}

export function useIsFavorited(folderId?: string, fileId?: string) {
  const { data } = useFavorites();
  return data?.some((f: any) => (folderId && f.folder_id === folderId) || (fileId && f.file_id === fileId)) ?? false;
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: async ({ folderId, fileId, isFavorited, favoriteId }: { folderId?: string; fileId?: string; isFavorited: boolean; favoriteId?: string }) => {
      if (isFavorited && favoriteId) {
        const { error } = await supabase.from("favorites").delete().eq("id", favoriteId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("favorites").insert({
          user_id: user?.id,
          folder_id: folderId ?? null,
          file_id: fileId ?? null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["favorites"] }),
  });
}
