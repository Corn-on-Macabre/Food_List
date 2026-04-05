import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePlacesAutocomplete } from '../hooks/usePlacesAutocomplete';

const MOCK_PREDICTION = {
  place_id: 'abc123',
  description: 'Pho 43, Phoenix, AZ',
  structured_formatting: {
    main_text: 'Pho 43',
    secondary_text: 'Phoenix, AZ',
    main_text_matched_substrings: [],
  },
  matched_substrings: [],
  terms: [],
  types: ['restaurant'],
};

function setupGoogleMock(getPlacePredictions: ReturnType<typeof vi.fn>) {
  // Must use a regular function (not arrow) so it can be called with `new`
  function AutocompleteServiceMock(this: Record<string, unknown>) {
    this.getPlacePredictions = getPlacePredictions;
  }
  vi.stubGlobal('google', {
    maps: {
      places: {
        AutocompleteService: AutocompleteServiceMock,
        PlacesServiceStatus: {
          OK: 'OK',
          ZERO_RESULTS: 'ZERO_RESULTS',
          NOT_FOUND: 'NOT_FOUND',
        },
      },
    },
  });
}

describe('usePlacesAutocomplete', () => {
  let mockGetPlacePredictions: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    mockGetPlacePredictions = vi.fn();
    setupGoogleMock(mockGetPlacePredictions);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('returns empty predictions for empty query', () => {
    const { result } = renderHook(() => usePlacesAutocomplete('', 300));
    expect(result.current.predictions).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockGetPlacePredictions).not.toHaveBeenCalled();
  });

  it('returns empty predictions for single character (less than 2 chars)', () => {
    const { result } = renderHook(() => usePlacesAutocomplete('P', 300));
    act(() => { vi.advanceTimersByTime(300); });
    expect(mockGetPlacePredictions).not.toHaveBeenCalled();
    expect(result.current.predictions).toEqual([]);
  });

  it('debounces API call — no call made until 300ms after last keystroke', async () => {
    const { rerender } = renderHook(
      ({ query }: { query: string }) => usePlacesAutocomplete(query, 300),
      { initialProps: { query: 'Ph' } }
    );
    // Advance only 200ms — no call yet
    await act(async () => { vi.advanceTimersByTime(200); });
    expect(mockGetPlacePredictions).not.toHaveBeenCalled();

    // Update query — resets timer
    await act(async () => { rerender({ query: 'Pho' }); });
    // Only 0ms elapsed since rerender — still no call
    expect(mockGetPlacePredictions).not.toHaveBeenCalled();

    // Advance full 300ms after last rerender
    await act(async () => { vi.advanceTimersByTime(300); });
    expect(mockGetPlacePredictions).toHaveBeenCalledTimes(1);
    expect(mockGetPlacePredictions).toHaveBeenCalledWith(
      expect.objectContaining({ input: 'Pho' }),
      expect.any(Function)
    );
  });

  it('returns predictions array on successful API response', async () => {
    mockGetPlacePredictions.mockImplementation(
      (_req: unknown, cb: (preds: typeof MOCK_PREDICTION[] | null, status: string) => void) => {
        cb([MOCK_PREDICTION], 'OK');
      }
    );

    const { result } = renderHook(() => usePlacesAutocomplete('Pho', 300));
    await act(async () => { vi.advanceTimersByTime(300); });

    expect(result.current.predictions).toHaveLength(1);
    expect(result.current.predictions[0].place_id).toBe('abc123');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets error state when AutocompleteService returns ZERO_RESULTS status', () => {
    mockGetPlacePredictions.mockImplementation(
      (_req: unknown, cb: (preds: null, status: string) => void) => {
        cb(null, 'ZERO_RESULTS');
      }
    );

    const { result } = renderHook(() => usePlacesAutocomplete('xyznotfound', 300));
    act(() => { vi.advanceTimersByTime(300); });

    expect(result.current.predictions).toEqual([]);
    expect(result.current.error).not.toBeNull();
  });

  it('sets error state when google.maps is not available', () => {
    vi.stubGlobal('google', undefined);

    const { result } = renderHook(() => usePlacesAutocomplete('Pho', 300));
    act(() => { vi.advanceTimersByTime(300); });

    expect(result.current.error).toBe('Places API unavailable');
    expect(result.current.predictions).toEqual([]);
  });
});
