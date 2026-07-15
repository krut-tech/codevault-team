import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

const BUCKET = "codevault-files";

export function useFileSignedUrl(storagePath: string | undefined) {
  return useQuery({
    queryKey: ["file-signed-url", storagePath],
    enabled: !!storagePath,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath!, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
    staleTime: 1000 * 60 * 50,
  });
}
