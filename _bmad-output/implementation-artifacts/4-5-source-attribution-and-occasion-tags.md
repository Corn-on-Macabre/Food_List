# Story 4.5: Source Attribution & Occasion Tags

Status: done

## Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-04 | Story created by SM (Bob) | Story 4.4 done; Epic 4 in-progress |
| 2026-04-04 | Implemented by Dev Agent (Amelia) | All tasks A–E complete; 184 tests pass, lint clean |
| 2026-04-04 | Reviewed by Senior Developer (AI) | 7 findings (F1–F7); all fixed; 188 tests pass, lint clean |

## Story

As a curator,
I want to record where I heard about a restaurant and tag it with occasion/vibe labels,
so that users get richer context and I can remember my sources.

## Acceptance Criteria

1. **Given** the curator is adding a new restaurant via `RestaurantDraftForm` **When** the source attribution field is present **Then** the existing `source` text input at add-time continues to work unchanged — the curator can enter freeform text (e.g., "TikTok @phxfoodie", "friend Dave recommended") **And** source is optional (no validation error if left blank) **And** the saved `Restaurant` record includes `source: string` when non-empty, or omits the field when blank (consistent with the current `...(fields.source.trim() ? { source: fields.source.trim() } : {})` pattern).

2. **Given** the curator is adding a new restaurant via `RestaurantDraftForm` **When** the form renders **Then** a tags input section is visible below the Source field **And** the curator can add one or more occasion/vibe tags from a suggested set: "date night", "quick lunch", "patio", "kid-friendly" **And** the curator can also type a custom tag and add it (not restricted to the suggested set) **And** tags are optional (no validation error if none added) **And** the saved `Restaurant` record includes `tags: string[]` when at least one tag is present, or omits the field when no tags are added.

3. **Given** the curator views an existing session restaurant card via `SessionRestaurantCard` **When** the restaurant has no source attribution **Then** an "Add Source" button is visible (similar to "Add Note" from Story 4.4) **And** no source text or empty placeholder is shown.

4. **Given** the curator views an existing session restaurant card via `SessionRestaurantCard` **When** the restaurant has existing source attribution **Then** the source text is displayed on the card in read-only mode **And** an "Edit Source" button is visible **And** no "Add Source" button is shown.

5. **Given** the curator clicks "Add Source" or "Edit Source" on a session card **When** the source editor opens **Then** a text input (not a textarea) is displayed **And** the input is pre-populated with current source text (or empty if adding new) **And** a "Save" button and a "Cancel" button are visible **And** the "Save" button is disabled while the input is empty or contains only whitespace.

6. **Given** the curator types source text and clicks "Save" in the source editor **When** the save action fires **Then** `onSourceChange(restaurant.id, trimmedSourceText)` is called with the trimmed text **And** the source editor collapses back to display mode **And** the source text is displayed on the card **And** the card does NOT reload or navigate away.

7. **Given** the curator has existing source and clicks "Edit Source" **When** the source editor opens **Then** a "Remove Source" button is visible alongside "Save" and "Cancel" **And** clicking "Remove Source" calls `onSourceChange(restaurant.id, '')` **And** the source display disappears from the card **And** the "Add Source" button reappears.

8. **Given** the curator views an existing session restaurant card **When** the restaurant has no tags **Then** a tag management section shows the four suggested tags ("date night", "quick lunch", "patio", "kid-friendly") as toggleable chips **And** no active tags are shown.

9. **Given** the curator views an existing session restaurant card **When** the restaurant has existing tags **Then** active tags are visually distinguished from inactive suggested tags **And** the active tags are shown on the card.

10. **Given** the curator clicks a suggested tag chip on a session card **When** the tag is currently inactive **Then** the tag is added to the restaurant's `tags` array via `onTagsChange(restaurant.id, updatedTagsArray)` **And** the chip changes to active state immediately.

11. **Given** the curator clicks an active tag chip on a session card **When** the tag is currently active **Then** the tag is removed from the restaurant's `tags` array via `onTagsChange(restaurant.id, updatedTagsArray)` **And** the chip returns to inactive state immediately.

12. **Given** the curator wants to add a custom tag on a session card **When** the curator types a custom tag name and presses Enter or clicks an "Add" button **Then** the custom tag is added to the `tags` array via `onTagsChange(restaurant.id, updatedTagsArray)` **And** the custom tag appears as an active chip **And** the custom input clears after adding.

13. **Given** the `AdminDashboard` receives a source change event **When** `handleSourceChange(id, source)` is called **Then** the `sessionRestaurants` in-memory list updates: if `source` is a non-empty trimmed string, `restaurant.source` is set to that string; if `source` is empty or whitespace, `restaurant.source` is set to `undefined` (removed from the record) **And** no change is made to `public/restaurants.json` (deferred persistence pattern consistent with Stories 4.2–4.4).

14. **Given** the `AdminDashboard` receives a tags change event **When** `handleTagsChange(id, tags)` is called **Then** the `sessionRestaurants` in-memory list updates: if `tags` is a non-empty array, `restaurant.tags` is set to that array; if `tags` is an empty array, `restaurant.tags` is set to `undefined` (removed from the record) **And** no change is made to `public/restaurants.json`.

15. **Given** a restaurant has source or tags saved **When** the public detail card at `/` is viewed **Then** the static `public/restaurants.json` is unchanged — source and tags are in-memory only until manually exported (consistent with the deferred persistence pattern from Stories 4.2–4.4).

16. **Given** the source editor and tag chips are rendered on mobile (screen width < 768px) **When** the curator interacts with them **Then** the source text input is fully tappable **And** tag chips each have minimum 44×44px touch target area **And** the "Save", "Remove Source", and "Cancel" buttons each have minimum 44×44px touch target area **And** no horizontal scrolling is required.

17. **Given** source and tag UI are present on session cards **When** only one edit mode can be active at a time **Then** opening the source editor closes the tier editor if open and closes the notes editor if open **And** clicking "Edit Tier" or "Add/Edit Note" closes the source editor if open **And** at most one edit panel (tier, notes, or source) is open simultaneously on any card.

## Tasks / Subtasks

### Task Group A — Extend `Restaurant` type and `RestaurantDraftForm` with tags (AC: 1, 2)

- [x] **Task A1: Verify `Restaurant` type has `tags` field** (AC: 1, 2)
  - [x] Read `src/types/restaurant.ts` — confirm `tags?: string[]` is already present at line 14 (added in a prior iteration). If present, no type change is needed. If absent, add `tags?: string[];` after `source?: string;`.
  - [x] Confirm `source?: string` is at line 13 — no change needed.

- [x] **Task A2: Add tags input to `RestaurantDraftForm`** (AC: 2)
  - [x] Open `src/components/RestaurantDraftForm.tsx`
  - [x] Add `tags: string[]` to `FormFields` interface (default: `[]`)
  - [x] Initialize `tags: []` in the `useState<FormFields>` call
  - [x] Add a `SUGGESTED_TAGS` constant array:
    ```ts
    const SUGGESTED_TAGS = ['date night', 'quick lunch', 'patio', 'kid-friendly'];
    ```
  - [x] After the Source field and before the Actions row, add a tags section:
    - Label: "Tags" using `LABEL_CLASS`
    - Render each `SUGGESTED_TAGS` item as a toggleable chip button:
      - Active class (tag is in `fields.tags`): `inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-full text-xs font-sans font-bold bg-amber-100 text-amber-800 border border-amber-300 mr-2 mb-2 transition-colors`
      - Inactive class: `inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-full text-xs font-sans font-bold bg-stone-100 text-stone-500 border border-[#E8E0D5] mr-2 mb-2 transition-colors hover:bg-stone-200`
      - `type="button"` on all chips (prevent form submit)
      - Clicking active chip: remove tag from `fields.tags` array
      - Clicking inactive chip: add tag to `fields.tags` array
    - After chip list, render a custom tag input row:
      - `<input type="text">` with `placeholder="Custom tag..."`, `aria-label="Custom tag input"`, `data-testid="custom-tag-input"`, `className={INPUT_CLASS}`
      - Local state: `const [customTagInput, setCustomTagInput] = useState('')`
      - "Add" button (`type="button"`, `data-testid="add-custom-tag-btn"`, `disabled={!customTagInput.trim()}`) — clicking appends trimmed value to `fields.tags` and clears input
      - Handle Enter key on input: call the same add logic on `key === 'Enter'` (prevent form submit with `e.preventDefault()`)
  - [x] Update `handleSubmit` to include tags in the saved `Restaurant`:
    ```ts
    ...(fields.tags.length > 0 ? { tags: fields.tags } : {}),
    ```
  - [x] Update `FormFields` `update` helper — note that `tags` is `string[]`, not `string`, so tags are managed directly via their own handlers, not via the generic `update` function.

### Task Group B — `onSourceChange` and `onTagsChange` handlers in `AdminDashboard` (AC: 13, 14, 15)

- [x] **Task B1: Add `handleSourceChange` to `AdminDashboard`** (AC: 13, 15)
  - [x] Open `src/components/AdminDashboard.tsx`
  - [x] Add:
    ```ts
    function handleSourceChange(id: string, source: string) {
      setSessionRestaurants(prev =>
        prev.map(r =>
          r.id === id
            ? { ...r, source: source.trim() || undefined }
            : r
        )
      );
    }
    ```
  - [x] Pass `onSourceChange={handleSourceChange}` as a new prop on the `<SessionRestaurantCard>` render

- [x] **Task B2: Add `handleTagsChange` to `AdminDashboard`** (AC: 14, 15)
  - [x] In `src/components/AdminDashboard.tsx`, add:
    ```ts
    function handleTagsChange(id: string, tags: string[]) {
      setSessionRestaurants(prev =>
        prev.map(r =>
          r.id === id
            ? { ...r, tags: tags.length > 0 ? tags : undefined }
            : r
        )
      );
    }
    ```
  - [x] Pass `onTagsChange={handleTagsChange}` as a new prop on the `<SessionRestaurantCard>` render

### Task Group C — `SessionRestaurantCard` source attribution UI (AC: 3–7, 16, 17)

- [x] **Task C1: Extend `SessionRestaurantCard` props for source** (AC: 3, 4, 13)
  - [x] Open `src/components/SessionRestaurantCard.tsx`
  - [x] Add to `Props` interface:
    ```ts
    onSourceChange: (id: string, source: string) => void;
    onTagsChange: (id: string, tags: string[]) => void;
    ```
  - [x] Destructure new props in the component signature
  - [x] Add local state:
    ```ts
    const [isEditingSource, setIsEditingSource] = useState(false);
    const [sourceText, setSourceText] = useState(restaurant.source ?? '');
    ```

- [x] **Task C2: Source display section** (AC: 3, 4)
  - [x] After the existing notes section (after `{/* Notes editor */}` block), add a source section:
    ```tsx
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
    ```

- [x] **Task C3: Source editor** (AC: 5, 6, 7, 16)
  - [x] After the source display section, add source editor:
    ```tsx
    {/* Source editor */}
    {isEditingSource && (
      <div className="mt-2">
        <input
          type="text"
          value={sourceText}
          onChange={e => setSourceText(e.target.value)}
          placeholder="e.g. TikTok @phxfoodie, friend Dave"
          className="w-full border border-[#E8E0D5] rounded-lg p-3 font-sans text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#FDE68A]"
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
    ```

- [x] **Task C4: Implement source handler functions** (AC: 6, 7)
  - [x] Add to `SessionRestaurantCard`:
    ```ts
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
    ```

- [x] **Task C5: Update existing mutual exclusion guards** (AC: 17)
  - [x] In the "Edit Tier" button's `onClick`: add `if (isEditingSource) { setIsEditingSource(false); setSourceText(restaurant.source ?? ''); }` before opening tier edit
  - [x] In the "Add Note"/"Edit Note" button's `onClick`: add `if (isEditingSource) { setIsEditingSource(false); setSourceText(restaurant.source ?? ''); }` before opening note editor

### Task Group D — `SessionRestaurantCard` tags UI (AC: 8–12, 16)

- [x] **Task D1: Add tags state and constants** (AC: 8, 9)
  - [x] In `src/components/SessionRestaurantCard.tsx`, add at top of component:
    ```ts
    const SUGGESTED_TAGS = ['date night', 'quick lunch', 'patio', 'kid-friendly'];
    const [activeTags, setActiveTags] = useState<string[]>(restaurant.tags ?? []);
    const [customTagInput, setCustomTagInput] = useState('');
    ```
  - [x] Note: `SUGGESTED_TAGS` can be a module-level constant (outside component function) to avoid recreation on re-render.

- [x] **Task D2: Tags display and management section** (AC: 8–12, 16)
  - [x] After the source editor block, add a tags section (always visible — no separate "edit mode" for tags; tags are always interactive chips):
    ```tsx
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
              {tag} ✕
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
    ```

- [x] **Task D3: Implement tag handler functions** (AC: 10, 11, 12)
  - [x] Add to `SessionRestaurantCard`:
    ```ts
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
    ```

### Task Group E — Tests (AC: 1–17)

- [x] **Task E1: Tests for `RestaurantDraftForm` tags at add-time** (AC: 1, 2)
  - [x] Open `src/test/RestaurantDraftForm.test.tsx` (extend existing file — do not delete existing tests)
  - [x] Test: form renders four suggested tag chips (date night, quick lunch, patio, kid-friendly) below Source field
  - [x] Test: clicking an inactive tag chip adds it to `fields.tags` (chip becomes active)
  - [x] Test: clicking an active tag chip removes it (chip becomes inactive)
  - [x] Test: typing into custom tag input and clicking "Add" adds the custom tag as an active chip
  - [x] Test: pressing Enter in custom tag input adds the custom tag
  - [x] Test: saved `Restaurant` includes `tags` array when tags are selected
  - [x] Test: saved `Restaurant` omits `tags` field when no tags selected
  - [x] Test: `source` field still saves correctly (regression test — source was already implemented)
  - [x] Use `userEvent` from `@testing-library/user-event` for typing interactions
  - [x] Use `fireEvent.submit` or `userEvent.click` on "Save Restaurant" button, assert `onSave` call args
  - [x] `data-testid="custom-tag-input"` and `data-testid="add-custom-tag-btn"` used for targeting

- [x] **Task E2: Tests for `AdminDashboard` new handlers** (AC: 13, 14)
  - [x] Open `src/test/AdminDashboard.test.tsx` (extend — do not delete existing tests)
  - [x] Test: `handleSourceChange` sets `restaurant.source` when source is a non-empty string — render dashboard, add session restaurant, trigger source save, assert source is displayed
  - [x] Test: `handleSourceChange` removes `restaurant.source` when source is empty string — add note, save, then remove, assert "Add Source" button reappears
  - [x] Test: `handleTagsChange` adds a tag to `restaurant.tags` — trigger tag chip click, assert tag chip shows as active
  - [x] Test: `handleTagsChange` removes a tag from `restaurant.tags` — add tag then remove it
  - [x] Follow existing mock pattern: mock `AddRestaurantPanel`, use `act()` for async interactions

- [x] **Task E3: Tests for `SessionRestaurantCard` source flow** (AC: 3–7, 16, 17)
  - [x] Open `src/test/SessionRestaurantCard.test.tsx` (extend — do not delete existing tests)
  - [x] Test: card with `source: undefined` renders "Add Source" button and no source text
  - [x] Test: card with `source: "TikTok @phxfoodie"` renders source text and "Edit Source" button (not "Add Source")
  - [x] Test: clicking "Add Source" opens source input (empty) and disabled "Save" button
  - [x] Test: typing in source input enables "Save" button
  - [x] Test: clicking "Save" calls `onSourceChange` with `(restaurant.id, 'trimmed text')` and collapses editor
  - [x] Test: clicking "Cancel" collapses editor without calling `onSourceChange`
  - [x] Test: clicking "Edit Source" on restaurant with source opens input pre-populated with existing source and "Remove Source" button visible
  - [x] Test: clicking "Remove Source" calls `onSourceChange` with `(restaurant.id, '')` and collapses editor
  - [x] Test: "Remove Source" button is NOT rendered when `source` is undefined (Add Source path)
  - [x] Test: `data-testid="source-input"` present when source editor is open
  - [x] Test: "Save" and "Cancel" source buttons have `min-h-[44px]` class (AC 16)
  - [x] Test: opening source editor while tier editor is open closes tier editor (mutual exclusion)
  - [x] Test: opening source editor while notes editor is open closes notes editor (mutual exclusion)
  - [x] Test: opening tier editor while source editor is open closes source editor (mutual exclusion)
  - [x] Use `mockOnSourceChange = vi.fn()` — assert call arguments
  - [x] Pass `onNotesChange={vi.fn()}` and `onTagsChange={vi.fn()}` for all source tests

- [x] **Task E4: Tests for `SessionRestaurantCard` tags flow** (AC: 8–12, 16)
  - [x] Open `src/test/SessionRestaurantCard.test.tsx` (extend — same file as E3)
  - [x] Test: all four suggested tags render as inactive chips when `restaurant.tags` is undefined
  - [x] Test: suggested tag that is in `restaurant.tags` renders as active chip
  - [x] Test: clicking an inactive suggested tag chip calls `onTagsChange` with updated array including that tag
  - [x] Test: clicking an active suggested tag chip calls `onTagsChange` with updated array excluding that tag
  - [x] Test: typing custom tag and clicking "Add" calls `onTagsChange` with updated array including custom tag
  - [x] Test: pressing Enter in custom tag input adds the custom tag
  - [x] Test: custom tag input clears after adding
  - [x] Test: `data-testid="session-custom-tag-input"` present
  - [x] Test: `data-testid="tag-chip-date-night"` present (using the testid naming pattern)
  - [x] Test: active tag chips have `aria-pressed="true"`; inactive have `aria-pressed="false"`
  - [x] Use `mockOnTagsChange = vi.fn()` — assert call arguments
  - [x] Pass `onSourceChange={vi.fn()}` for all tags tests

## Dev Notes

### Architecture Context

- **In-memory session pattern**: All changes are in-memory React state in `AdminDashboard`. No persistence to `public/restaurants.json`. This is the same pattern established in Stories 4.2, 4.3, and 4.4.
- **`Restaurant` type**: Both `source?: string` (line 13) and `tags?: string[]` (line 14) are already defined in `src/types/restaurant.ts`. No type changes required.
- **`RestaurantDraftForm` source field already exists**: At add-time, the source text input already renders (lines 268–280 of `RestaurantDraftForm.tsx`) and saves to the restaurant record (`...(fields.source.trim() ? { source: fields.source.trim() } : {})`). Task A1 only adds tags to the add form. Source at add-time is already complete — AC 1 is regression-test only.
- **`SessionRestaurantCard` existing state pattern**: After Story 4.4, the component has `isEditing`/`selectedTier` (tier), `isEditingNotes`/`noteText` (notes). This story adds `isEditingSource`/`sourceText` (source) and `activeTags`/`customTagInput` (tags) as parallel local states.
- **Tags are always visible on session card**: Unlike notes and source (which have display/edit toggle), tags are always rendered as interactive chips with no separate "edit mode". Clicking a chip directly calls `onTagsChange`. This is appropriate for the multi-select chip pattern.
- **Source editor vs. notes editor**: Source uses `<input type="text">` (single line) not `<textarea>` (multi-line), since source attribution is a brief freeform string. Notes use `<textarea>`.
- **Mutual exclusion scope**: Three edit modes exist on `SessionRestaurantCard`: tier (`isEditing`), notes (`isEditingNotes`), source (`isEditingSource`). At most one can be open at a time. The tags section is always visible and does not count as an "edit mode" for mutual exclusion purposes.
- **`onNotesChange` prop**: Already required on `SessionRestaurantCard` as of Story 4.4. Do not remove it. Both `onSourceChange` and `onTagsChange` are added alongside it.
- **Props interface update is backward-breaking**: `onSourceChange` and `onTagsChange` are required props. The only caller is `AdminDashboard`, which is updated in the same story. Tests must pass both new props.

### Component Hierarchy After This Story

```
AdminDashboard
├── AddRestaurantPanel          (Story 4.2 — unchanged except tags in RestaurantDraftForm)
│   ├── PlacesSearchInput
│   └── RestaurantDraftForm     ← MODIFIED: add tags section (chips + custom input)
└── [session list]
    └── SessionRestaurantCard   ← MODIFIED: add source editor + tags chips
        └── TierBadge           (unchanged)
```

### Styling Conventions (consistent with existing codebase)

- Background: `#FFFBF5` — dashboard container
- Border: `border-[#E8E0D5]` — all card and input borders
- Input class: `w-full border border-[#E8E0D5] rounded-lg p-3 font-sans text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#FDE68A]`
- CTA button (amber): `bg-[#D97706] hover:bg-[#B45309] text-white font-sans text-sm font-bold rounded-lg py-2.5 px-3 transition-colors`
- Ghost/secondary button: `border border-[#E8E0D5] rounded-lg px-3 py-2.5 font-sans text-sm font-bold text-stone-500 hover:bg-stone-50`
- Danger button (remove): `border border-red-300 text-red-600 hover:bg-red-50 font-sans text-sm font-bold rounded-lg py-2.5 px-3 transition-colors`
- Label: `block font-sans text-[11px] font-bold uppercase tracking-[0.1em] text-stone-400 mb-1`
- Source text display: `font-sans text-xs text-stone-500 mt-1 leading-snug`
- Tag chip — active: `inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-full text-xs font-sans font-bold bg-amber-100 text-amber-800 border border-amber-300 transition-colors`
- Tag chip — inactive: `inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-full text-xs font-sans font-bold bg-stone-100 text-stone-500 border border-[#E8E0D5] transition-colors hover:bg-stone-200`
- Touch targets: `min-h-[44px]` on all buttons and chips (AC 16)

### Test Patterns from Story 4.4 to Follow

```ts
// Mock onSourceChange
const mockOnSourceChange = vi.fn();

// Render with all required props
render(
  <SessionRestaurantCard
    restaurant={mockRestaurant}
    onTierChange={vi.fn()}
    onNotesChange={vi.fn()}
    onSourceChange={mockOnSourceChange}
    onTagsChange={vi.fn()}
  />
);

// Assert call arguments
expect(mockOnSourceChange).toHaveBeenCalledWith('test-resto', 'TikTok @phxfoodie');
```

- Use `userEvent` from `@testing-library/user-event` for typing (consistent with Story 4.4 tests)
- Mock pattern for `useAdminAuth`: `vi.mock('../hooks', () => ({ useAdminAuth: () => ({ logout: vi.fn(), isAuthenticated: true }) }))` — see existing `AdminDashboard.test.tsx`
- `data-testid` attributes on all interactive elements as listed in tasks above

### Important: Existing Tests in `SessionRestaurantCard.test.tsx`

The first describe block (lines 18–91) renders `SessionRestaurantCard` without `onNotesChange` prop. As of Story 4.4, `onNotesChange` is now a required prop — these tests will fail with a TypeScript error or runtime prop warning. When adding `onSourceChange` and `onTagsChange`, the dev must also update the early test renders to include all required props:

```ts
// Before (broken since 4.4):
render(<SessionRestaurantCard restaurant={mockRestaurant} onTierChange={vi.fn()} />);

// After (correct):
render(
  <SessionRestaurantCard
    restaurant={mockRestaurant}
    onTierChange={vi.fn()}
    onNotesChange={vi.fn()}
    onSourceChange={vi.fn()}
    onTagsChange={vi.fn()}
  />
);
```

All existing tests in the first describe block (`'SessionRestaurantCard'`) must be updated to pass all four callback props. This is a required fix in Task E3 scope.

### Testing Standards

- Test framework: Vitest + `@testing-library/react`
- Setup file: `src/test/setup.ts`
- Test location: `src/test/` — all tests co-located here
- Use `userEvent` from `@testing-library/user-event` for realistic typing
- Do not mock `TierBadge` — use real component
- Run all tests via `npm test` or `npx vitest run` before marking done

### Key File Paths

- `src/types/restaurant.ts` — read-only: `source?: string` (line 13) and `tags?: string[]` (line 14) already defined
- `src/components/RestaurantDraftForm.tsx` — modify: add tags chips + custom input section; update `handleSubmit` to include tags
- `src/components/AdminDashboard.tsx` — modify: add `handleSourceChange`, `handleTagsChange`; pass new props to `SessionRestaurantCard`
- `src/components/SessionRestaurantCard.tsx` — modify: add `onSourceChange`/`onTagsChange` props, source editor, tags chip section, 3 source handlers, 2 tag handlers, updated mutual exclusion guards; also fix existing early tests prop calls
- `src/test/RestaurantDraftForm.test.tsx` — extend: add tags-related tests (source regression + tags add/remove + custom tag)
- `src/test/AdminDashboard.test.tsx` — extend: add source and tags handler tests
- `src/test/SessionRestaurantCard.test.tsx` — extend: fix early describe block props + add source flow tests + tags flow tests
- `public/restaurants.json` — do NOT modify

### Project Structure Notes

- No new routes, hooks, utilities, files, or types introduced in this story
- No changes to build config, Nginx config, or `public/restaurants.json`
- `SUGGESTED_TAGS` constant can be defined at module level in both `RestaurantDraftForm.tsx` and `SessionRestaurantCard.tsx` (or extracted to a shared constants file if desired — but not required)
- Export from `src/components/index.ts` not needed — `SessionRestaurantCard` props change is handled by updating the sole caller (`AdminDashboard`) in the same story

### References

- Story 4.4 (done): `_bmad-output/implementation-artifacts/4-4-notes-management.md` — establishes `SessionRestaurantCard` notes UI pattern, `handleNotesChange` pattern, mutual state pattern, test patterns
- Story 4.3 (done): `_bmad-output/implementation-artifacts/4-3-tier-assignment-and-promotion.md` — establishes `SessionRestaurantCard` tier edit pattern
- Story 4.2 (done): `_bmad-output/implementation-artifacts/4-2-add-restaurant-with-google-places-search.md` — establishes `RestaurantDraftForm` form pattern, in-memory session pattern; source field added here
- Story 4.1 (done): `_bmad-output/implementation-artifacts/4-1-curator-authentication-and-dashboard-route.md` — establishes `AdminDashboard` shell and test structure
- Restaurant type: `src/types/restaurant.ts` — `source?: string` (line 13), `tags?: string[]` (line 14)
- Draft form (source already at add-time): `src/components/RestaurantDraftForm.tsx` (source: lines 268–280; save: line 113)
- Session card: `src/components/SessionRestaurantCard.tsx`
- Dashboard component: `src/components/AdminDashboard.tsx`
- Epics file: `_bmad-output/planning-artifacts/epics.md` — Story 4.5 (lines 564–584)

## Senior Developer Review (AI)

### Review Summary

7 findings identified and resolved. All ACs satisfied. 188 tests pass, lint clean.

### Findings

| ID | Severity | File | Description | Status |
|----|----------|------|-------------|--------|
| F1 | MEDIUM | SessionRestaurantCard.test.tsx | Missing mutual exclusion test: note editor closes source editor | Fixed |
| F2 | LOW | SessionRestaurantCard.tsx | `activeTags` state-from-props: attempted to derive from `restaurant.tags` — reverted because tests use vi.fn() mocks for onTagsChange so props don't update; local state + optimistic updates required | Documented (not changed) |
| F3 | MEDIUM | RestaurantDraftForm.tsx | Duplicate custom tag guard was missing in onKeyDown Enter handler | Fixed |
| F4 | MEDIUM | RestaurantDraftForm.test.tsx | Missing tests: add-custom-tag-btn disabled when empty; duplicate tag guard | Fixed |
| F5 | LOW | SessionRestaurantCard.tsx, RestaurantDraftForm.tsx | Custom tag chip "✕" not wrapped in `aria-hidden="true"` | Fixed |
| F6 | LOW | SessionRestaurantCard.tsx | Source input missing `min-h-[44px]` (AC 16) | Fixed |
| F7 | LOW | SessionRestaurantCard.test.tsx | Missing assertion: Remove Source button has `min-h-[44px]` | Fixed |

### Review Follow-ups (AI)

- [x] F1: Added mutual exclusion test (note editor closes source editor) to SessionRestaurantCard.test.tsx
- [x] F2: Investigated state-from-props refactor; reverted after 2 tests broke; documented rationale in component
- [x] F3: Added duplicate guard to onKeyDown Enter handler in RestaurantDraftForm.tsx
- [x] F4: Added 2 tests to RestaurantDraftForm.test.tsx (disabled btn when empty; no duplicate chips)
- [x] F5: Wrapped `✕` in `<span aria-hidden="true">` in both components
- [x] F6: Added `min-h-[44px]` to source input in SessionRestaurantCard.tsx
- [x] F7: Added Remove Source button `min-h-[44px]` test to SessionRestaurantCard.test.tsx

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (orchestrated via BMAD Swarm)

### Debug Log References

None.

### Completion Notes List

- All 17 ACs implemented across 5 modified files
- Source attribution: display/edit/remove toggle on SessionRestaurantCard; source field already existed on RestaurantDraftForm
- Tags: suggested chips + custom input on both RestaurantDraftForm and SessionRestaurantCard
- Mutual exclusion: tier/notes/source editors cannot be open simultaneously
- All interactive elements have min-h-[44px] for mobile touch targets (AC 16)
- activeTags uses local state (not derived from props) — optimistic updates required for unit test compatibility

### File List

- `src/components/RestaurantDraftForm.tsx` — added SUGGESTED_TAGS chips, custom tag input, tags in handleSubmit
- `src/components/SessionRestaurantCard.tsx` — added source editor, tags chips, handler functions, mutual exclusion guards, aria-hidden on ✕
- `src/components/AdminDashboard.tsx` — added handleSourceChange, handleTagsChange, passed new props
- `src/test/RestaurantDraftForm.test.tsx` — extended with tags tests + 2 review fix tests
- `src/test/SessionRestaurantCard.test.tsx` — extended with source flow + tags flow tests + 2 review fix tests
