import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminAuthProvider } from '../../src/contexts/AdminAuthContext';
import { ProtectedRoute } from '../components/ProtectedRoute';

const SESSION_KEY = 'food-list-admin-auth';

beforeEach(() => {
  sessionStorage.clear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('ProtectedRoute', () => {
  it('renders children when sessionStorage has auth token and env var is set', () => {
    vi.stubEnv('VITE_ADMIN_PASSWORD', 'testpass');
    sessionStorage.setItem(SESSION_KEY, '1');
    render(
      <AdminAuthProvider>
        <MemoryRouter>
          <ProtectedRoute>
            <div data-testid="protected-content">Dashboard Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      </AdminAuthProvider>
    );
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Password')).not.toBeInTheDocument();
  });

  it('renders AdminLogin when not authenticated', () => {
    vi.stubEnv('VITE_ADMIN_PASSWORD', 'testpass');
    render(
      <AdminAuthProvider>
        <MemoryRouter>
          <ProtectedRoute>
            <div data-testid="protected-content">Dashboard Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      </AdminAuthProvider>
    );
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });
});
