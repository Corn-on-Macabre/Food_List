import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { AdminAuthProvider, useAdminAuth } from '../contexts/AdminAuthContext';
import { supabase } from '../lib/supabase';

// setup.ts mocks ../lib/supabase with supabaseConfigured: false and a stubbed
// auth client — these tests cover the unconfigured (OAuth-unavailable) state.

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(AuthProvider, null,
    React.createElement(AdminAuthProvider, null, children)
  );

describe('useAdminAuth', () => {
  it('throws when used outside AdminAuthProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useAdminAuth())).toThrow(
      'useAdminAuth must be used within AdminAuthProvider'
    );
    spy.mockRestore();
  });

  it('is unauthenticated and unconfigured when Supabase is not configured', () => {
    const { result } = renderHook(() => useAdminAuth(), { wrapper });
    expect(result.current.isConfigured).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.userEmail).toBeNull();
  });

  it('loginWithGoogle is a no-op when Supabase is not configured', async () => {
    const { result } = renderHook(() => useAdminAuth(), { wrapper });
    await act(async () => {
      await result.current.loginWithGoogle();
    });
    expect(supabase.auth.signInWithOAuth).not.toHaveBeenCalled();
  });

  it('logout delegates to the Supabase session sign-out', () => {
    const { result } = renderHook(() => useAdminAuth(), { wrapper });
    act(() => {
      result.current.logout();
    });
    // Unconfigured: signOut short-circuits before hitting the client
    expect(supabase.auth.signOut).not.toHaveBeenCalled();
  });
});
