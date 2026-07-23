import type { Tier } from '../types';

// Pin/legend colors reference the runtime CSS variables defined in
// src/index.css, so pins brighten automatically in dark mode.
// Light: loved #F59E0B (gold), recommended #3B82F6 (blue), radar #10B981 (green).
export const TIER_COLORS: Record<Tier, string> = {
  loved: 'var(--loved)',
  recommended: 'var(--recommended)',
  on_my_radar: 'var(--radar)',
};

export const TIER_LABELS: Record<Tier, string> = {
  loved: 'Loved',
  recommended: 'Recommended',
  on_my_radar: 'On My Radar',
};
