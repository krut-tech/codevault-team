// Supabase Edge Function: remove-team-member
//
// The previous implementation deleted a user by running
// `DELETE FROM public.users WHERE id = ...` directly from the browser
// with the caller's own (non-service-role) credentials. That was broken
// two different ways:
//
//   1. public.users.created_by / files.created_by / folders.created_by /
//      comments.user_id / versions.edited_by / activity_logs.user_id all
//      reference public.users(id) with the default ON DELETE NO ACTION.
//      Any user who has ever created a folder or file — i.e. virtually
//      every real team member — could NOT be deleted at all: Postgres
//      rejects the delete with a foreign-key violation, and the calling
//      code had no onError handler, so the button silently did nothing.
//
//   2. Even on an account with zero content, deleting only the
//      public.users row does NOT delete the underlying Supabase Auth
//      user. auth.users -> public.users cascades one direction only.
//      The "removed" person keeps a fully valid session/JWT, and every
//      RLS policy on shared tables only checks `auth.uid() is not null`
//      — so they'd retain full read/write access to every file, folder,
//      project, etc. forever. "Remove user" did not revoke access.
//
// This function runs with the service role, so it can:
//   - Reassign that user's authored content to NULL (so FK constraints
//     don't block deletion — content stays, ownership is cleared)
//   - Delete the actual Supabase Auth user via the Admin API, which
//     cascades to public.users (which has ON DELETE CASCADE from
//     auth.users) and to favorites/notifications (also cascade).
//
// Deploy: supabase functions deploy remove-team-member

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const callerToken = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Client scoped to the caller's own token, used only to verify identity/role.
    const callerClient = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: `Bearer ${callerToken}` } },
    });
    const {
      data: { user: caller },
    } = await callerClient.auth.getUser(callerToken);
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data: callerProfile } = await admin.from("users").select("role").eq("id", caller.id).single();
    if (callerProfile?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), { status: 403 });
    }

    const { userId } = await req.json();
    if (!userId) {
      return new Response(JSON.stringify({ error: "userId is required" }), { status: 400 });
    }
    if (userId === caller.id) {
      return new Response(JSON.stringify({ error: "You cannot remove your own account" }), { status: 400 });
    }

    // Clear ownership on their content instead of blocking on FK violations —
    // the files/folders/etc. stay in the vault, just unattributed.
    const ownedTables = ["languages", "projects", "folders", "files", "versions", "comments", "activity_logs"];
    for (const table of ownedTables) {
      const column = table === "versions" ? "edited_by" : table === "comments" || table === "activity_logs" ? "user_id" : "created_by";
      await admin.from(table).update({ [column]: null }).eq(column, userId);
    }

    // Deleting the Auth user cascades to public.users (ON DELETE CASCADE)
    // and revokes all of their active sessions/tokens immediately.
    const { error: deleteErr } = await admin.auth.admin.deleteUser(userId);
    if (deleteErr) throw deleteErr;

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
