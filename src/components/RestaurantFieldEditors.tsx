import { useState } from 'react';
import type { Restaurant } from '../types';
import { SUGGESTED_TAGS } from '../constants/tags';
import {
  BTN_PRIMARY,
  BTN_CANCEL,
  BTN_DANGER_OUTLINE,
  BTN_INLINE_EDIT,
  CHIP_TOGGLE_ACTIVE,
  CHIP_TOGGLE_INACTIVE,
  CHIP_PICK_ACTIVE,
  INPUT_CLASS,
  LABEL_CLASS,
} from './styles';

// Shared admin field editors used by SessionRestaurantCard (add flow) and
// RestaurantListRow (all-restaurants tab). All mutations flow through a single
// onUpdate(id, changes) so the two admin surfaces cannot drift.

export interface FieldEditorProps {
  restaurant: Restaurant;
  onUpdate: (id: string, changes: Partial<Restaurant>) => void;
  /** Controlled open state so the parent can enforce one-editor-at-a-time. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional uppercase section heading (used by the list row layout). */
  label?: string;
}

export function NotesSection({ restaurant, onUpdate, open, onOpenChange, label }: FieldEditorProps) {
  const [noteText, setNoteText] = useState('');

  function openEditor() {
    setNoteText(restaurant.notes ?? '');
    onOpenChange(true);
  }

  function handleSave() {
    onUpdate(restaurant.id, { notes: noteText.trim() || undefined });
    onOpenChange(false);
  }

  function handleDelete() {
    onUpdate(restaurant.id, { notes: undefined });
    setNoteText('');
    onOpenChange(false);
  }

  return (
    <div className="mt-1">
      {label && <p className={LABEL_CLASS}>{label}</p>}
      {!open ? (
        <>
          {restaurant.notes && (
            <p className="font-sans text-xs text-stone-600 mt-1 leading-snug italic">
              {restaurant.notes}
            </p>
          )}
          <button
            type="button"
            onClick={openEditor}
            className={BTN_INLINE_EDIT}
            aria-label={`${restaurant.notes ? 'Edit' : 'Add'} note for ${restaurant.name}`}
          >
            {restaurant.notes ? 'Edit Note' : 'Add Note'}
          </button>
        </>
      ) : (
        <div className="mt-1">
          <textarea
            rows={3}
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            placeholder="Add a note, e.g. 'try the bone marrow pho'"
            className={`${INPUT_CLASS} min-h-[80px]`}
            autoFocus
            aria-label="Restaurant note"
            data-testid="note-textarea"
          />
          <div className="flex gap-2 mt-2 flex-wrap">
            <button
              type="button"
              disabled={!noteText.trim()}
              onClick={handleSave}
              className={`${BTN_PRIMARY} py-2.5 px-3 min-h-[44px]`}
              data-testid="save-note-btn"
            >
              Save Note
            </button>
            {restaurant.notes && (
              <button
                type="button"
                onClick={handleDelete}
                className={BTN_DANGER_OUTLINE}
                data-testid="delete-note-btn"
                aria-label={`Delete note for ${restaurant.name}`}
              >
                Delete Note
              </button>
            )}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className={BTN_CANCEL}
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

export function SourceSection({ restaurant, onUpdate, open, onOpenChange, label }: FieldEditorProps) {
  const [sourceText, setSourceText] = useState('');

  function openEditor() {
    setSourceText(restaurant.source ?? '');
    onOpenChange(true);
  }

  function handleSave() {
    onUpdate(restaurant.id, { source: sourceText.trim() || undefined });
    onOpenChange(false);
  }

  function handleRemove() {
    onUpdate(restaurant.id, { source: undefined });
    setSourceText('');
    onOpenChange(false);
  }

  return (
    <div className="mt-1">
      {label && <p className={LABEL_CLASS}>{label}</p>}
      {!open ? (
        <>
          {restaurant.source && (
            <p className="font-sans text-xs text-stone-500 mt-1 leading-snug">
              {!label && 'Source: '}<span className="italic">{restaurant.source}</span>
            </p>
          )}
          <button
            type="button"
            onClick={openEditor}
            className={BTN_INLINE_EDIT}
            aria-label={`${restaurant.source ? 'Edit' : 'Add'} source for ${restaurant.name}`}
          >
            {restaurant.source ? 'Edit Source' : 'Add Source'}
          </button>
        </>
      ) : (
        <div className="mt-1">
          <input
            type="text"
            value={sourceText}
            onChange={e => setSourceText(e.target.value)}
            placeholder="e.g. TikTok @phxfoodie, friend Dave"
            className={`${INPUT_CLASS} min-h-[44px]`}
            autoFocus
            aria-label="Source attribution"
            data-testid="source-input"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (sourceText.trim()) handleSave();
              }
            }}
          />
          <div className="flex gap-2 mt-2 flex-wrap">
            <button
              type="button"
              disabled={!sourceText.trim()}
              onClick={handleSave}
              className={`${BTN_PRIMARY} py-2.5 px-3 min-h-[44px]`}
              data-testid="save-source-btn"
            >
              Save
            </button>
            {restaurant.source && (
              <button
                type="button"
                onClick={handleRemove}
                className={BTN_DANGER_OUTLINE}
                data-testid="remove-source-btn"
                aria-label={`Remove source for ${restaurant.name}`}
              >
                Remove Source
              </button>
            )}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className={BTN_CANCEL}
              data-testid="cancel-source-btn"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface TagsSectionProps {
  restaurant: Restaurant;
  onUpdate: (id: string, changes: Partial<Restaurant>) => void;
  label?: string;
}

export function TagsSection({ restaurant, onUpdate, label = 'Tags' }: TagsSectionProps) {
  // Local state initialized from restaurant.tags; every mutation flows through
  // onUpdate so parent state and this stay in sync. (A useEffect sync would
  // trigger react-hooks/set-state-in-effect.)
  const [activeTags, setActiveTags] = useState<string[]>(restaurant.tags ?? []);
  const [customTagInput, setCustomTagInput] = useState('');

  function applyTags(updatedTags: string[]) {
    setActiveTags(updatedTags);
    onUpdate(restaurant.id, { tags: updatedTags.length > 0 ? updatedTags : undefined });
  }

  function handleTagToggle(tag: string) {
    applyTags(
      activeTags.includes(tag)
        ? activeTags.filter(t => t !== tag)
        : [...activeTags, tag],
    );
  }

  function handleAddCustomTag() {
    const trimmed = customTagInput.trim();
    if (!trimmed || activeTags.includes(trimmed)) return;
    applyTags([...activeTags, trimmed]);
    setCustomTagInput('');
  }

  return (
    <div className="mt-2">
      <p className={LABEL_CLASS}>{label}</p>
      <div className="flex flex-wrap gap-1">
        {SUGGESTED_TAGS.map(tag => {
          const isActive = activeTags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => handleTagToggle(tag)}
              className={isActive ? CHIP_TOGGLE_ACTIVE : CHIP_TOGGLE_INACTIVE}
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
              className={CHIP_TOGGLE_ACTIVE}
              aria-pressed={true}
              aria-label={`Remove tag: ${tag}`}
              data-testid={`tag-chip-custom-${tag.replace(/\s+/g, '-')}`}
            >
              {tag} <span aria-hidden="true" className="ml-1">✕</span>
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
          className="flex-1 border border-brand-border rounded-lg p-2 font-sans text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-focus min-h-[44px]"
          aria-label="Custom tag input"
          data-testid="session-custom-tag-input"
        />
        <button
          type="button"
          disabled={!customTagInput.trim()}
          onClick={handleAddCustomTag}
          className="border border-brand-border rounded-lg px-3 py-1.5 font-sans text-xs font-bold text-stone-500 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
          data-testid="session-add-custom-tag-btn"
        >
          Add
        </button>
      </div>
    </div>
  );
}

interface BobbyPickToggleProps {
  restaurant: Restaurant;
  onUpdate: (id: string, changes: Partial<Restaurant>) => void;
}

export function BobbyPickToggle({ restaurant, onUpdate }: BobbyPickToggleProps) {
  return (
    <div className="mt-2 flex items-center">
      <button
        type="button"
        // Invariant: restaurant.featured is always `true` or `undefined`,
        // never `false` — deactivating clears the field entirely.
        onClick={() => onUpdate(restaurant.id, { featured: restaurant.featured ? undefined : true })}
        aria-pressed={restaurant.featured === true}
        aria-label={`Toggle Bobby's Pick for ${restaurant.name}`}
        data-testid="bobby-pick-toggle"
        className={restaurant.featured ? CHIP_PICK_ACTIVE : CHIP_TOGGLE_INACTIVE}
      >
        <span aria-hidden="true" className="mr-1">★</span>
        Bobby&#39;s Pick
      </button>
    </div>
  );
}
