import { useState } from 'react';
import { TierBadge } from './TierBadge';
import { BobbyPickBadge } from './BobbyPickBadge';
import { NotesSection, SourceSection, TagsSection, BobbyPickToggle } from './RestaurantFieldEditors';
import { TIER_OPTIONS } from '../constants/tiers';
import type { Restaurant } from '../types/restaurant';
import { BTN_PRIMARY, BTN_CANCEL, BTN_INLINE_EDIT, INPUT_CLASS, LABEL_CLASS } from './styles';

interface RestaurantListRowProps {
  restaurant: Restaurant;
  expanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (id: string, changes: Partial<Restaurant>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  cuisines: string[];
}

export function RestaurantListRow({
  restaurant,
  expanded,
  onToggleExpand,
  onUpdate,
  onDelete,
  cuisines,
}: RestaurantListRowProps) {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isEditingSource, setIsEditingSource] = useState(false);
  const [cuisineText, setCuisineText] = useState(restaurant.cuisine);
  const [isEditingCuisine, setIsEditingCuisine] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const applyUpdate = (id: string, changes: Partial<Restaurant>) => {
    void onUpdate(id, changes);
  };

  function handleSaveCuisine() {
    const trimmed = cuisineText.trim();
    if (trimmed && trimmed !== restaurant.cuisine) {
      applyUpdate(restaurant.id, { cuisine: trimmed });
    }
    setIsEditingCuisine(false);
  }

  function handleCancelCuisine() {
    setCuisineText(restaurant.cuisine);
    setIsEditingCuisine(false);
  }

  return (
    <div className="bg-white border border-brand-border rounded-lg font-sans text-sm text-stone-700">
      {/* Compact row */}
      <button
        type="button"
        onClick={onToggleExpand}
        className="w-full flex items-center gap-2 p-3 cursor-pointer hover:bg-brand-surface-warm rounded-lg min-h-[44px] text-left"
        aria-expanded={expanded}
        aria-label={`${expanded ? 'Collapse' : 'Expand'} ${restaurant.name}`}
      >
        <TierBadge tier={restaurant.tier} />
        <span className="font-bold truncate">{restaurant.name}</span>
        <span className="text-stone-400 text-xs truncate">{restaurant.cuisine}</span>
        {restaurant.featured && <BobbyPickBadge />}
        <svg
          className={`ml-auto w-4 h-4 text-stone-400 shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded editor */}
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-brand-border space-y-4">
          {/* Tier selector */}
          <div>
            <p className={LABEL_CLASS}>Tier</p>
            <div className="flex gap-2 flex-wrap">
              {TIER_OPTIONS.map(({ value, label }) => {
                const isActive = value === restaurant.tier;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => applyUpdate(restaurant.id, { tier: value })}
                    className={
                      isActive
                        ? 'inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-full text-xs font-sans font-bold bg-brand-chip text-white border border-brand-chip transition-colors'
                        : 'inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-full text-xs font-sans font-bold bg-white text-stone-500 border border-brand-border transition-colors hover:bg-stone-50'
                    }
                    aria-pressed={isActive}
                    aria-label={`Set tier to ${label}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cuisine */}
          <div>
            <p className={LABEL_CLASS}>Cuisine</p>
            {!isEditingCuisine ? (
              <div>
                <p className="font-sans text-xs text-stone-600 leading-snug mb-1">
                  {restaurant.cuisine}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCuisineText(restaurant.cuisine);
                    setIsEditingCuisine(true);
                  }}
                  className={BTN_INLINE_EDIT}
                  aria-label={`Edit cuisine for ${restaurant.name}`}
                >
                  Edit Cuisine
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  list={`cuisine-options-${restaurant.id}`}
                  value={cuisineText}
                  onChange={e => setCuisineText(e.target.value)}
                  placeholder="e.g. Desserts, Mexican, Thai"
                  className={`${INPUT_CLASS} min-h-[44px]`}
                  autoFocus
                  aria-label="Cuisine type"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (cuisineText.trim()) handleSaveCuisine();
                    }
                  }}
                />
                <datalist id={`cuisine-options-${restaurant.id}`}>
                  {cuisines.map(c => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <button
                    type="button"
                    disabled={!cuisineText.trim()}
                    onClick={handleSaveCuisine}
                    className={`${BTN_PRIMARY} py-2.5 px-3 min-h-[44px]`}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelCuisine}
                    className={BTN_CANCEL}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <NotesSection
            restaurant={restaurant}
            onUpdate={applyUpdate}
            open={isEditingNotes}
            onOpenChange={setIsEditingNotes}
            label="Notes"
          />

          <SourceSection
            restaurant={restaurant}
            onUpdate={applyUpdate}
            open={isEditingSource}
            onOpenChange={setIsEditingSource}
            label="Source"
          />

          <TagsSection restaurant={restaurant} onUpdate={applyUpdate} />

          <BobbyPickToggle restaurant={restaurant} onUpdate={applyUpdate} />

          {/* Delete */}
          <div className="pt-2 border-t border-stone-100">
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="text-red-600 font-sans text-xs font-semibold hover:text-red-800 transition-colors min-h-[44px] px-2 inline-flex items-center"
                aria-label={`Delete ${restaurant.name}`}
              >
                Delete Restaurant
              </button>
            ) : (
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-sans text-xs text-red-600 font-semibold">
                  Are you sure? This cannot be undone.
                </span>
                <button
                  type="button"
                  onClick={() => void onDelete(restaurant.id)}
                  className="bg-red-600 hover:bg-red-700 text-white font-sans text-xs font-bold rounded-lg py-2 px-3 transition-colors min-h-[44px]"
                  aria-label={`Confirm delete ${restaurant.name}`}
                >
                  Yes, Delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className={`${BTN_CANCEL} py-2 text-xs`}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
