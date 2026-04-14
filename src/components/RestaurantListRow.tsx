import { useState } from 'react';
import { TierBadge } from './TierBadge';
import { BobbyPickBadge } from './BobbyPickBadge';
import type { Restaurant, Tier } from '../types/restaurant';

interface RestaurantListRowProps {
  restaurant: Restaurant;
  expanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (id: string, changes: Partial<Restaurant>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const TIER_OPTIONS: { value: Tier; label: string }[] = [
  { value: 'loved', label: 'Loved' },
  { value: 'recommended', label: 'Recommended' },
  { value: 'on_my_radar', label: 'On My Radar' },
];

const SUGGESTED_TAGS = ['date night', 'quick lunch', 'patio', 'kid-friendly'];

export function RestaurantListRow({
  restaurant,
  expanded,
  onToggleExpand,
  onUpdate,
  onDelete,
}: RestaurantListRowProps) {
  const [noteText, setNoteText] = useState(restaurant.notes ?? '');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [sourceText, setSourceText] = useState(restaurant.source ?? '');
  const [isEditingSource, setIsEditingSource] = useState(false);
  const [activeTags, setActiveTags] = useState<string[]>(restaurant.tags ?? []);
  const [customTagInput, setCustomTagInput] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleSaveNote() {
    void onUpdate(restaurant.id, { notes: noteText.trim() || undefined });
    setIsEditingNotes(false);
  }

  function handleCancelNote() {
    setNoteText(restaurant.notes ?? '');
    setIsEditingNotes(false);
  }

  function handleSaveSource() {
    void onUpdate(restaurant.id, { source: sourceText.trim() || undefined });
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
    void onUpdate(restaurant.id, { tags: updatedTags });
  }

  function handleAddCustomTag() {
    const trimmed = customTagInput.trim();
    if (!trimmed || activeTags.includes(trimmed)) return;
    const updatedTags = [...activeTags, trimmed];
    setActiveTags(updatedTags);
    void onUpdate(restaurant.id, { tags: updatedTags });
    setCustomTagInput('');
  }

  return (
    <div className="bg-white border border-[#E8E0D5] rounded-lg font-sans text-sm text-stone-700">
      {/* Compact row */}
      <button
        type="button"
        onClick={onToggleExpand}
        className="w-full flex items-center gap-2 p-3 cursor-pointer hover:bg-[#FFF8EE] rounded-lg min-h-[44px] text-left"
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
        <div className="px-3 pb-3 pt-1 border-t border-[#E8E0D5] space-y-4">
          {/* Tier selector */}
          <div>
            <p className="block font-sans text-[11px] font-bold uppercase tracking-[0.1em] text-stone-400 mb-1">Tier</p>
            <div className="flex gap-2 flex-wrap">
              {TIER_OPTIONS.map(({ value, label }) => {
                const isActive = value === restaurant.tier;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => void onUpdate(restaurant.id, { tier: value })}
                    className={
                      isActive
                        ? 'inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-full text-xs font-sans font-bold bg-amber-700 text-white border border-amber-700 transition-colors'
                        : 'inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-full text-xs font-sans font-bold bg-white text-stone-500 border border-[#E8E0D5] transition-colors hover:bg-stone-50'
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

          {/* Notes */}
          <div>
            <p className="block font-sans text-[11px] font-bold uppercase tracking-[0.1em] text-stone-400 mb-1">Notes</p>
            {!isEditingNotes ? (
              <div>
                {restaurant.notes && (
                  <p className="font-sans text-xs text-stone-600 leading-snug italic mb-1">
                    {restaurant.notes}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setNoteText(restaurant.notes ?? '');
                    setIsEditingNotes(true);
                  }}
                  className="font-sans text-xs text-stone-400 hover:text-stone-600 transition-colors min-h-[44px] px-2 inline-flex items-center"
                  aria-label={restaurant.notes ? `Edit note for ${restaurant.name}` : `Add note for ${restaurant.name}`}
                >
                  {restaurant.notes ? 'Edit Note' : 'Add Note'}
                </button>
              </div>
            ) : (
              <div>
                <textarea
                  rows={3}
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder="Add a note, e.g. 'try the bone marrow pho'"
                  className="w-full border border-[#E8E0D5] rounded-lg p-3 font-sans text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#FDE68A] min-h-[80px]"
                  autoFocus
                  aria-label="Restaurant note"
                />
                <div className="flex gap-2 mt-2 flex-wrap">
                  <button
                    type="button"
                    disabled={!noteText.trim()}
                    onClick={handleSaveNote}
                    className="bg-[#D97706] hover:bg-[#B45309] text-white font-sans text-sm font-bold rounded-lg py-2.5 px-3 transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelNote}
                    className="border border-[#E8E0D5] rounded-lg px-3 py-2.5 font-sans text-sm font-bold text-stone-500 hover:bg-stone-50 min-h-[44px]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Source */}
          <div>
            <p className="block font-sans text-[11px] font-bold uppercase tracking-[0.1em] text-stone-400 mb-1">Source</p>
            {!isEditingSource ? (
              <div>
                {restaurant.source && (
                  <p className="font-sans text-xs text-stone-500 leading-snug mb-1">
                    <span className="italic">{restaurant.source}</span>
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSourceText(restaurant.source ?? '');
                    setIsEditingSource(true);
                  }}
                  className="font-sans text-xs text-stone-400 hover:text-stone-600 transition-colors min-h-[44px] px-2 inline-flex items-center"
                  aria-label={restaurant.source ? `Edit source for ${restaurant.name}` : `Add source for ${restaurant.name}`}
                >
                  {restaurant.source ? 'Edit Source' : 'Add Source'}
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  value={sourceText}
                  onChange={e => setSourceText(e.target.value)}
                  placeholder="e.g. TikTok @phxfoodie, friend Dave"
                  className="w-full border border-[#E8E0D5] rounded-lg p-3 font-sans text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#FDE68A] min-h-[44px]"
                  autoFocus
                  aria-label="Source attribution"
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
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelSource}
                    className="border border-[#E8E0D5] rounded-lg px-3 py-2.5 font-sans text-sm font-bold text-stone-500 hover:bg-stone-50 min-h-[44px]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <p className="block font-sans text-[11px] font-bold uppercase tracking-[0.1em] text-stone-400 mb-1">Tags</p>
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
                  >
                    {tag}
                  </button>
                );
              })}
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
                  >
                    {tag} <span aria-hidden="true" className="ml-1">&#10005;</span>
                  </button>
                ))}
            </div>
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
              />
              <button
                type="button"
                disabled={!customTagInput.trim()}
                onClick={handleAddCustomTag}
                className="border border-[#E8E0D5] rounded-lg px-3 py-1.5 font-sans text-xs font-bold text-stone-500 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
              >
                Add
              </button>
            </div>
          </div>

          {/* Bobby's Pick toggle */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => void onUpdate(restaurant.id, { featured: !restaurant.featured })}
              aria-pressed={restaurant.featured === true}
              aria-label={`Toggle Bobby's Pick for ${restaurant.name}`}
              className={
                restaurant.featured
                  ? 'inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-full text-xs font-sans font-bold bg-amber-400 text-amber-900 border border-amber-500 transition-colors'
                  : 'inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-full text-xs font-sans font-bold bg-stone-100 text-stone-500 border border-[#E8E0D5] transition-colors hover:bg-stone-200'
              }
            >
              <span aria-hidden="true" className="mr-1">&#9733;</span>
              Bobby&#39;s Pick
            </button>
          </div>

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
                  className="border border-[#E8E0D5] rounded-lg px-3 py-2 font-sans text-xs font-bold text-stone-500 hover:bg-stone-50 min-h-[44px]"
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
