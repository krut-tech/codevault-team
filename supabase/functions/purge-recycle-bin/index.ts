// Supabase Edge Function: purge-recycle-bin
//
// Permanently deletes folders/files that have been soft-deleted for longer
// than the configured retention window (settings.recycle_bin_retention_days,
// default 30). Intended to run on a schedule (see Deployment Guide).
//
// Deploy:   supabase functions deploy purge-recycle-bin
// Schedule: supabase functions schedule purge-recycle-bin --cron "0 3 * * *"
//           (or wire it up via the Supabase Dashboard -> Edge Functions -> Cron)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (_req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    // Service role key is required to bypass RLS for a hard delete sweep.
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: setting } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "recycle_bin_retention_days")
      .maybeSingle();

    const retentionDays = typeof setting?.value === "number" ? setting.value : 30;
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();

    const { data: expiredFiles } = await supabase
      .from("files")
      .select("id, storage_path")
      .eq("is_deleted", true)
      .lt("deleted_at", cutoff);

    for (const file of expiredFiles ?? []) {
      await supabase.storage.from("codevault-files").remove([file.storage_path]);
      await supabase.from("files").delete().eq("id", file.id);
    }

    const { data: expiredFolders } = await supabase
      .from("folders")
      .select("id")
      .eq("is_deleted", true)
      .lt("deleted_at", cutoff);

    for (const folder of expiredFolders ?? []) {
      // ON DELETE CASCADE on folders.parent_folder_id / files.folder_id
      // takes care of any remaining nested content.
      await supabase.from("folders").delete().eq("id", folder.id);
    }

    return new Response(
      JSON.stringify({
        purged_files: expiredFiles?.length ?? 0,
        purged_folders: expiredFolders?.length ?? 0,
        retention_days: retentionDays,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
