import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase env vars missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env"
  );
}

const REMEMBER_ME_KEY = "codevault:remember-me";

/**
 * "Remember me" preference, set by the login form BEFORE signInWithPassword
 * is called. Defaults to true (persist across browser restarts) so existing
 * behavior is unchanged unless the user explicitly opts out.
 */
export function setRememberMe(remember: boolean) {
  try {
    localStorage.setItem(REMEMBER_ME_KEY, remember ? "1" : "0");
  } catch {
    // localStorage unavailable (e.g. private mode) — fall back to persistent behavior
  }
}

function rememberMeEnabled(): boolean {
  try {
    return localStorage.getItem(REMEMBER_ME_KEY) !== "0";
  } catch {
    return true;
  }
}

// Routes Supabase's session storage to localStorage (persists across browser
// restarts) or sessionStorage (cleared when the tab closes) based on the
// "remember me" preference captured at sign-in time.
const conditionalStorage = {
  getItem: (key: string) => (rememberMeEnabled() ? localStorage.getItem(key) : sessionStorage.getItem(key)),
  setItem: (key: string, value: string) =>
    rememberMeEnabled() ? localStorage.setItem(key, value) : sessionStorage.setItem(key, value),
  removeItem: (key: string) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: conditionalStorage,
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
});
