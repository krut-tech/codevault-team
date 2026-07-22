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
      if (error) {
        // supabase-js hides the actual JSON body behind a generic "Edge
        // Function returned a non-2xx status code" message on
        // FunctionsHttpError. The real error text lives on error.context
        // (the raw Response) — read it and surface that instead.
        let detail = error.message;
        try {
          const body = await (error as any).context?.json();
          if (body?.error) detail = body.error;
        } catch {
          // context wasn't JSON or already consumed — fall back silently
        }
        throw new Error(detail);
      }
      if (data?.error) throw new Error(data.error);
      return data as RunCodeResult;
    },
  });
}
