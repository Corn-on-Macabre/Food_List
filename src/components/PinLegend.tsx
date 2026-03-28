import { TIER_COLORS } from '../constants/tierColors';
import type { Tier } from '../types';

const TIER_ENTRIES: { tier: Tier; label: string }[] = [
  { tier: 'loved',       label: 'Loved' },
  { tier: 'recommended', label: 'Recommended' },
  { tier: 'on_my_radar', label: 'On My Radar' },
];

export function PinLegend() {
  return (
    <div
      role="region"
      aria-label="Map Legend"
      className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md px-3 py-2 flex flex-col gap-1.5 z-10"
    >
      {TIER_ENTRIES.map(({ tier, label }) => (
        <div key={tier} className="flex items-center gap-2">
          <span
            aria-hidden="true"
            data-testid={`tier-swatch-${tier}`}
            className="w-3 h-3 rounded-full inline-block flex-shrink-0"
            style={{ backgroundColor: TIER_COLORS[tier] }}
          />
          <span className="text-xs text-gray-700 font-medium">{label}</span>
        </div>
      ))}
    </div>
  );
}
