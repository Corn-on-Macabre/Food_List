import { useState } from 'react';
import { TierBadge } from './TierBadge';
import type { Restaurant, Tier } from '../types';

interface Props {
  restaurant: Restaurant;
  onTierChange: (id: string, newTier: Tier) => void;
  onNotesChange: (id: string, notes: string) => void;
}

const TIER_OPTIONS: { value: Tier; label: string }[] = [
  { value: 'loved', label: 'Loved' },
  { value: 'recommended', label: 'Recommended' },
  { value: 'on_my_radar', label: 'On My Radar' },
];

export function SessionRestaurantCard({ restaurant, onTierChange, onNotesChange }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  // selectedTier is synced to restaurant.tier at the moment Edit Tier is clicked (see onClick below).
  // This is safe because restaurant.tier only changes via handleTierChange in the parent,
  // which only fires after Apply — at which point edit mode is already closed.
  const [selectedTier, setSelectedTier] = useState<Tier>(restaurant.tier);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [noteText, setNoteText] = useState(restaurant.notes ?? '');

  function handleApply() {
    onTierChange(restaurant.id, selectedTier);
    setIsEditing(false);
  }

  function handleCancel() {
    setSelectedTier(restaurant.tier);
    setIsEditing(false);
  }

  function handleSaveNote() {
    onNotesChange(restaurant.id, noteText.trim());
    setIsEditingNotes(false);
  }

  function handleDeleteNote() {
    onNotesChange(restaurant.id, '');
    setNoteText('');
    setIsEditingNotes(false);
  }

  function handleCancelNote() {
    setNoteText(restaurant.notes ?? '');
    setIsEditingNotes(false);
  }

  return (
    <div
      data-testid="session-restaurant-card"
      className="bg-white border border-[#E8E0D5] rounded-lg p-3 font-sans text-sm text-stone-700"
    >
      {/* Tier row — always visible (tier edit or display) */}
      {!isEditing ? (
        <div className="flex items-center gap-2">
          <TierBadge tier={restaurant.tier} />
          <span className="font-bold">{restaurant.name}</span>
          <span className="text-stone-400">{restaurant.cuisine}</span>
          <button
            type="button"
            onClick={() => {
              // Mutual exclusion: close notes editor if open
              if (isEditingNotes) {
                setIsEditingNotes(false);
                setNoteText(restaurant.notes ?? '');
              }
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

      {/* Notes section — display mode */}
      {!isEditingNotes && (
        <div className="mt-1">
          {restaurant.notes ? (
            <>
              {!isEditing && (
                <p className="font-sans text-xs text-stone-600 mt-1 leading-snug italic">
                  {restaurant.notes}
                </p>
              )}
              <button
                type="button"
                onClick={() => {
                  // Mutual exclusion: close tier edit if open
                  if (isEditing) {
                    setIsEditing(false);
                    setSelectedTier(restaurant.tier);
                  }
                  setNoteText(restaurant.notes ?? '');
                  setIsEditingNotes(true);
                }}
                className="font-sans text-xs text-stone-400 hover:text-stone-600 transition-colors min-h-[44px] px-2 inline-flex items-center"
                aria-label={`Edit note for ${restaurant.name}`}
              >
                Edit Note
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                // Mutual exclusion: close tier edit if open
                if (isEditing) {
                  setIsEditing(false);
                  setSelectedTier(restaurant.tier);
                }
                setNoteText('');
                setIsEditingNotes(true);
              }}
              className="font-sans text-xs text-stone-400 hover:text-stone-600 transition-colors min-h-[44px] px-2 inline-flex items-center"
              aria-label={`Add note for ${restaurant.name}`}
            >
              Add Note
            </button>
          )}
        </div>
      )}

      {/* Notes editor */}
      {isEditingNotes && (
        <div className="mt-2">
          <textarea
            rows={3}
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            placeholder="Add a note, e.g. 'try the bone marrow pho'"
            className="w-full border border-[#E8E0D5] rounded-lg p-3 font-sans text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#FDE68A] min-h-[80px]"
            autoFocus
            aria-label="Restaurant note"
            data-testid="note-textarea"
          />
          <div className="flex gap-2 mt-2 flex-wrap">
            <button
              type="button"
              disabled={!noteText.trim()}
              onClick={handleSaveNote}
              className="bg-[#D97706] hover:bg-[#B45309] text-white font-sans text-sm font-bold rounded-lg py-2.5 px-3 transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
              data-testid="save-note-btn"
            >
              Save Note
            </button>
            {restaurant.notes && (
              <button
                type="button"
                onClick={handleDeleteNote}
                className="border border-red-300 text-red-600 hover:bg-red-50 font-sans text-sm font-bold rounded-lg py-2.5 px-3 transition-colors min-h-[44px]"
                data-testid="delete-note-btn"
                aria-label={`Delete note for ${restaurant.name}`}
              >
                Delete Note
              </button>
            )}
            <button
              type="button"
              onClick={handleCancelNote}
              className="border border-[#E8E0D5] rounded-lg px-3 py-2.5 font-sans text-sm font-bold text-stone-500 hover:bg-stone-50 min-h-[44px]"
              data-testid="cancel-note-btn"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
