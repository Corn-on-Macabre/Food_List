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

  it('handleNotesChange sets restaurant.notes when notes is a non-empty string', async () => {
    vi.stubEnv('VITE_ADMIN_PASSWORD', 'testpass');
    sessionStorage.setItem(SESSION_KEY, '1');
    renderDashboard();
    act(() => {
      fireEvent.click(screen.getByTestId('mock-add-panel'));
    });
    // Open note editor and type a note
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /add note for pho 43/i }));
    });
    const textarea = screen.getByTestId('note-textarea');
    await act(async () => {
      fireEvent.change(textarea, { target: { value: 'try the bone marrow pho' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('save-note-btn'));
    });
    // Note should now be displayed
    expect(screen.getByText('try the bone marrow pho')).toBeInTheDocument();
  });

  it('handleNotesChange removes restaurant.notes (sets to undefined) when notes is empty string', async () => {
    vi.stubEnv('VITE_ADMIN_PASSWORD', 'testpass');
    sessionStorage.setItem(SESSION_KEY, '1');
    renderDashboard();
    act(() => {
      fireEvent.click(screen.getByTestId('mock-add-panel'));
    });
    // Add a note first
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /add note for pho 43/i }));
    });
    await act(async () => {
      fireEvent.change(screen.getByTestId('note-textarea'), { target: { value: 'some note' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('save-note-btn'));
    });
    expect(screen.getByText('some note')).toBeInTheDocument();
    // Now delete it
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /edit note for pho 43/i }));
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('delete-note-btn'));
    });
    // Note should no longer be displayed, Add Note button should reappear
    expect(screen.queryByText('some note')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add note for pho 43/i })).toBeInTheDocument();
  });

  it('handleSourceChange sets restaurant.source when source is a non-empty string', async () => {
    vi.stubEnv('VITE_ADMIN_PASSWORD', 'testpass');
    sessionStorage.setItem(SESSION_KEY, '1');
    renderDashboard();
    act(() => {
      fireEvent.click(screen.getByTestId('mock-add-panel'));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /add source for pho 43/i }));
    });
    await act(async () => {
      fireEvent.change(screen.getByTestId('source-input'), { target: { value: 'TikTok @phxfoodie' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('save-source-btn'));
    });
    expect(screen.getByText('TikTok @phxfoodie')).toBeInTheDocument();
  });

  it('handleSourceChange removes restaurant.source when source is empty string', async () => {
    vi.stubEnv('VITE_ADMIN_PASSWORD', 'testpass');
    sessionStorage.setItem(SESSION_KEY, '1');
    renderDashboard();
    act(() => {
      fireEvent.click(screen.getByTestId('mock-add-panel'));
    });
    // Add source first
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /add source for pho 43/i }));
    });
    await act(async () => {
      fireEvent.change(screen.getByTestId('source-input'), { target: { value: 'TikTok' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('save-source-btn'));
    });
    expect(screen.getByText('TikTok')).toBeInTheDocument();
    // Now remove it
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /edit source for pho 43/i }));
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('remove-source-btn'));
    });
    expect(screen.queryByText('TikTok')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add source for pho 43/i })).toBeInTheDocument();
  });

  it('handleTagsChange adds a tag to restaurant.tags — tag chip shows as active', async () => {
    vi.stubEnv('VITE_ADMIN_PASSWORD', 'testpass');
    sessionStorage.setItem(SESSION_KEY, '1');
    renderDashboard();
    act(() => {
      fireEvent.click(screen.getByTestId('mock-add-panel'));
    });
    const patioChip = screen.getByTestId('tag-chip-patio');
    expect(patioChip).toHaveAttribute('aria-pressed', 'false');
    await act(async () => {
      fireEvent.click(patioChip);
    });
    expect(screen.getByTestId('tag-chip-patio')).toHaveAttribute('aria-pressed', 'true');
  });

  it('handleTagsChange removes a tag from restaurant.tags — add then remove', async () => {
    vi.stubEnv('VITE_ADMIN_PASSWORD', 'testpass');
    sessionStorage.setItem(SESSION_KEY, '1');
    renderDashboard();
    act(() => {
      fireEvent.click(screen.getByTestId('mock-add-panel'));
    });
    // Add tag
    await act(async () => {
      fireEvent.click(screen.getByTestId('tag-chip-patio'));
    });
    expect(screen.getByTestId('tag-chip-patio')).toHaveAttribute('aria-pressed', 'true');
    // Remove tag
    await act(async () => {
      fireEvent.click(screen.getByTestId('tag-chip-patio'));
    });
    expect(screen.getByTestId('tag-chip-patio')).toHaveAttribute('aria-pressed', 'false');
  });
});
