import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

// Mock @vis.gl/react-google-maps to avoid needing a real Maps API in tests
vi.mock('@vis.gl/react-google-maps', () => ({
  APIProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Map: ({ children }: { children?: React.ReactNode }) => <div data-testid="google-map">{children}</div>,
  AdvancedMarker: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Pin: () => <div />,
  useMap: () => null,
}));

// Stub useGeolocation so App tests are not coupled to geolocation hook internals
vi.mock('./hooks/useGeolocation', () => ({
  useGeolocation: () => ({ coords: null, loading: false, denied: false }),
}));

describe('App', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    // Prevent useRestaurants fetch from leaving dangling async state
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {}));
  });

  it('shows error state when API key is missing (empty)', () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', '');
    render(<MemoryRouter><App /></MemoryRouter>);
    expect(screen.getByText('Configuration Error')).toBeInTheDocument();
    expect(screen.getByText(/VITE_GOOGLE_MAPS_API_KEY/)).toBeInTheDocument();
  });

  it('shows error state when API key is PLACEHOLDER_KEY', () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'PLACEHOLDER_KEY');
    render(<MemoryRouter><App /></MemoryRouter>);
    expect(screen.getByText('Configuration Error')).toBeInTheDocument();
  });

  it('renders the map when a real API key is provided', () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'AIza-real-key-123');
    render(<MemoryRouter><App /></MemoryRouter>);
    expect(screen.getByTestId('google-map')).toBeInTheDocument();
    expect(screen.queryByText('Configuration Error')).not.toBeInTheDocument();
  });

  it('renders the pin legend when a real API key is provided', () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'AIza-real-key-123');
    render(<MemoryRouter><App /></MemoryRouter>);
    expect(screen.getByRole('region', { name: 'Map Legend' })).toBeInTheDocument();
  });
});

describe('Responsive layout', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    // Default: fetch never resolves so loading stays true (safe for most tests)
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {}));
  });

  // C1 — Map container renders with full-viewport dimensions
  it('map container fills full viewport', () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'AIza-real-key-123');
    const { container } = render(<MemoryRouter><App /></MemoryRouter>);

    const mapWrapper = container.firstChild as HTMLElement;
    expect(mapWrapper).toHaveStyle({ width: '100vw', height: '100vh' });
  });

  // C2 — PinLegend renders at bottom-left corner
  it('pin legend is positioned at bottom-left corner', () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'AIza-real-key-123');
    render(<MemoryRouter><App /></MemoryRouter>);
    const legend = screen.getByRole('region', { name: 'Map Legend' });
    expect(legend.className).toMatch(/absolute/);
    expect(legend.className).toMatch(/bottom-4/);
    expect(legend.className).toMatch(/left-4/);
  });

  // C3 — Loading overlay is centered when data is loading
  // Note: tests CSS class names/inline styles, not computed layout (jsdom limitation —
  // actual viewport-width responsiveness requires a browser-based e2e test).
  it('loading overlay is centered when data is loading', () => {
    // beforeEach already mocks fetch to never resolve — useRestaurants stays loading:true
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'AIza-real-key-123');
    const { container } = render(<MemoryRouter><App /></MemoryRouter>);

    expect(screen.getByText('Loading restaurants...')).toBeInTheDocument();
    const overlay = container.querySelector('.absolute.inset-0.flex.items-center.justify-center');
    expect(overlay).toBeInTheDocument();
  });

  // C4 — Error overlay is centered when data fails
  // Note: implicitly tests useRestaurants error path via controlled fetch rejection.
  // If useRestaurants error contract changes, this test must be updated accordingly.
  it('error overlay is centered when data fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'AIza-real-key-123');
    render(<MemoryRouter><App /></MemoryRouter>);
    const errorText = await screen.findByText('Could not load restaurant data. Please refresh the page.');
    const overlay = errorText.closest('.inset-0');
    expect(overlay).not.toBeNull();
    expect(overlay).toBeInTheDocument();
  });
});
