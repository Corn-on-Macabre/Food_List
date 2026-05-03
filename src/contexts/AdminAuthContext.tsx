/* eslint-disable react-refresh/only-export-components -- standard context pattern: provider + hook co-located in one file */
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase, supabaseConfigured } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL ?? 'bobbyhunnicutt@gmail.com';
const SESSION_KEY = 'food-list-admin-auth';

interface AdminAuthContextValue {
  isAuthenticated: boolean;
  isConfigured: boolean;
  isAdmin: boolean;
  userEmail: string | null;
  /** The current admin password (empty string when not authenticated). Legacy — kept for backward compat. */
  password: string;
  login: (password: string) => boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const envPassword = import.meta.env.VITE_ADMIN_PASSWORD;

  // Supabase session state
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(supabaseConfigured);

  useEffect(() => {
    if (!supabaseConfigured) return;

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => subscription.unsubscribe();
  }, []);

  const userEmail = session?.user?.email ?? null;
  const isAdmin = userEmail?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const supabaseAuthenticated = supabaseConfigured && session !== null && isAdmin;

  // Legacy password auth (fallback when Supabase not configured)
  const isConfigured = supabaseConfigured || Boolean(envPassword);

  const [passwordAuthed, setPasswordAuthed] = useState<boolean>(() => {
    if (!envPassword) return false;
    return sessionStorage.getItem(SESSION_KEY) === '1';
  });

  const [password, setPassword] = useState<string>(() => {
    if (!envPassword) return '';
    return sessionStorage.getItem(SESSION_KEY) === '1' ? envPassword : '';
  });

  const isAuthenticated = supabaseAuthenticated || passwordAuthed;

  function login(pw: string): boolean {
    if (!envPassword || pw !== envPassword) return false;
    sessionStorage.setItem(SESSION_KEY, '1');
    setPasswordAuthed(true);
    setPassword(pw);
    return true;
  }

  async function loginWithGoogle(): Promise<void> {
    if (!supabaseConfigured) return;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/admin`,
      },
    });
  }

  function logout(): void {
    // Clear legacy password auth
    sessionStorage.removeItem(SESSION_KEY);
    setPasswordAuthed(false);
    setPassword('');
    // Clear Supabase session
    if (supabaseConfigured) {
      supabase.auth.signOut();
    }
  }

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, isConfigured, isAdmin, userEmail, password, login, loginWithGoogle, logout, loading }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

// useAdminAuth must be used within <AdminAuthProvider>
export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
