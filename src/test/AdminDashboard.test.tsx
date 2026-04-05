import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminAuthProvider } from '../contexts/AdminAuthContext';
import type { Restaurant } from '../types';

// Mock AddRestaurantPanel so we can trigger onRestaurantAdded programmatically
vi.mock('../components/AddRestaurantPanel', () => ({
  AddRestaurantPanel: ({ onRestaurantAdded }: { onRestaurantAdded: (r: Restaurant) => void }) => (
    <button
      data-testid="mock-add-panel"
      onClick={() =>
        onRestaurantAdded({
          id: 'pho-43',
          name: 'Pho 43',
          tier: 'loved',
          cuisine: 'Vietnamese',
          lat: 33.48,
          lng: -112.07,
          googleMapsUrl: 'https://maps.google.com/?cid=12345',
          dateAdded: '2026-04-04',
        })
      }
    >
      Add Restaurant
    </button>
  ),
}));

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

  it('after a restaurant is added, the session list renders a SessionRestaurantCard', () => {
    vi.stubEnv('VITE_ADMIN_PASSWORD', 'testpass');
    sessionStorage.setItem(SESSION_KEY, '1');
    renderDashboard();
    act(() => {
      fireEvent.click(screen.getByTestId('mock-add-panel'));
    });
    expect(screen.getByTestId('session-restaurant-card')).toBeInTheDocument();
    expect(screen.getByText('Pho 43')).toBeInTheDocument();
  });

  it('triggering handleTierChange on a session restaurant updates the tier displayed', () => {
    vi.stubEnv('VITE_ADMIN_PASSWORD', 'testpass');
    sessionStorage.setItem(SESSION_KEY, '1');
    renderDashboard();
    act(() => {
      fireEvent.click(screen.getByTestId('mock-add-panel'));
    });
    // Restaurant is added with tier 'loved'
    expect(screen.getByTestId('tier-badge')).toHaveTextContent('Loved');
    // Click Edit Tier
    fireEvent.click(screen.getByRole('button', { name: /edit tier/i }));
    // Change to recommended
    const select = screen.getByRole('combobox', { name: /select tier/i });
    fireEvent.change(select, { target: { value: 'recommended' } });
    fireEvent.click(screen.getByRole('button', { name: /apply tier change/i }));
    // Badge should now show Recommended
    expect(screen.getByTestId('tier-badge')).toHaveTextContent('Recommended');
  });
});
