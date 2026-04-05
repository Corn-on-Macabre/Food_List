/* eslint-disable react-refresh/only-export-components -- standard context pattern: provider + hook co-located in one file */
import { createContext, useContext, useState } from 'react';

const SESSION_KEY = 'food-list-admin-auth';

interface AdminAuthContextValue {
  isAuthenticated: boolean;
  // isConfigured: false when VITE_ADMIN_PASSWORD is absent/empty at build time
  isConfigured: boolean;
  login: (password: string) => boolean;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const envPassword = import.meta.env.VITE_ADMIN_PASSWORD;
  const isConfigured = Boolean(envPassword);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // Fail-safe: if env var not configured at build time, never auto-authenticate
    if (!envPassword) return false;
    return sessionStorage.getItem(SESSION_KEY) === '1';
  });

  function login(password: string): boolean {
    if (!envPassword || password !== envPassword) return false;
    sessionStorage.setItem(SESSION_KEY, '1');
    setIsAuthenticated(true);
    return true;
  }

  function logout(): void {
    sessionStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
  }

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, isConfigured, login, logout }}>
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
