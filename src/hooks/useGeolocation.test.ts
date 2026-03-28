import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useGeolocation } from './useGeolocation';

beforeEach(() => {
  vi.resetAllMocks();
});

afterEach(() => {
  // Restore geolocation to undefined between tests so they don't bleed into each other
  Object.defineProperty(navigator, 'geolocation', {
    value: undefined,
    configurable: true,
    writable: true,
  });
});

describe('useGeolocation', () => {
  it('returns loading:false and coords:null when geolocation is unavailable', () => {
    Object.defineProperty(navigator, 'geolocation', {
      value: undefined,
      configurable: true,
      writable: true,
    });

    const { result } = renderHook(() => useGeolocation());

    // loading must be false on the initial render — the lazy initializer sets it based on
    // navigator.geolocation availability, so no async transition occurs when unavailable
    expect(result.current.loading).toBe(false);
    expect(result.current.coords).toBeNull();
    expect(result.current.denied).toBe(false);
  });

  it('sets coords on successful geolocation', async () => {
    const mockGetCurrentPosition = vi.fn();
    mockGetCurrentPosition.mockImplementation((success: PositionCallback) => {
      success({
        coords: { latitude: 33.5, longitude: -112.1 },
      } as GeolocationPosition);
    });

    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: mockGetCurrentPosition },
      configurable: true,
      writable: true,
    });

    const { result } = renderHook(() => useGeolocation());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.coords).toEqual({ lat: 33.5, lng: -112.1 });
    expect(result.current.loading).toBe(false);
    expect(result.current.denied).toBe(false);
  });

  it('sets denied:true when permission is denied (error.code === 1)', async () => {
    const mockGetCurrentPosition = vi.fn();
    mockGetCurrentPosition.mockImplementation(
      (_success: PositionCallback, error: PositionErrorCallback) => {
        error({ code: 1 } as GeolocationPositionError);
      }
    );

    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: mockGetCurrentPosition },
      configurable: true,
      writable: true,
    });

    const { result } = renderHook(() => useGeolocation());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.denied).toBe(true);
    expect(result.current.coords).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('handles other geolocation errors gracefully (error.code !== 1)', async () => {
    const mockGetCurrentPosition = vi.fn();
    mockGetCurrentPosition.mockImplementation(
      (_success: PositionCallback, error: PositionErrorCallback) => {
        error({ code: 2 } as GeolocationPositionError);
      }
    );

    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: mockGetCurrentPosition },
      configurable: true,
      writable: true,
    });

    const { result } = renderHook(() => useGeolocation());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.denied).toBe(false);
    expect(result.current.coords).toBeNull();
    expect(result.current.loading).toBe(false);
  });
});
