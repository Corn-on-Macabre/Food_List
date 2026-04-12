import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePlaceDetails } from '../hooks/usePlaceDetails';

function setupGoogleMock(fetchFieldsImpl: ReturnType<typeof vi.fn>) {
  function PlaceMock(this: Record<string, unknown>, opts: { id: string }) {
    this.id = opts.id;
    const self = this;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.fetchFields = (...args: any[]) => (fetchFieldsImpl as any).apply(self, args);
  }
  vi.stubGlobal('google', {
    maps: {
      places: {
        Place: PlaceMock,
      },
    },
  });
}

function applyPlaceFields(place: Record<string, unknown>) {
  place.displayName = 'Pho 43';
  place.formattedAddress = '4300 N Central Ave, Phoenix, AZ 85012';
  place.location = { lat: () => 33.48, lng: () => -112.07 };
  place.priceLevel = 'PRICE_LEVEL_MODERATE';
  place.types = ['vietnamese_restaurant', 'restaurant', 'food'];
  place.googleMapsURI = 'https://maps.google.com/?cid=12345';
}

describe('usePlaceDetails', () => {
  let mockFetchFields: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    mockFetchFields = vi.fn(async function (this: Record<string, unknown>) {
      applyPlaceFields(this);
    });
    setupGoogleMock(mockFetchFields);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('returns null placeDetails when placeId is null', () => {
    const { result } = renderHook(() => usePlaceDetails(null));
    act(() => { vi.runAllTimers(); });
    expect(result.current.placeDetails).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('calls Place.fetchFields with correct fields', async () => {
    const { result } = renderHook(() => usePlaceDetails('ChIJabc123'));
    await act(async () => { vi.runAllTimers(); });

    expect(mockFetchFields).toHaveBeenCalledWith(
      expect.objectContaining({
        fields: expect.arrayContaining(['displayName', 'formattedAddress', 'location']),
      })
    );
    expect(result.current.placeDetails).not.toBeNull();
  });

  it('maps Place types to app cuisine vocabulary correctly', async () => {
    const { result } = renderHook(() => usePlaceDetails('ChIJabc123'));
    await act(async () => { vi.runAllTimers(); });
    expect(result.current.placeDetails?.cuisine).toBe('Vietnamese');
  });

  it('constructs googleMapsUrl from place.googleMapsURI', async () => {
    const { result } = renderHook(() => usePlaceDetails('ChIJabc123'));
    await act(async () => { vi.runAllTimers(); });
    expect(result.current.placeDetails?.googleMapsUrl).toBe('https://maps.google.com/?cid=12345');
  });

  it('sets placeDetails with correct shape on success', async () => {
    const { result } = renderHook(() => usePlaceDetails('ChIJabc123'));
    await act(async () => { vi.runAllTimers(); });
    const details = result.current.placeDetails;
    expect(details).not.toBeNull();
    expect(details?.name).toBe('Pho 43');
    expect(details?.address).toBe('4300 N Central Ave, Phoenix, AZ 85012');
    expect(details?.lat).toBe(33.48);
    expect(details?.lng).toBe(-112.07);
    expect(details?.priceLevel).toBe(2);
    expect(details?.placeId).toBe('ChIJabc123');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets error when fetchFields rejects', async () => {
    mockFetchFields = vi.fn(async () => { throw new Error('NOT_FOUND'); });
    setupGoogleMock(mockFetchFields);

    const { result } = renderHook(() => usePlaceDetails('ChIJnotfound'));
    await act(async () => { vi.runAllTimers(); });
    expect(result.current.placeDetails).toBeNull();
    expect(result.current.error).not.toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('re-fetches when placeId changes', async () => {
    const { rerender } = renderHook(
      ({ placeId }: { placeId: string | null }) => usePlaceDetails(placeId),
      { initialProps: { placeId: 'id1' } }
    );
    await act(async () => { vi.runAllTimers(); });
    expect(mockFetchFields).toHaveBeenCalledTimes(1);

    rerender({ placeId: 'id2' });
    await act(async () => { vi.runAllTimers(); });
    expect(mockFetchFields).toHaveBeenCalledTimes(2);
  });
});
