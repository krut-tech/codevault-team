import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

export interface RunCodeResult {
  output: string;
  error: string | null;
  statusCode: number;
  memory?: string;
  cpuTime?: string;
  isExecutionSuccess?: boolean;
  isCompiled?: boolean;
}

export function useRunCode() {
  return useMutation({
    mutationFn: async (input: { script: string; language: string; versionIndex: string; stdin?: string }) => {
      const { data, error } = await supabase.functions.invoke("run-code", { body: input });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as RunCodeResult;
    },
  });
}
