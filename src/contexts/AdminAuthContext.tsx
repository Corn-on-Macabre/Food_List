/* eslint-disable react-refresh/only-export-components -- standard context pattern: provider + hook co-located in one file */
import { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase, supabaseConfigured } from '../lib/supabase';

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
  const auth = useAuth();
  const envPassword = import.meta.env.VITE_ADMIN_PASSWORD;

  // Supabase auth state comes from AuthContext — no duplicate subscription
  const userEmail = auth.user?.email ?? null;
  const isAdmin = auth.isAdmin;
  const supabaseAuthenticated = supabaseConfigured && auth.isAuthenticated && isAdmin;

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
    // Admin login redirects back to /admin (unlike visitor sign-in which redirects to /)
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
    // Clear Supabase session via AuthContext
    auth.signOut();
  }

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, isConfigured, isAdmin, userEmail, password, login, loginWithGoogle, logout, loading: auth.loading }}>
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
