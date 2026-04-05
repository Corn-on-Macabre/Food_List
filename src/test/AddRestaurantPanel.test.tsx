import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import type { Restaurant } from '../types';

// Mock child component dependencies
vi.mock('../components/PlacesSearchInput', () => ({
  PlacesSearchInput: ({ onPlaceSelect, onManualAdd }: {
    onPlaceSelect: (id: string) => void;
    onManualAdd: () => void;
  }) => (
    <div data-testid="places-search-input">
      <button onClick={() => onPlaceSelect('test-place-id')}>Select Place</button>
      <button onClick={onManualAdd}>Add Manually</button>
    </div>
  ),
}));

vi.mock('../hooks/usePlaceDetails', () => ({
  usePlaceDetails: vi.fn(),
}));

vi.mock('../components/RestaurantDraftForm', () => ({
  RestaurantDraftForm: ({ onSave, onCancel, initialDraft }: {
    onSave: (r: Restaurant) => void;
    onCancel: () => void;
    initialDraft: unknown;
  }) => (
    <div data-testid="draft-form">
      <span data-testid="draft-mode">{initialDraft ? 'auto-fill' : 'manual'}</span>
      <button onClick={() => onSave({
        id: 'pho-43',
        name: 'Pho 43',
        tier: 'loved',
        cuisine: 'Vietnamese',
        lat: 33.48,
        lng: -112.07,
        googleMapsUrl: 'https://maps.google.com/?cid=12345',
        dateAdded: '2026-04-04',
      })}>Save</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

import { AddRestaurantPanel } from '../components/AddRestaurantPanel';
import { usePlaceDetails } from '../hooks/usePlaceDetails';

const mockUsePlaceDetails = vi.mocked(usePlaceDetails);

const MOCK_PLACE_DRAFT = {
  name: 'Pho 43',
  address: '4300 N Central Ave, Phoenix, AZ 85012',
  lat: 33.48,
  lng: -112.07,
  priceLevel: 2,
  cuisine: 'Vietnamese',
  googleMapsUrl: 'https://maps.google.com/?cid=12345',
  placeId: 'ChIJabc123',
};

describe('AddRestaurantPanel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockUsePlaceDetails.mockReturnValue({
      placeDetails: null,
      loading: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('renders in search state initially', () => {
    render(<AddRestaurantPanel onRestaurantAdded={vi.fn()} />);
    expect(screen.getByTestId('places-search-input')).toBeInTheDocument();
    expect(screen.queryByTestId('draft-form')).not.toBeInTheDocument();
  });

  it('transitions to loading-details on prediction select', () => {
    mockUsePlaceDetails.mockReturnValue({
      placeDetails: null,
      loading: true,
      error: null,
    });

    render(<AddRestaurantPanel onRestaurantAdded={vi.fn()} />);
    fireEvent.click(screen.getByText('Select Place'));

    // Should show loading state
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('transitions to draft state when place details resolve', () => {
    // First render with loading
    mockUsePlaceDetails.mockReturnValue({
      placeDetails: MOCK_PLACE_DRAFT,
      loading: false,
      error: null,
    });

    render(<AddRestaurantPanel onRestaurantAdded={vi.fn()} />);
    fireEvent.click(screen.getByText('Select Place'));
    act(() => { vi.advanceTimersByTime(1); }); // flush the setTimeout(0) in the state machine effect

    expect(screen.getByTestId('draft-form')).toBeInTheDocument();
    expect(screen.getByTestId('draft-mode').textContent).toBe('auto-fill');
  });

  it('transitions to manual state when place details error', () => {
    mockUsePlaceDetails.mockReturnValue({
      placeDetails: null,
      loading: false,
      error: 'NOT_FOUND',
    });

    render(<AddRestaurantPanel onRestaurantAdded={vi.fn()} />);
    fireEvent.click(screen.getByText('Select Place'));
    act(() => { vi.advanceTimersByTime(1); }); // flush the setTimeout(0) in the state machine effect

    expect(screen.getByTestId('draft-form')).toBeInTheDocument();
    expect(screen.getByTestId('draft-mode').textContent).toBe('manual');
  });

  it('transitions to manual state when Add Manually is clicked', () => {
    render(<AddRestaurantPanel onRestaurantAdded={vi.fn()} />);
    fireEvent.click(screen.getByText('Add Manually'));

    expect(screen.getByTestId('draft-form')).toBeInTheDocument();
    expect(screen.getByTestId('draft-mode').textContent).toBe('manual');
  });

  it('shows success state after onSave', () => {
    mockUsePlaceDetails.mockReturnValue({
      placeDetails: MOCK_PLACE_DRAFT,
      loading: false,
      error: null,
    });

    const onRestaurantAdded = vi.fn();
    render(<AddRestaurantPanel onRestaurantAdded={onRestaurantAdded} />);
    fireEvent.click(screen.getByText('Select Place'));
    act(() => { vi.advanceTimersByTime(1); }); // flush setTimeout(0) → draft state
    fireEvent.click(screen.getByText('Save'));

    expect(screen.getByText(/restaurant added successfully/i)).toBeInTheDocument();
    expect(onRestaurantAdded).toHaveBeenCalledTimes(1);
  });

  it('resets to search state after "Add Another" click', () => {
    mockUsePlaceDetails.mockReturnValue({
      placeDetails: MOCK_PLACE_DRAFT,
      loading: false,
      error: null,
    });

    render(<AddRestaurantPanel onRestaurantAdded={vi.fn()} />);
    fireEvent.click(screen.getByText('Select Place'));
    act(() => { vi.advanceTimersByTime(1); }); // flush setTimeout(0) → draft state
    fireEvent.click(screen.getByText('Save'));

    // In success state, click Add Another
    fireEvent.click(screen.getByRole('button', { name: /add another/i }));
    expect(screen.getByTestId('places-search-input')).toBeInTheDocument();
    expect(screen.queryByText(/restaurant added successfully/i)).not.toBeInTheDocument();
  });

  it('resets to search state on cancel from draft form', () => {
    mockUsePlaceDetails.mockReturnValue({
      placeDetails: MOCK_PLACE_DRAFT,
      loading: false,
      error: null,
    });

    render(<AddRestaurantPanel onRestaurantAdded={vi.fn()} />);
    fireEvent.click(screen.getByText('Select Place'));
    act(() => { vi.advanceTimersByTime(1); }); // flush setTimeout(0) → draft state
    fireEvent.click(screen.getByText('Cancel'));

    expect(screen.getByTestId('places-search-input')).toBeInTheDocument();
  });

  it('auto-resets to search state 2 seconds after success', () => {
    mockUsePlaceDetails.mockReturnValue({
      placeDetails: MOCK_PLACE_DRAFT,
      loading: false,
      error: null,
    });

    render(<AddRestaurantPanel onRestaurantAdded={vi.fn()} />);
    fireEvent.click(screen.getByText('Select Place'));
    act(() => { vi.advanceTimersByTime(1); }); // flush setTimeout(0) → draft state
    fireEvent.click(screen.getByText('Save'));

    expect(screen.getByText(/restaurant added successfully/i)).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(2000); });
    expect(screen.getByTestId('places-search-input')).toBeInTheDocument();
  });
});
