import { useState } from 'react';
import { TierBadge } from './TierBadge';
import type { Restaurant, Tier } from '../types';

interface Props {
  restaurant: Restaurant;
  onTierChange: (id: string, newTier: Tier) => void;
}

const TIER_OPTIONS: { value: Tier; label: string }[] = [
  { value: 'loved', label: 'Loved' },
  { value: 'recommended', label: 'Recommended' },
  { value: 'on_my_radar', label: 'On My Radar' },
];

export function SessionRestaurantCard({ restaurant, onTierChange }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  // selectedTier is synced to restaurant.tier at the moment Edit Tier is clicked (see onClick below).
  // This is safe because restaurant.tier only changes via handleTierChange in the parent,
  // which only fires after Apply — at which point edit mode is already closed.
  const [selectedTier, setSelectedTier] = useState<Tier>(restaurant.tier);

  function handleApply() {
    onTierChange(restaurant.id, selectedTier);
    setIsEditing(false);
  }

  function handleCancel() {
    setSelectedTier(restaurant.tier);
    setIsEditing(false);
  }

  return (
    <div
      data-testid="session-restaurant-card"
      className="bg-white border border-[#E8E0D5] rounded-lg p-3 font-sans text-sm text-stone-700"
    >
      {!isEditing ? (
        <div className="flex items-center gap-2">
          <TierBadge tier={restaurant.tier} />
          <span className="font-bold">{restaurant.name}</span>
          <span className="text-stone-400">{restaurant.cuisine}</span>
          <button
            type="button"
            onClick={() => {
              setSelectedTier(restaurant.tier);
              setIsEditing(true);
            }}
            className="ml-auto min-h-[44px] px-2 inline-flex items-center font-sans text-xs text-stone-400 hover:text-stone-600 transition-colors"
            aria-label={`Edit tier for ${restaurant.name}`}
          >
            Edit Tier
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedTier}
            onChange={e => setSelectedTier(e.target.value as Tier)}
            className="border border-[#E8E0D5] rounded-lg px-2 font-sans text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#FDE68A] min-h-[44px]"
            aria-label="Select tier"
          >
            {TIER_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleApply}
            className="bg-[#D97706] hover:bg-[#B45309] text-white font-sans text-sm font-bold rounded-lg py-2.5 px-3 transition-colors min-h-[44px]"
            aria-label="Apply tier change"
          >
            ✓ Apply
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="border border-[#E8E0D5] rounded-lg px-3 py-2.5 font-sans text-sm font-bold text-stone-500 hover:bg-stone-50 min-h-[44px]"
            aria-label="Cancel tier change"
          >
            ✕ Cancel
          </button>
        </div>
      )}
    </div>
  );
}
