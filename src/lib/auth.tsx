"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getSupabase, supabaseConfigured } from "./supabase";
import { resetInvitationCheck } from "./store";

export type User = { id: string; email: string; name: string };
type Mode = "supabase" | "demo";

type AuthState = {
  ready: boolean;
  user: User | null;
  mode: Mode | null;
  configured: boolean;
  signInWithProvider: (provider: "google" | "github") => Promise<string | null>;
  signInWithEmail: (email: string) => Promise<string | null>;
  startDemo: () => void;
  signOut: () => Promise<void>;
};

const DEMO_KEY = "alpha.demo-user";
const AuthContext = createContext<AuthState | null>(null);

function readDemoUser(): User | null {
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [mode, setMode] = useState<Mode | null>(null);

  useEffect(() => {
    const demo = readDemoUser();
    if (demo) {
      setUser(demo);
      setMode("demo");
      setReady(true);
      return;
    }
    const sb = getSupabase();
    if (!sb) {
      setReady(true);
      return;
    }
    const apply = (s: { user: { id: string; email?: string; user_metadata?: Record<string, unknown> } } | null) => {
      if (s?.user) {
        const meta = s.user.user_metadata ?? {};
        const email = s.user.email ?? "";
        setUser({ id: s.user.id, email, name: (meta.full_name as string) || (meta.name as string) || email.split("@")[0] });
        setMode("supabase");
      } else {
        setUser(null);
        setMode(null);
      }
    };
    sb.auth.getSession().then(({ data }) => {
      apply(data.session);
      setReady(true);
    });
    const { data: sub } = sb.auth.onAuthStateChange((e, session) => {
      if (e === "SIGNED_IN" || e === "SIGNED_OUT") resetInvitationCheck();
      apply(session);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signInWithProvider = useCallback(async (provider: "google" | "github") => {
    const sb = getSupabase();
    if (!sb) return "Sign-in isn't configured. Use demo mode.";
    const { error } = await sb.auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}/home` } });
    return error ? error.message : null;
  }, []);

  const signInWithEmail = useCallback(async (email: string) => {
    const sb = getSupabase();
    if (!sb) return "Sign-in isn't configured. Use demo mode.";
    const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/home` } });
    return error ? error.message : null;
  }, []);

  const startDemo = useCallback(() => {
    const demo: User = { id: "demo-user", email: "demo@architect.local", name: "Demo builder" };
    localStorage.setItem(DEMO_KEY, JSON.stringify(demo));
    setUser(demo);
    setMode("demo");
  }, []);

  const signOut = useCallback(async () => {
    if (mode === "demo") {
      localStorage.removeItem(DEMO_KEY);
    } else {
      await getSupabase()?.auth.signOut();
    }
    setUser(null);
    setMode(null);
  }, [mode]);

  const value = useMemo(
    () => ({ ready, user, mode, configured: supabaseConfigured, signInWithProvider, signInWithEmail, startDemo, signOut }),
    [ready, user, mode, signInWithProvider, signInWithEmail, startDemo, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
