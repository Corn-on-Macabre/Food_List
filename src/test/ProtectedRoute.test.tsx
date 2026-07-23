import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock the admin auth hook directly — ProtectedRoute's job is routing on
// auth state, not deriving it (that's covered by useAdminAuth.test.ts).
const mockAuth = {
  isAuthenticated: false,
  isConfigured: true,
  isAdmin: false,
  userEmail: null as string | null,
  loginWithGoogle: vi.fn(),
  logout: vi.fn(),
  loading: false,
};
vi.mock('../hooks', () => ({
  useAdminAuth: () => mockAuth,
}));

import { ProtectedRoute } from '../components/ProtectedRoute';

function renderProtected() {
  return render(
    <MemoryRouter>
      <ProtectedRoute>
        <div data-testid="protected-content">Dashboard Content</div>
      </ProtectedRoute>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  it('renders children when authenticated as admin', () => {
    Object.assign(mockAuth, { isAuthenticated: true, isAdmin: true, userEmail: 'bobbyhunnicutt@gmail.com' });
    renderProtected();
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('renders AdminLogin when not signed in', () => {
    Object.assign(mockAuth, { isAuthenticated: false, isAdmin: false, userEmail: null });
    renderProtected();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.getByText(/Curator Dashboard/i)).toBeInTheDocument();
  });

  it('shows Access Denied for a signed-in non-admin Google account', () => {
    Object.assign(mockAuth, { isAuthenticated: false, isAdmin: false, userEmail: 'someone@example.com' });
    renderProtected();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.getByText(/Access Denied/i)).toBeInTheDocument();
    expect(screen.getByText(/someone@example\.com/)).toBeInTheDocument();
  });

  it('shows the loading state while auth resolves', () => {
    Object.assign(mockAuth, { loading: true, isAuthenticated: false, userEmail: null });
    renderProtected();
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    mockAuth.loading = false;
  });
});
