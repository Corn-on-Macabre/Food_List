import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { AdminAuthProvider, useAdminAuth } from '../../src/contexts/AdminAuthContext';

const SESSION_KEY = 'food-list-admin-auth';

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(AdminAuthProvider, null, children);

beforeEach(() => {
  sessionStorage.clear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('useAdminAuth', () => {
  it('login() returns false when VITE_ADMIN_PASSWORD is empty or missing', () => {
    vi.stubEnv('VITE_ADMIN_PASSWORD', '');
    const { result } = renderHook(() => useAdminAuth(), { wrapper });
    let success: boolean;
    act(() => {
      success = result.current.login('anything');
    });
    expect(success!).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('login() returns false when password does not match', () => {
    vi.stubEnv('VITE_ADMIN_PASSWORD', 'testpass');
    const { result } = renderHook(() => useAdminAuth(), { wrapper });
    let success: boolean;
    act(() => {
      success = result.current.login('wrong');
    });
    expect(success!).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('login() returns true and sets sessionStorage when password matches', () => {
    vi.stubEnv('VITE_ADMIN_PASSWORD', 'testpass');
    const { result } = renderHook(() => useAdminAuth(), { wrapper });
    let success: boolean;
    act(() => {
      success = result.current.login('testpass');
    });
    expect(success!).toBe(true);
    expect(result.current.isAuthenticated).toBe(true);
    expect(sessionStorage.getItem(SESSION_KEY)).toBe('1');
  });

  it('logout() clears sessionStorage and sets isAuthenticated to false', () => {
    vi.stubEnv('VITE_ADMIN_PASSWORD', 'testpass');
    const { result } = renderHook(() => useAdminAuth(), { wrapper });
    act(() => {
      result.current.login('testpass');
    });
    expect(result.current.isAuthenticated).toBe(true);
    act(() => {
      result.current.logout();
    });
    expect(result.current.isAuthenticated).toBe(false);
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('initial state reads from sessionStorage — isAuthenticated true when key present and env var defined', () => {
    vi.stubEnv('VITE_ADMIN_PASSWORD', 'testpass');
    sessionStorage.setItem(SESSION_KEY, '1');
    const { result } = renderHook(() => useAdminAuth(), { wrapper });
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('initial state is false when sessionStorage key present but env var is empty', () => {
    vi.stubEnv('VITE_ADMIN_PASSWORD', '');
    sessionStorage.setItem(SESSION_KEY, '1');
    const { result } = renderHook(() => useAdminAuth(), { wrapper });
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('isConfigured is true when VITE_ADMIN_PASSWORD is set', () => {
    vi.stubEnv('VITE_ADMIN_PASSWORD', 'testpass');
    const { result } = renderHook(() => useAdminAuth(), { wrapper });
    expect(result.current.isConfigured).toBe(true);
  });

  it('isConfigured is false when VITE_ADMIN_PASSWORD is empty', () => {
    vi.stubEnv('VITE_ADMIN_PASSWORD', '');
    const { result } = renderHook(() => useAdminAuth(), { wrapper });
    expect(result.current.isConfigured).toBe(false);
  });
});
