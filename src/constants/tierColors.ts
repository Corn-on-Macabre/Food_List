import type { Tier } from '../types';

export const TIER_COLORS: Record<Tier, string> = {
  loved: '#F59E0B',       // gold
  recommended: '#3B82F6', // blue
  on_my_radar: '#10B981', // green
};

export const TIER_LABELS: Record<Tier, string> = {
  loved: 'Loved',
  recommended: 'Recommended',
  on_my_radar: 'On My Radar',
};
