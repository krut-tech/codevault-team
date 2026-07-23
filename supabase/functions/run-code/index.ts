// Supabase Edge Function: run-code
//
// The Editor's "Run" button (src/pages/Editor.tsx), useRunCode.ts, and
// runLang.ts have all been wired up on the frontend to call
// `supabase.functions.invoke("run-code", { body: { script, language,
// versionIndex, stdin } })` — but this function itself never existed.
// In production, every click of "Run" fails with a "function not found"
// error. This is that function: a thin, authenticated proxy in front of
// the JDoodle Online Compiler API (https://www.jdoodle.com/compiler-api).
//
// Why a proxy instead of calling JDoodle directly from the browser:
//   - JDoodle's clientId/clientSecret are account credentials, not
//     publishable keys — they must never reach the client bundle.
//   - It gives us one place to enforce auth (only logged-in team members
//     can execute code), a script size cap, and to translate JDoodle's
//     own quota/error responses into something the Editor can show the
//     user cleanly.
//
// Required secrets (set via `supabase secrets set`):
//   JDOODLE_CLIENT_ID
//   JDOODLE_CLIENT_SECRET
//
// Deploy: supabase functions deploy run-code

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// JDoodle rejects scripts above roughly this size anyway; capping here
// gives a fast, clear error instead of a slow round-trip that fails.
const MAX_SCRIPT_BYTES = 64 * 1024; // 64KB
const MAX_STDIN_BYTES = 16 * 1024; // 16KB

const ALLOWED_LANGUAGES = new Set([
  "java",
  "python3",
  "c",
  "cpp17",
  "csharp",
  "nodejs",
  "typescript",
  "php",
  "go",
  "rust",
  "sql",
]);

function byteLength(s: string) {
  return new TextEncoder().encode(s).length;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
    }

    // --- Auth check -------------------------------------------------
    // Anyone invoking this must be a signed-in team member. There's no
    // service-role work needed here (unlike add/remove-team-member) —
    // we just need to confirm the caller has a valid session before we
    // spend JDoodle quota on their behalf.
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

    // --- Parse + validate input --------------------------------------
    const body = await req.json();
    const script = typeof body.script === "string" ? body.script : "";
    const language = typeof body.language === "string" ? body.language : "";
    const versionIndex = typeof body.versionIndex === "string" ? body.versionIndex : "";
    const stdin = typeof body.stdin === "string" ? body.stdin : "";

    if (!script.trim()) {
      return new Response(JSON.stringify({ error: "No code to run" }), { status: 400 });
    }
    if (!ALLOWED_LANGUAGES.has(language)) {
      return new Response(JSON.stringify({ error: `Unsupported language: ${language}` }), { status: 400 });
    }
    if (!versionIndex) {
      return new Response(JSON.stringify({ error: "Missing versionIndex" }), { status: 400 });
    }
    if (byteLength(script) > MAX_SCRIPT_BYTES) {
      return new Response(
        JSON.stringify({ error: `Script exceeds the ${MAX_SCRIPT_BYTES / 1024}KB run limit.` }),
        { status: 413 }
      );
    }
    if (byteLength(stdin) > MAX_STDIN_BYTES) {
      return new Response(
        JSON.stringify({ error: `stdin exceeds the ${MAX_STDIN_BYTES / 1024}KB limit.` }),
        { status: 413 }
      );
    }

    // --- JDoodle credentials ------------------------------------------
    const clientId = Deno.env.get("JDOODLE_CLIENT_ID");
    const clientSecret = Deno.env.get("JDOODLE_CLIENT_SECRET");
    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ error: "Code execution is not configured (missing JDoodle credentials)." }),
        { status: 500 }
      );
    }

    // --- Call JDoodle ---------------------------------------------------
    const jdoodleRes = await fetch("https://api.jdoodle.com/v1/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        clientSecret,
        script,
        language,
        versionIndex,
        stdin,
      }),
    });

    let jdoodleBody: any = null;
    try {
      jdoodleBody = await jdoodleRes.json();
    } catch {
      // Non-JSON response from JDoodle (rare, but don't crash on it).
    }

    // JDoodle quota handling: on the free tier, once the daily credit
    // limit is used up it responds with a 200 body containing an
    // `error` field (not an HTTP error code), e.g. "you have exceeded
    // today's usage. Please try after sometime." It can also return a
    // real 429/401 if credentials are exhausted/invalid. Normalize all
    // of these into a clean, quota-specific error the Editor can show.
    const quotaMessage: string | undefined = jdoodleBody?.error;
    const looksLikeQuota =
      jdoodleRes.status === 429 ||
      (typeof quotaMessage === "string" &&
        /quota|exceed|limit|credit/i.test(quotaMessage));

    if (looksLikeQuota) {
      return new Response(
        JSON.stringify({
          error: "The code execution quota has been used up for now. Please try again later.",
        }),
        { status: 429 }
      );
    }

    if (!jdoodleRes.ok || !jdoodleBody) {
      return new Response(
        JSON.stringify({ error: quotaMessage || `Execution service returned status ${jdoodleRes.status}` }),
        { status: 502 }
      );
    }
    if (quotaMessage) {
      // Any other JDoodle-reported error (bad language/version combo, etc).
      return new Response(JSON.stringify({ error: quotaMessage }), { status: 400 });
    }

    return new Response(
      JSON.stringify({
        output: jdoodleBody.output ?? "",
        error: null,
        statusCode: jdoodleBody.statusCode ?? jdoodleRes.status,
        memory: jdoodleBody.memory,
        cpuTime: jdoodleBody.cpuTime,
        isExecutionSuccess: jdoodleBody.isExecutionSuccess,
        isCompiled: jdoodleBody.isCompiled,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
