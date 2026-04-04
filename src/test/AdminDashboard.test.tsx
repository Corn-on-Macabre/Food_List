import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminAuthProvider } from '../../src/contexts/AdminAuthContext';
import { AdminDashboard } from '../components/AdminDashboard';

const SESSION_KEY = 'food-list-admin-auth';

beforeEach(() => {
  sessionStorage.clear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

function renderDashboard() {
  return render(
    <AdminAuthProvider>
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    </AdminAuthProvider>
  );
}

describe('AdminDashboard', () => {
  it('renders the dashboard header and placeholder content', () => {
    vi.stubEnv('VITE_ADMIN_PASSWORD', 'testpass');
    sessionStorage.setItem(SESSION_KEY, '1');
    renderDashboard();
    expect(screen.getByText(/Food List — Curator Dashboard/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
  });

  it('sign out button clears sessionStorage and calls logout', () => {
    vi.stubEnv('VITE_ADMIN_PASSWORD', 'testpass');
    sessionStorage.setItem(SESSION_KEY, '1');
    renderDashboard();
    expect(sessionStorage.getItem(SESSION_KEY)).toBe('1');
    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
  });
});
