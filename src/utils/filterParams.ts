import type { FilterState, Tier } from '../types/restaurant';
import { TAG_VOCABULARY } from '../constants/tags';

const TIERS: readonly string[] = ['loved', 'recommended', 'on_my_radar'];

// NOTE: maxDistance is deliberately never serialized. The distance filter only
// applies when the viewer has granted geolocation AND is browsing their nearest
// metro, so a shared distance value would silently do nothing for most recipients.
// city is carried by the path (/city/:cityId), not the query string.

/** Serialize shareable filters to a query string ('' when nothing is active). */
export function filtersToSearchParams(filters: FilterState): string {
  const params = new URLSearchParams();
  if (filters.cuisine) params.set('cuisine', filters.cuisine);
  if (filters.tier) params.set('tier', filters.tier);
  if (filters.searchTerm) params.set('q', filters.searchTerm);
  if (filters.openNow) params.set('open', '1');
  if (filters.recognized) params.set('rec', '1');
  if (filters.tags.length > 0) params.set('tags', filters.tags.join(','));
  const s = params.toString();
  return s ? `?${s}` : '';
}

/**
 * Parse a query string into filter state, merged onto `base` (which carries
 * the path-derived city and defaults). Invalid tiers and unknown tags are dropped.
 */
export function filtersFromSearchParams(search: string, base: FilterState): FilterState {
  const params = new URLSearchParams(search);
  const tierParam = params.get('tier');
  const tier: Tier | null =
    tierParam && TIERS.includes(tierParam) ? (tierParam as Tier) : null;
  const tags = (params.get('tags') ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter((t) => (TAG_VOCABULARY as readonly string[]).includes(t));
  return {
    ...base,
    cuisine: params.get('cuisine') || null,
    tier,
    searchTerm: params.get('q') || null,
    openNow: params.get('open') === '1',
    recognized: params.get('rec') === '1',
    tags,
  };
}
