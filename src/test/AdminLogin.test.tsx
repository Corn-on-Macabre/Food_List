import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../src/contexts/AuthContext';
import { AdminAuthProvider } from '../../src/contexts/AdminAuthContext';
import { AdminLogin } from '../components/AdminLogin';

beforeEach(() => {
  sessionStorage.clear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

function renderAdminLogin() {
  return render(
    <AuthProvider>
      <AdminAuthProvider>
        <MemoryRouter>
          <AdminLogin />
        </MemoryRouter>
      </AdminAuthProvider>
    </AuthProvider>
  );
}

describe('AdminLogin', () => {
  it('renders password input and sign-in button when env var is set', () => {
    vi.stubEnv('VITE_ADMIN_PASSWORD', 'testpass');
    renderAdminLogin();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });

  it('shows config error banner when VITE_ADMIN_PASSWORD is empty', () => {
    vi.stubEnv('VITE_ADMIN_PASSWORD', '');
    renderAdminLogin();
    expect(screen.getByText(/not configured/i)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Password')).not.toBeInTheDocument();
  });

  it('does not render error message on initial render', () => {
    vi.stubEnv('VITE_ADMIN_PASSWORD', 'testpass');
    renderAdminLogin();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows error message after failed login attempt', () => {
    vi.stubEnv('VITE_ADMIN_PASSWORD', 'testpass');
    renderAdminLogin();
    const input = screen.getByPlaceholderText('Password');
    fireEvent.change(input, { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Incorrect password/i)).toBeInTheDocument();
  });

  it('clears password field after failed login', () => {
    vi.stubEnv('VITE_ADMIN_PASSWORD', 'testpass');
    renderAdminLogin();
    const input = screen.getByPlaceholderText('Password');
    fireEvent.change(input, { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(input).toHaveValue('');
  });

  it('password input has an associated label for accessibility', () => {
    vi.stubEnv('VITE_ADMIN_PASSWORD', 'testpass');
    renderAdminLogin();
    const input = screen.getByLabelText('Password');
    expect(input).toBeInTheDocument();
  });
});
