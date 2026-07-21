import { useEffect, useState } from 'react';
import { supabase, supabaseConfigured } from '../lib/supabase';
import type { Collection } from '../types/restaurant';

interface UseCollectionResult {
  collection: Collection | null;
  loading: boolean;
  notFound: boolean;
}

/**
 * Fetches a named collection by slug via the anon Supabase client (public
 * read RLS). Without Supabase env vars (bare local dev) every slug resolves
 * to notFound — /c/ links require the configured environment.
 */
export function useCollection(slug: string | undefined): UseCollectionResult {
  // Keyed by slug so a stale result never leaks across navigations
  const [fetched, setFetched] = useState<{ slug: string; collection: Collection | null } | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    const load = async (): Promise<void> => {
      if (!supabaseConfigured) {
        if (!cancelled) setFetched({ slug, collection: null });
        return;
      }
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (!cancelled) {
        setFetched({ slug, collection: error || !data ? null : (data as Collection) });
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const current = slug && fetched?.slug === slug ? fetched : null;
  return {
    collection: current?.collection ?? null,
    loading: Boolean(slug) && current === null,
    notFound: current !== null && current.collection === null,
  };
}
