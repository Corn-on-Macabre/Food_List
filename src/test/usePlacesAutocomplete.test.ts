import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePlacesAutocomplete } from '../hooks/usePlacesAutocomplete';

const MOCK_SUGGESTION = {
  placePrediction: {
    placeId: 'abc123',
    text: { text: 'Pho 43, Phoenix, AZ' },
    mainText: { text: 'Pho 43' },
    secondaryText: { text: 'Phoenix, AZ' },
  },
};

function setupGoogleMock(fetchFn: ReturnType<typeof vi.fn>) {
  vi.stubGlobal('google', {
    maps: {
      places: {
        AutocompleteSuggestion: {
          fetchAutocompleteSuggestions: fetchFn,
        },
      },
    },
  });
}

describe('usePlacesAutocomplete', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    mockFetch = vi.fn();
    setupGoogleMock(mockFetch);
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
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns empty predictions for single character (less than 2 chars)', () => {
    const { result } = renderHook(() => usePlacesAutocomplete('P', 300));
    act(() => { vi.advanceTimersByTime(300); });
    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.current.predictions).toEqual([]);
  });

  it('debounces API call — no call made until 300ms after last keystroke', async () => {
    mockFetch.mockResolvedValue({ suggestions: [MOCK_SUGGESTION] });

    const { rerender } = renderHook(
      ({ query }: { query: string }) => usePlacesAutocomplete(query, 300),
      { initialProps: { query: 'Ph' } }
    );
    // Advance only 200ms — no call yet
    await act(async () => { vi.advanceTimersByTime(200); });
    expect(mockFetch).not.toHaveBeenCalled();

    // Update query — resets timer
    await act(async () => { rerender({ query: 'Pho' }); });
    expect(mockFetch).not.toHaveBeenCalled();

    // Advance full 300ms after last rerender
    await act(async () => { vi.advanceTimersByTime(300); });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({ input: 'Pho' })
    );
  });

  it('returns predictions array on successful API response', async () => {
    mockFetch.mockResolvedValue({ suggestions: [MOCK_SUGGESTION] });

    const { result } = renderHook(() => usePlacesAutocomplete('Pho', 300));
    await act(async () => { vi.advanceTimersByTime(300); });

    expect(result.current.predictions).toHaveLength(1);
    expect(result.current.predictions[0].placeId).toBe('abc123');
    expect(result.current.predictions[0].mainText).toBe('Pho 43');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets error state when API rejects', async () => {
    mockFetch.mockRejectedValue(new Error('API error'));

    const { result } = renderHook(() => usePlacesAutocomplete('xyznotfound', 300));
    await act(async () => { vi.advanceTimersByTime(300); });

    expect(result.current.predictions).toEqual([]);
    expect(result.current.error).not.toBeNull();
  });

  it('sets error state when google.maps is not available', async () => {
    vi.stubGlobal('google', undefined);

    const { result } = renderHook(() => usePlacesAutocomplete('Pho', 300));
    await act(async () => { vi.advanceTimersByTime(300); });

    expect(result.current.error).toBe('Places API unavailable');
    expect(result.current.predictions).toEqual([]);
  });
});
