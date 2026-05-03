import { useState, useEffect } from 'react';
import type { Restaurant } from '../types';
import { supabase, supabaseConfigured } from '../lib/supabase';

interface UseRestaurantsResult {
  restaurants: Restaurant[];
  loading: boolean;
  error: string | null;
}

function fetchFromJson(signal: AbortSignal): Promise<Restaurant[]> {
  return fetch('/restaurants.json', { signal })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data: unknown) => {
      if (!Array.isArray(data)) throw new Error('Invalid data format');
      return data as Restaurant[];
    });
}

async function fetchFromSupabase(): Promise<Restaurant[]> {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*');

  if (error) throw new Error(error.message);
  if (!Array.isArray(data)) throw new Error('Invalid data format');
  return data as Restaurant[];
}

export function useRestaurants(): UseRestaurantsResult {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    const load = async () => {
      try {
        const data = supabaseConfigured
          ? await fetchFromSupabase()
          : await fetchFromJson(controller.signal);

        if (!cancelled) {
          setRestaurants(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled && (err as Error).name !== 'AbortError') {
          setError('Failed to load restaurant data. Please refresh the page.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  return { restaurants, loading, error };
}
