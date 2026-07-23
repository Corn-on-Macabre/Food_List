import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Override the global setup mock: these tests exercise the CONFIGURED state
// (Google sign-in button) as well as the unconfigured banner.
const signInWithOAuth = vi.fn();
let configured = true;
vi.mock('../lib/supabase', () => ({
  get supabaseConfigured() { return configured; },
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithOAuth: (...args: unknown[]) => signInWithOAuth(...args),
      signOut: vi.fn(),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ data: [], error: null }),
      upsert: vi.fn().mockReturnValue({ error: null }),
    }),
  },
}));

import { AuthProvider } from '../contexts/AuthContext';
import { AdminAuthProvider } from '../contexts/AdminAuthContext';
import { AdminLogin } from '../components/AdminLogin';

async function renderAdminLogin() {
  const result = render(
    <AuthProvider>
      <AdminAuthProvider>
        <MemoryRouter>
          <AdminLogin />
        </MemoryRouter>
      </AdminAuthProvider>
    </AuthProvider>
  );
  // AuthProvider resolves getSession asynchronously — wait for loading to clear
  await screen.findByText(/Curator Dashboard/i);
  return result;
}

describe('AdminLogin', () => {
  it('renders the Google sign-in button when Supabase is configured', async () => {
    configured = true;
    await renderAdminLogin();
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
    expect(screen.queryByText(/not configured/i)).not.toBeInTheDocument();
  });

  it('clicking the Google button starts the OAuth flow with an /admin redirect', async () => {
    configured = true;
    signInWithOAuth.mockClear();
    await renderAdminLogin();
    fireEvent.click(screen.getByRole('button', { name: /sign in with google/i }));
    expect(signInWithOAuth).toHaveBeenCalledOnce();
    expect(signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'google',
        options: expect.objectContaining({
          redirectTo: expect.stringContaining('/admin'),
        }),
      })
    );
  });

  it('shows the config error banner when Supabase is not configured', async () => {
    configured = false;
    await renderAdminLogin();
    expect(screen.getByText(/not configured/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /sign in with google/i })).not.toBeInTheDocument();
  });
});
