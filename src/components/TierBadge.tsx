import { TIER_LABELS } from '../constants/tierColors';
import { TIER_BADGE_BASE, TIER_BADGE_CLASSES } from './styles';
import type { Tier } from '../types';

interface Props {
  tier: Tier;
}

export function TierBadge({ tier }: Props) {
  return (
    <span
      data-testid="tier-badge"
      aria-label={`Tier: ${TIER_LABELS[tier]}`}
      className={`${TIER_BADGE_BASE} ${TIER_BADGE_CLASSES[tier]}`}
    >
      {TIER_LABELS[tier]}
    </span>
  );
}
