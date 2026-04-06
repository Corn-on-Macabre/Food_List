// Colors must stay in sync with TIER_COLORS (src/constants/tierColors.ts) and public map pin colors.
import { TIER_COLORS } from '../constants/tierColors';
import type { Tier } from '../types';

const TIER_LABELS: Record<Tier, string> = {
  loved: 'Loved',
  recommended: 'Recommended',
  on_my_radar: 'On My Radar',
};

interface Props {
  tier: Tier;
}

export function TierBadge({ tier }: Props) {
  return (
    <span
      data-testid="tier-badge"
      aria-label={`Tier: ${TIER_LABELS[tier]}`}
      style={{ backgroundColor: TIER_COLORS[tier] }}
      className="inline-flex items-center px-2 py-0.5 rounded-full font-sans text-xs font-bold text-white"
    >
      {TIER_LABELS[tier]}
    </span>
  );
}
