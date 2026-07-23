import type { Tier } from '../types';

export const TIER_OPTIONS: { value: Tier; label: string }[] = [
  { value: 'loved', label: 'Loved' },
  { value: 'recommended', label: 'Recommended' },
  { value: 'on_my_radar', label: 'On My Radar' },
];

// Public-facing labels used by the map filter chips and admin list filter.
export const TIER_FILTER_OPTIONS: { value: Tier; label: string }[] = [
  { value: 'loved', label: 'Loved It' },
  { value: 'recommended', label: 'Worth Recommending' },
  { value: 'on_my_radar', label: 'Want to Go' },
];
