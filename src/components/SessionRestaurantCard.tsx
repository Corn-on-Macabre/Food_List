import { useState } from 'react';
import { TierBadge } from './TierBadge';
import { BobbyPickBadge } from './BobbyPickBadge';
import { NotesSection, SourceSection, TagsSection, BobbyPickToggle } from './RestaurantFieldEditors';
import { TIER_OPTIONS } from '../constants/tiers';
import type { Restaurant, Tier } from '../types';
import { BTN_PRIMARY, BTN_CANCEL, BTN_INLINE_EDIT } from './styles';

interface Props {
  restaurant: Restaurant;
  onUpdate: (id: string, changes: Partial<Restaurant>) => void;
}

// One editor open at a time — opening one closes the others (drafts are
// re-initialized from the restaurant on open, so nothing stale leaks through).
type ActiveEditor = 'tier' | 'notes' | 'source' | null;

export function SessionRestaurantCard({ restaurant, onUpdate }: Props) {
  const [activeEditor, setActiveEditor] = useState<ActiveEditor>(null);
  const [selectedTier, setSelectedTier] = useState<Tier>(restaurant.tier);

  const isEditingTier = activeEditor === 'tier';

  function handleApplyTier() {
    onUpdate(restaurant.id, { tier: selectedTier });
    setActiveEditor(null);
  }

  return (
    <div
      data-testid="session-restaurant-card"
      className="bg-brand-surface border border-brand-border rounded-lg p-3 font-sans text-sm text-brand-text"
    >
      {/* Tier row — always visible (tier edit or display) */}
      {!isEditingTier ? (
        <div className="flex items-center gap-2">
          <TierBadge tier={restaurant.tier} />
          <span className="font-bold">{restaurant.name}</span>
          {restaurant.featured && <BobbyPickBadge />}
          <span className="text-brand-text-faint">{restaurant.cuisine}</span>
          <button
            type="button"
            onClick={() => {
              setSelectedTier(restaurant.tier);
              setActiveEditor('tier');
            }}
            className={`ml-auto ${BTN_INLINE_EDIT}`}
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
            className="border border-brand-border rounded-lg px-2 font-sans text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-focus min-h-[44px]"
            aria-label="Select tier"
          >
            {TIER_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleApplyTier}
            className={`${BTN_PRIMARY} py-2.5 px-3 min-h-[44px]`}
            aria-label="Apply tier change"
          >
            ✓ Apply
          </button>
          <button
            type="button"
            onClick={() => setActiveEditor(null)}
            className={BTN_CANCEL}
            aria-label="Cancel tier change"
          >
            ✕ Cancel
          </button>
        </div>
      )}

      <NotesSection
        restaurant={restaurant}
        onUpdate={onUpdate}
        open={activeEditor === 'notes'}
        onOpenChange={open => setActiveEditor(open ? 'notes' : null)}
      />

      <SourceSection
        restaurant={restaurant}
        onUpdate={onUpdate}
        open={activeEditor === 'source'}
        onOpenChange={open => setActiveEditor(open ? 'source' : null)}
      />

      <TagsSection restaurant={restaurant} onUpdate={onUpdate} />

      <BobbyPickToggle restaurant={restaurant} onUpdate={onUpdate} />
    </div>
  );
}
