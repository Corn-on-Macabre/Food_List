/* eslint-disable react-refresh/only-export-components -- standard context pattern: provider + hook co-located in one file */
import { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';
import { supabase, supabaseConfigured } from '../lib/supabase';

interface AdminAuthContextValue {
  isAuthenticated: boolean;
  isConfigured: boolean;
  isAdmin: boolean;
  userEmail: string | null;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();

  // Supabase auth state comes from AuthContext — no duplicate subscription.
  // Admin access is Google OAuth + RLS only; there is no password fallback
  // (a VITE_* password would be baked into the public bundle).
  const userEmail = auth.user?.email ?? null;
  const isAdmin = auth.isAdmin;
  const isAuthenticated = supabaseConfigured && auth.isAuthenticated && isAdmin;
  const isConfigured = supabaseConfigured;

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
    auth.signOut();
  }

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, isConfigured, isAdmin, userEmail, loginWithGoogle, logout, loading: auth.loading }}>
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
