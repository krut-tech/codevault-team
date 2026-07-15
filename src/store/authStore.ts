import { create } from "zustand";
import type { AppUser } from "@/types";
import { supabase } from "@/lib/supabaseClient";

interface AuthState {
  user: AppUser | null;
  loading: boolean;
  isAdmin: boolean;
  setUser: (u: AppUser | null) => void;
  hydrate: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  isAdmin: false,

  setUser: (u) => set({ user: u, isAdmin: u?.role === "admin", loading: false }),

  hydrate: async () => {
    set({ loading: true });
    const { data: sessionData } = await supabase.auth.getSession();
    const authUser = sessionData.session?.user;
    if (!authUser) {
      set({ user: null, isAdmin: false, loading: false });
      return;
    }
    const { data: profile } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single();
    if (profile) {
      get().setUser(profile as AppUser);
    } else {
      set({ loading: false });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAdmin: false });
  },
}));

// Keep store in sync with Supabase auth events
supabase.auth.onAuthStateChange((_event, session) => {
  if (!session?.user) {
    useAuthStore.getState().setUser(null);
  } else {
    useAuthStore.getState().hydrate();
  }
});
