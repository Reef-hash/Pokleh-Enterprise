import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { withTimeout } from "@/lib/withTimeout";
import type { User, Session } from "@supabase/supabase-js";

const AUTH_TIMEOUT_MS = 8000;

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  name: string;
  role: "admin" | "staff";
  onboarding_completed?: boolean;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  restartTour: () => void;
  _restartTourFn: (() => void) | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name: string, role: "admin" | "staff") => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  restoreSession: () => Promise<void>;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
  isStaff: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  loading: true,
  initialized: false,
  _restartTourFn: null,

  restartTour: () => {
    const fn = get()._restartTourFn;
    if (fn) fn();
  },

  isAuthenticated: () => !!get().user && !!get().profile,
  isAdmin: () => get().profile?.role === "admin",
  isStaff: () => get().profile?.role === "staff",

  restoreSession: async () => {
    set({ loading: true });
    try {
      const { data: sessionData } = await withTimeout(supabase.auth.getSession(), AUTH_TIMEOUT_MS);
      const session = sessionData.session;

      if (session?.user) {
        const { data: profile, error: profileError } = await withTimeout(
          supabase.from("profiles").select("*").eq("user_id", session.user.id).single(),
          AUTH_TIMEOUT_MS
        );

        if (profileError) throw profileError;

        set({
          user: session.user,
          session,
          profile: profile as unknown as UserProfile,
          loading: false,
          initialized: true,
        });
      } else {
        set({ loading: false, initialized: true });
      }

      supabase.auth.onAuthStateChange(async (_event, session) => {
        set({ session, user: session?.user ?? null });
        if (session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", session.user.id)
            .single();
          set({ profile: profile as unknown as UserProfile });
        } else {
          set({ profile: null });
        }
      });
    } catch {
      set({ user: null, session: null, profile: null, loading: false, initialized: true });
    }
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { success: false, error: error.message };
    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", data.user.id)
        .single();
      set({ user: data.user, session: data.session, profile: profile as unknown as UserProfile });
      return { success: true };
    }
    return { success: false, error: "Login failed" };
  },

  signUp: async (email, password, name, role) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role } },
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  signOut: async () => {
    await supabase.auth.signOut({ scope: "global" });
    set({ user: null, session: null, profile: null });
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("supabase.auth.") || key.includes("sb-"))
        localStorage.removeItem(key);
    });
  },
}));
