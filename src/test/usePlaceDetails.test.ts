import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePlaceDetails } from '../hooks/usePlaceDetails';

const MOCK_PLACE_RESULT = {
  name: 'Pho 43',
  formatted_address: '4300 N Central Ave, Phoenix, AZ 85012',
  geometry: {
    location: {
      lat: () => 33.48,
      lng: () => -112.07,
    },
  },
  price_level: 2,
  types: ['vietnamese_restaurant', 'restaurant', 'food'],
  url: 'https://maps.google.com/?cid=12345',
  place_id: 'ChIJabc123',
};

function setupGoogleMock(getDetails: ReturnType<typeof vi.fn>) {
  function PlacesServiceMock(this: Record<string, unknown>) {
    this.getDetails = getDetails;
  }
  vi.stubGlobal('google', {
    maps: {
      places: {
        PlacesService: PlacesServiceMock,
        PlacesServiceStatus: {
          OK: 'OK',
          ZERO_RESULTS: 'ZERO_RESULTS',
          NOT_FOUND: 'NOT_FOUND',
        },
      },
    },
  });
}

describe('usePlaceDetails', () => {
  let mockGetDetails: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    mockGetDetails = vi.fn();
    setupGoogleMock(mockGetDetails);
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
    expect(mockGetDetails).not.toHaveBeenCalled();
  });

  it('calls PlacesService.getDetails with correct fields', () => {
    mockGetDetails.mockImplementation(
      (_req: unknown, cb: (place: typeof MOCK_PLACE_RESULT | null, status: string) => void) => {
        cb(MOCK_PLACE_RESULT, 'OK');
      }
    );

    renderHook(() => usePlaceDetails('ChIJabc123'));
    act(() => { vi.runAllTimers(); }); // flush setTimeout(0) wrapping all effect logic

    expect(mockGetDetails).toHaveBeenCalledWith(
      expect.objectContaining({
        placeId: 'ChIJabc123',
        fields: expect.arrayContaining(['name', 'formatted_address', 'geometry', 'price_level', 'types', 'url']),
      }),
      expect.any(Function)
    );
  });

  it('maps Place types to app cuisine vocabulary correctly', () => {
    mockGetDetails.mockImplementation(
      (_req: unknown, cb: (place: typeof MOCK_PLACE_RESULT | null, status: string) => void) => {
        cb(MOCK_PLACE_RESULT, 'OK');
      }
    );

    const { result } = renderHook(() => usePlaceDetails('ChIJabc123'));
    act(() => { vi.runAllTimers(); });
    expect(result.current.placeDetails?.cuisine).toBe('Vietnamese');
  });

  it('constructs googleMapsUrl from place.url', () => {
    mockGetDetails.mockImplementation(
      (_req: unknown, cb: (place: typeof MOCK_PLACE_RESULT | null, status: string) => void) => {
        cb(MOCK_PLACE_RESULT, 'OK');
      }
    );

    const { result } = renderHook(() => usePlaceDetails('ChIJabc123'));
    act(() => { vi.runAllTimers(); });
    expect(result.current.placeDetails?.googleMapsUrl).toBe('https://maps.google.com/?cid=12345');
  });

  it('sets placeDetails with correct shape on success', () => {
    mockGetDetails.mockImplementation(
      (_req: unknown, cb: (place: typeof MOCK_PLACE_RESULT | null, status: string) => void) => {
        cb(MOCK_PLACE_RESULT, 'OK');
      }
    );

    const { result } = renderHook(() => usePlaceDetails('ChIJabc123'));
    act(() => { vi.runAllTimers(); });
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

  it('sets error when PlacesService returns NOT_FOUND status', () => {
    mockGetDetails.mockImplementation(
      (_req: unknown, cb: (place: null, status: string) => void) => {
        cb(null, 'NOT_FOUND');
      }
    );

    const { result } = renderHook(() => usePlaceDetails('ChIJnotfound'));
    act(() => { vi.runAllTimers(); });
    expect(result.current.placeDetails).toBeNull();
    expect(result.current.error).not.toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('re-fetches when placeId changes', () => {
    mockGetDetails.mockImplementation(
      (_req: unknown, cb: (place: typeof MOCK_PLACE_RESULT | null, status: string) => void) => {
        cb(MOCK_PLACE_RESULT, 'OK');
      }
    );

    const { rerender } = renderHook(
      ({ placeId }: { placeId: string | null }) => usePlaceDetails(placeId),
      { initialProps: { placeId: 'id1' } }
    );
    act(() => { vi.runAllTimers(); }); // flush initial setTimeout(0)
    expect(mockGetDetails).toHaveBeenCalledTimes(1);

    act(() => { rerender({ placeId: 'id2' }); });
    act(() => { vi.runAllTimers(); }); // flush timer for new placeId
    expect(mockGetDetails).toHaveBeenCalledTimes(2);
  });
});
