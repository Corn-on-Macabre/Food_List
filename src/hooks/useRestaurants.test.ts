import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRestaurants } from './useRestaurants';
import type { Restaurant } from '../types';

const mockRestaurants: Restaurant[] = [
  {
    id: 'tacos-el-patron',
    name: 'Tacos El Patrón',
    tier: 'loved',
    cuisine: 'Mexican',
    lat: 33.4484,
    lng: -112.074,
    googleMapsUrl: 'https://maps.google.com/?q=Tacos+El+Patron',
    dateAdded: '2026-01-15',
  },
  {
    id: 'ramen-house',
    name: 'Ramen House',
    tier: 'recommended',
    cuisine: 'Japanese',
    lat: 33.4942,
    lng: -112.0267,
    googleMapsUrl: 'https://maps.google.com/?q=Ramen+House',
    dateAdded: '2026-02-01',
  },
];

beforeEach(() => {
  vi.resetAllMocks();
});

describe('useRestaurants', () => {
  it('loads restaurants successfully', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => mockRestaurants,
    } as Response);

    const { result } = renderHook(() => useRestaurants());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.restaurants).toEqual(mockRestaurants);
    expect(result.current.error).toBeNull();
  });

  it('sets error on network failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useRestaurants());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load restaurant data. Please refresh the page.');
    expect(result.current.restaurants).toEqual([]);
  });

  it('sets error on non-OK HTTP response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => null,
    } as Response);

    const { result } = renderHook(() => useRestaurants());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load restaurant data. Please refresh the page.');
    expect(result.current.restaurants).toEqual([]);
  });

  it('starts with loading:true', () => {
    // Use a promise that never resolves so we can inspect initial state
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useRestaurants());

    // Before fetch resolves, loading should be true
    expect(result.current.loading).toBe(true);
    expect(result.current.restaurants).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});
