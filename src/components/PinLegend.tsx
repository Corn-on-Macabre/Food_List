import { TIER_COLORS, TIER_LABELS } from '../constants/tierColors';
import type { Tier } from '../types';

const TIERS: Tier[] = ['loved', 'recommended', 'on_my_radar'];

export function PinLegend() {
  return (
    <div
      role="region"
      aria-label="Map Legend"
      className="fixed bottom-4 left-4 bg-brand-bg/95 backdrop-blur-sm rounded-xl border border-brand-border-light shadow-md px-3 py-2 flex flex-col gap-1.5 z-10"
    >
      {TIERS.map((tier) => (
        <div key={tier} className="flex items-center gap-2">
          <span
            aria-hidden="true"
            data-testid={`tier-swatch-${tier}`}
            className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0 border border-white"
            style={{ backgroundColor: TIER_COLORS[tier] }}
          />
          <span className="text-[11px] font-sans font-semibold text-stone-500">{TIER_LABELS[tier]}</span>
        </div>
      ))}
    </div>
  );
}
