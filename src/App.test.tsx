import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock @vis.gl/react-google-maps to avoid needing a real Maps API in tests
vi.mock('@vis.gl/react-google-maps', () => ({
  APIProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Map: ({ children }: { children?: React.ReactNode }) => <div data-testid="google-map">{children}</div>,
  AdvancedMarker: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Pin: () => <div />,
}));

describe('App', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    // Prevent useRestaurants fetch from leaving dangling async state
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {}));
  });

  it('shows error state when API key is missing (empty)', () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', '');
    render(<App />);
    expect(screen.getByText('Configuration Error')).toBeInTheDocument();
    expect(screen.getByText(/VITE_GOOGLE_MAPS_API_KEY/)).toBeInTheDocument();
  });

  it('shows error state when API key is PLACEHOLDER_KEY', () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'PLACEHOLDER_KEY');
    render(<App />);
    expect(screen.getByText('Configuration Error')).toBeInTheDocument();
  });

  it('renders the map when a real API key is provided', () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'AIza-real-key-123');
    render(<App />);
    expect(screen.getByTestId('google-map')).toBeInTheDocument();
    expect(screen.queryByText('Configuration Error')).not.toBeInTheDocument();
  });
});
