import { useState, useEffect } from 'react';
import type { Restaurant } from '../types';

interface UseRestaurantsResult {
  restaurants: Restaurant[];
  loading: boolean;
  error: string | null;
}

export function useRestaurants(): UseRestaurantsResult {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch('/restaurants.json', { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: unknown) => {
        if (!Array.isArray(data)) throw new Error('Invalid data format');
        setRestaurants(data as Restaurant[]);
        setError(null);
      })
      .catch(err => {
        if ((err as Error).name !== 'AbortError') {
          setError('Failed to load restaurant data. Please refresh the page.');
        }
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, []);

  return { restaurants, loading, error };
}
