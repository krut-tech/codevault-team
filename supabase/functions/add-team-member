// Supabase Edge Function: add-team-member
//
// There is no self-signup flow in this app (see src/pages/Login.tsx — only
// sign-in, no sign-up route in App.tsx). Accounts are provisioned by an
// admin. This function is the in-app equivalent of Dashboard ->
// Authentication -> Users -> Add User, callable from /admin/users.
//
// It must run with the service role because two things a normal client
// session can never do:
//   1. Create a Supabase Auth user (auth.users is not writable by
//      anon/authenticated roles at all).
//   2. There is no DB trigger syncing auth.users -> public.users in this
//      project, so the public.users profile row (id, email, full_name,
//      role) has to be inserted explicitly right after the auth user is
//      created, or the new member's session will hydrate to a missing
//      profile and authStore.hydrate() will leave them stuck logged out
//      (see src/store/authStore.ts).
//
// Mirrors the auth/authorization pattern used by remove-team-member.
//
// Deploy: supabase functions deploy add-team-member

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function randomPassword() {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return btoa(String.fromCharCode(...bytes))
    .replace(/[+/=]/g, "")
    .slice(0, 16);
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const callerToken = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

    const body = await req.json();
    const email = (body.email ?? "").trim().toLowerCase();
    const fullName = (body.fullName ?? "").trim();
    const role = body.role === "admin" ? "admin" : "user";
    const password = (body.password ?? "").trim() || randomPassword();

    if (!email || !fullName) {
      return new Response(JSON.stringify({ error: "email and fullName are required" }), { status: 400 });
    }
    if (password.length < 8) {
      return new Response(JSON.stringify({ error: "Password must be at least 8 characters" }), { status: 400 });
    }

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (createErr) {
      const msg = createErr.message.includes("already been registered")
        ? "A user with this email already exists"
        : createErr.message;
      return new Response(JSON.stringify({ error: msg }), { status: 400 });
    }

    const newUserId = created.user.id;
    const { error: profileErr } = await admin.from("users").insert({
      id: newUserId,
      email,
      full_name: fullName,
      role,
    });
    if (profileErr) {
      await admin.auth.admin.deleteUser(newUserId);
      return new Response(JSON.stringify({ error: profileErr.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, id: newUserId, email, password }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
