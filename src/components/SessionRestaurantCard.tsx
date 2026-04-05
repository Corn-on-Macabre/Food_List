import { useState } from 'react';
import { TierBadge } from './TierBadge';
import { BobbyPickBadge } from './BobbyPickBadge';
import type { Restaurant, Tier } from '../types';

interface Props {
  restaurant: Restaurant;
  onTierChange: (id: string, newTier: Tier) => void;
  onNotesChange: (id: string, notes: string) => void;
  onSourceChange: (id: string, source: string) => void;
  onTagsChange: (id: string, tags: string[]) => void;
  onFeaturedChange: (id: string, featured: boolean) => void;
}

const TIER_OPTIONS: { value: Tier; label: string }[] = [
  { value: 'loved', label: 'Loved' },
  { value: 'recommended', label: 'Recommended' },
  { value: 'on_my_radar', label: 'On My Radar' },
];

const SUGGESTED_TAGS = ['date night', 'quick lunch', 'patio', 'kid-friendly'];

export function SessionRestaurantCard({ restaurant, onTierChange, onNotesChange, onSourceChange, onTagsChange, onFeaturedChange }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  // selectedTier is synced to restaurant.tier at the moment Edit Tier is clicked (see onClick below).
  // This is safe because restaurant.tier only changes via handleTierChange in the parent,
  // which only fires after Apply — at which point edit mode is already closed.
  const [selectedTier, setSelectedTier] = useState<Tier>(restaurant.tier);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [noteText, setNoteText] = useState(restaurant.notes ?? '');
  const [isEditingSource, setIsEditingSource] = useState(false);
  const [sourceText, setSourceText] = useState(restaurant.source ?? '');
  // activeTags: local state initialized from restaurant.tags.
  // All mutations go through onTagsChange → handleTagsChange in AdminDashboard, keeping local
  // state and the prop in sync. A useEffect sync would trigger react-hooks/set-state-in-effect.
  const [activeTags, setActiveTags] = useState<string[]>(restaurant.tags ?? []);
  const [customTagInput, setCustomTagInput] = useState('');

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

  function handleSaveSource() {
    onSourceChange(restaurant.id, sourceText.trim());
    setIsEditingSource(false);
  }

  function handleRemoveSource() {
    onSourceChange(restaurant.id, '');
    setSourceText('');
    setIsEditingSource(false);
  }

  function handleCancelSource() {
    setSourceText(restaurant.source ?? '');
    setIsEditingSource(false);
  }

  function handleTagToggle(tag: string) {
    const updatedTags = activeTags.includes(tag)
      ? activeTags.filter(t => t !== tag)
      : [...activeTags, tag];
    setActiveTags(updatedTags);
    onTagsChange(restaurant.id, updatedTags);
  }

  function handleAddCustomTag() {
    const trimmed = customTagInput.trim();
    if (!trimmed || activeTags.includes(trimmed)) return;
    const updatedTags = [...activeTags, trimmed];
    setActiveTags(updatedTags);
    onTagsChange(restaurant.id, updatedTags);
    setCustomTagInput('');
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
          {restaurant.featured && <BobbyPickBadge />}
          <span className="text-stone-400">{restaurant.cuisine}</span>
          <button
            type="button"
            onClick={() => {
              // Mutual exclusion: close notes editor if open
              if (isEditingNotes) {
                setIsEditingNotes(false);
                setNoteText(restaurant.notes ?? '');
              }
              // Mutual exclusion: close source editor if open
              if (isEditingSource) {
                setIsEditingSource(false);
                setSourceText(restaurant.source ?? '');
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
                  // Mutual exclusion: close source editor if open
                  if (isEditingSource) {
                    setIsEditingSource(false);
                    setSourceText(restaurant.source ?? '');
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
                // Mutual exclusion: close source editor if open
                if (isEditingSource) {
                  setIsEditingSource(false);
                  setSourceText(restaurant.source ?? '');
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

      {/* Source section — display mode */}
      {!isEditingSource && (
        <div className="mt-1">
          {restaurant.source ? (
            <>
              <p className="font-sans text-xs text-stone-500 mt-1 leading-snug">
                Source: <span className="italic">{restaurant.source}</span>
              </p>
              <button
                type="button"
                onClick={() => {
                  // Mutual exclusion: close tier and notes editors if open
                  if (isEditing) { setIsEditing(false); setSelectedTier(restaurant.tier); }
                  if (isEditingNotes) { setIsEditingNotes(false); setNoteText(restaurant.notes ?? ''); }
                  setSourceText(restaurant.source ?? '');
                  setIsEditingSource(true);
                }}
                className="font-sans text-xs text-stone-400 hover:text-stone-600 transition-colors min-h-[44px] px-2 inline-flex items-center"
                aria-label={`Edit source for ${restaurant.name}`}
              >
                Edit Source
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                // Mutual exclusion: close tier and notes editors if open
                if (isEditing) { setIsEditing(false); setSelectedTier(restaurant.tier); }
                if (isEditingNotes) { setIsEditingNotes(false); setNoteText(restaurant.notes ?? ''); }
                setSourceText('');
                setIsEditingSource(true);
              }}
              className="font-sans text-xs text-stone-400 hover:text-stone-600 transition-colors min-h-[44px] px-2 inline-flex items-center"
              aria-label={`Add source for ${restaurant.name}`}
            >
              Add Source
            </button>
          )}
        </div>
      )}

      {/* Source editor */}
      {isEditingSource && (
        <div className="mt-2">
          <input
            type="text"
            value={sourceText}
            onChange={e => setSourceText(e.target.value)}
            placeholder="e.g. TikTok @phxfoodie, friend Dave"
            className="w-full border border-[#E8E0D5] rounded-lg p-3 font-sans text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#FDE68A] min-h-[44px]"
            autoFocus
            aria-label="Source attribution"
            data-testid="source-input"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (sourceText.trim()) handleSaveSource();
              }
            }}
          />
          <div className="flex gap-2 mt-2 flex-wrap">
            <button
              type="button"
              disabled={!sourceText.trim()}
              onClick={handleSaveSource}
              className="bg-[#D97706] hover:bg-[#B45309] text-white font-sans text-sm font-bold rounded-lg py-2.5 px-3 transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
              data-testid="save-source-btn"
            >
              Save
            </button>
            {restaurant.source && (
              <button
                type="button"
                onClick={handleRemoveSource}
                className="border border-red-300 text-red-600 hover:bg-red-50 font-sans text-sm font-bold rounded-lg py-2.5 px-3 transition-colors min-h-[44px]"
                data-testid="remove-source-btn"
                aria-label={`Remove source for ${restaurant.name}`}
              >
                Remove Source
              </button>
            )}
            <button
              type="button"
              onClick={handleCancelSource}
              className="border border-[#E8E0D5] rounded-lg px-3 py-2.5 font-sans text-sm font-bold text-stone-500 hover:bg-stone-50 min-h-[44px]"
              data-testid="cancel-source-btn"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Tags section */}
      <div className="mt-2">
        <p className="font-sans text-[11px] font-bold uppercase tracking-[0.1em] text-stone-400 mb-1">Tags</p>
        <div className="flex flex-wrap gap-1">
          {SUGGESTED_TAGS.map(tag => {
            const isActive = activeTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagToggle(tag)}
                className={
                  isActive
                    ? 'inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-full text-xs font-sans font-bold bg-amber-100 text-amber-800 border border-amber-300 transition-colors'
                    : 'inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-full text-xs font-sans font-bold bg-stone-100 text-stone-500 border border-[#E8E0D5] transition-colors hover:bg-stone-200'
                }
                aria-pressed={isActive}
                aria-label={`${isActive ? 'Remove' : 'Add'} tag: ${tag}`}
                data-testid={`tag-chip-${tag.replace(/\s+/g, '-')}`}
              >
                {tag}
              </button>
            );
          })}
          {/* Custom tags (user-added, not in SUGGESTED_TAGS) */}
          {activeTags
            .filter(t => !SUGGESTED_TAGS.includes(t))
            .map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagToggle(tag)}
                className="inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-full text-xs font-sans font-bold bg-amber-100 text-amber-800 border border-amber-300 transition-colors"
                aria-pressed={true}
                aria-label={`Remove tag: ${tag}`}
                data-testid={`tag-chip-custom-${tag.replace(/\s+/g, '-')}`}
              >
                {tag} <span aria-hidden="true">✕</span>
              </button>
            ))}
        </div>
        {/* Custom tag input */}
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={customTagInput}
            onChange={e => setCustomTagInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (customTagInput.trim()) handleAddCustomTag();
              }
            }}
            placeholder="Custom tag..."
            className="flex-1 border border-[#E8E0D5] rounded-lg p-2 font-sans text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#FDE68A] min-h-[44px]"
            aria-label="Custom tag input"
            data-testid="session-custom-tag-input"
          />
          <button
            type="button"
            disabled={!customTagInput.trim()}
            onClick={handleAddCustomTag}
            className="border border-[#E8E0D5] rounded-lg px-3 py-1.5 font-sans text-xs font-bold text-stone-500 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
            data-testid="session-add-custom-tag-btn"
          >
            Add
          </button>
        </div>
      </div>

      {/* Bobby's Pick toggle */}
      <div className="mt-2 flex items-center">
        <button
          type="button"
          // Invariant: restaurant.featured is always `true` or `undefined`, never `false`.
          // AdminDashboard.handleFeaturedChange stores `featured ? true : undefined`.
          // So `!restaurant.featured` is `true` when undefined (activate) and `false` when true (deactivate).
          onClick={() => onFeaturedChange(restaurant.id, !restaurant.featured)}
          aria-pressed={restaurant.featured === true}
          aria-label={`Toggle Bobby's Pick for ${restaurant.name}`}
          data-testid="bobby-pick-toggle"
          className={
            restaurant.featured
              ? 'inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-full text-xs font-sans font-bold bg-amber-400 text-amber-900 border border-amber-500 transition-colors'
              : 'inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-full text-xs font-sans font-bold bg-stone-100 text-stone-500 border border-[#E8E0D5] transition-colors hover:bg-stone-200'
          }
        >
          <span aria-hidden="true" className="mr-1">★</span>
          Bobby's Pick
        </button>
      </div>
    </div>
  );
}
