# Story 4.4: Notes Management

Status: done

## Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-04 | Story created by SM (Bob) | Story 4.3 done; Epic 4 in-progress |

## Story

As a curator,
I want to add, edit, and delete personal notes on any restaurant in the dashboard,
so that I can share specific recommendations like "try the bone marrow pho" or "cash only" that appear on the public detail card.

## Acceptance Criteria

1. **Given** the curator views a session-added restaurant in the `SessionRestaurantCard` **When** the restaurant has no notes (i.e., `restaurant.notes` is `undefined` or empty string) **Then** a visible "Add Note" button or link is rendered below the restaurant name/tier row **And** no note text or empty placeholder is shown.

2. **Given** the curator clicks "Add Note" on a restaurant with no notes **When** the note editor opens **Then** a `<textarea>` is displayed (empty, unfocused) with placeholder text "Add a note, e.g. 'try the bone marrow pho'" **And** a "Save Note" button and a "Cancel" button are visible **And** the "Save Note" button is disabled while the textarea is empty or contains only whitespace.

3. **Given** the curator types note text and clicks "Save Note" **When** the save action fires **Then** `onNotesChange(restaurant.id, trimmedNoteText)` is called with the trimmed text **And** the note editor collapses back to display mode **And** the note text is displayed below the tier badge and restaurant name in the card **And** the card does NOT reload or navigate away.

4. **Given** a restaurant has existing notes **When** the curator views the `SessionRestaurantCard` **Then** the note text is displayed in a read-only paragraph below the name/tier row **And** an "Edit Note" button is visible **And** no "Add Note" button is shown (it is replaced by the display + Edit flow).

5. **Given** a restaurant has existing notes and the curator clicks "Edit Note" **When** the note editor opens **Then** the `<textarea>` is pre-populated with the current note text **And** the cursor is placed at the end of the text **And** "Save Note" is enabled (since text is already non-empty) **And** a "Delete Note" button is also visible alongside "Save Note" and "Cancel".

6. **Given** the curator edits the note text and clicks "Save Note" **When** the save action fires **Then** `onNotesChange(restaurant.id, trimmedNewText)` is called with the updated trimmed text **And** the note display updates to the new text **And** the editor collapses to display mode.

7. **Given** the curator clicks "Delete Note" in the edit view **When** the delete action fires **Then** `onNotesChange(restaurant.id, '')` is called with an empty string **And** the note display disappears from the card **And** the "Add Note" button reappears **And** the editor collapses to display mode.

8. **Given** the curator opens the note editor and clicks "Cancel" **When** cancel fires **Then** the editor collapses without calling `onNotesChange` **And** the note state is unchanged (any in-progress edits are discarded).

9. **Given** the `AdminDashboard` receives a notes change event **When** `handleNotesChange(id, notes)` is called **Then** the `sessionRestaurants` in-memory list updates: if `notes` is a non-empty trimmed string, `restaurant.notes` is set to that string; if `notes` is empty or whitespace, `restaurant.notes` is set to `undefined` (removed from the record) **And** no change is made to `public/restaurants.json` (deferred persistence pattern from Stories 4.2–4.3).

10. **Given** a restaurant has notes saved in the session **When** the public map at `/` is viewed in the same browser session **Then** the static `public/restaurants.json` is unchanged — notes are in-memory only until manually exported (consistent with the deferred persistence pattern).

11. **Given** the note editor is rendered on mobile (screen width < 768px) **When** the curator interacts with the textarea and buttons **Then** the textarea is at least 80px tall and fully tappable **And** "Save Note", "Delete Note", and "Cancel" buttons each have minimum 44×44px touch target area **And** no horizontal scrolling is required.

## Tasks / Subtasks

### Task Group A — `onNotesChange` handler in `AdminDashboard` (AC: 9, 10)

- [x] **Task A1: Add `handleNotesChange` to `AdminDashboard`** (AC: 9, 10)
  - [x] In `src/components/AdminDashboard.tsx`, add the following function:
    ```ts
    function handleNotesChange(id: string, notes: string) {
      setSessionRestaurants(prev =>
        prev.map(r =>
          r.id === id
            ? { ...r, notes: notes.trim() || undefined }
            : r
        )
      );
    }
    ```
  - [x] Pass `onNotesChange={handleNotesChange}` as a new prop on the `<SessionRestaurantCard>` render inside the `sessionRestaurants.map()` call
  - [x] Import nothing new — `Restaurant` type already imported; `handleNotesChange` is pure state logic

### Task Group B — `SessionRestaurantCard` notes UI (AC: 1–8, 11)

- [x] **Task B1: Extend `SessionRestaurantCard` props and add notes display state** (AC: 1, 4)
  - [x] In `src/components/SessionRestaurantCard.tsx`, add `onNotesChange: (id: string, notes: string) => void` to the `Props` interface
  - [x] Add local state: `const [isEditingNotes, setIsEditingNotes] = useState(false)`
  - [x] Add local state: `const [noteText, setNoteText] = useState(restaurant.notes ?? '')`
  - [x] In display mode (i.e., `!isEditing && !isEditingNotes`), render notes section below the existing tier/name/cuisine row:
    - If `restaurant.notes` is truthy: render `<p>` with note text (`font-sans text-xs text-stone-600 mt-1 leading-snug`) and an "Edit Note" button
    - If `restaurant.notes` is falsy: render an "Add Note" button only

- [x] **Task B2: Implement "Add Note" / "Edit Note" button rendering** (AC: 1, 4, 5)
  - [x] "Add Note" button: `type="button"`, `font-sans text-xs text-stone-400 hover:text-stone-600 transition-colors`, `min-h-[44px] px-2 inline-flex items-center`, `aria-label={`Add note for ${restaurant.name}`}`
  - [x] "Edit Note" button: same classes, `aria-label={`Edit note for ${restaurant.name}`}`
  - [x] Clicking either: sets `noteText` to current `restaurant.notes ?? ''`, then sets `isEditingNotes(true)`

- [x] **Task B3: Implement note editor view** (AC: 2, 3, 5, 6, 7, 8, 11)
  - [x] When `isEditingNotes` is true, render a note editor section below the existing tier row (the tier row stays visible for context)
  - [x] Render `<textarea>` element:
    - `rows={3}`, `value={noteText}`, `onChange={e => setNoteText(e.target.value)}`
    - `placeholder="Add a note, e.g. 'try the bone marrow pho'"`
    - Class: `w-full border border-[#E8E0D5] rounded-lg p-3 font-sans text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#FDE68A] min-h-[80px]`
    - `autoFocus` — places cursor at end of text on open
    - `aria-label="Restaurant note"`
    - `data-testid="note-textarea"`
  - [x] Render button row with `flex gap-2 mt-2 flex-wrap`:
    - "Save Note" button: `type="button"`, `disabled={!noteText.trim()}`, amber CTA class (`bg-[#D97706] hover:bg-[#B45309] text-white font-sans text-sm font-bold rounded-lg py-2.5 px-3 transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]`), `onClick={handleSaveNote}`, `data-testid="save-note-btn"`
    - "Delete Note" button: only render when `restaurant.notes` is truthy — `type="button"`, class: `border border-red-300 text-red-600 hover:bg-red-50 font-sans text-sm font-bold rounded-lg py-2.5 px-3 transition-colors min-h-[44px]`, `onClick={handleDeleteNote}`, `data-testid="delete-note-btn"`, `aria-label={`Delete note for ${restaurant.name}`}`
    - "Cancel" button: ghost style (`border border-[#E8E0D5] rounded-lg px-3 py-2.5 font-sans text-sm font-bold text-stone-500 hover:bg-stone-50 min-h-[44px]`), `onClick={handleCancelNote}`, `data-testid="cancel-note-btn"`

- [x] **Task B4: Implement `handleSaveNote`, `handleDeleteNote`, `handleCancelNote` functions** (AC: 3, 6, 7, 8)
  - [x] `handleSaveNote`: calls `onNotesChange(restaurant.id, noteText.trim())`, then `setIsEditingNotes(false)`
  - [x] `handleDeleteNote`: calls `onNotesChange(restaurant.id, '')`, then `setNoteText('')`, then `setIsEditingNotes(false)`
  - [x] `handleCancelNote`: calls `setNoteText(restaurant.notes ?? '')` to discard edits, then `setIsEditingNotes(false)`

- [x] **Task B5: Guard against tier edit and notes edit being open simultaneously** (AC: 2, 5)
  - [x] When "Edit Tier" is clicked: if `isEditingNotes` is true, close the notes editor first (`setIsEditingNotes(false)`, `setNoteText(restaurant.notes ?? '')`)
  - [x] When "Add Note" or "Edit Note" is clicked: if `isEditing` (tier edit) is true, cancel tier edit first (`setIsEditing(false)`, `setSelectedTier(restaurant.tier)`)
  - [x] This prevents two edit panels from being open simultaneously on the same card

### Task Group C — Tests (AC: 1–11)

- [x] **Task C1: Extend `AdminDashboard` tests for notes change flow** (AC: 9)
  - [x] Open `src/test/AdminDashboard.test.tsx`
  - [x] Add test: verify `handleNotesChange` sets `restaurant.notes` when notes is a non-empty string — render dashboard, add a session restaurant, trigger tier change to ensure card renders, then mock `onNotesChange` call flow
  - [x] Add test: verify `handleNotesChange` removes `restaurant.notes` (sets to `undefined`) when notes is an empty string
  - [x] Follow existing mock pattern: `vi.mock('../hooks', () => ({ useAdminAuth: () => ({ logout: vi.fn(), isAuthenticated: true }) }))`
  - [x] Mock `AddRestaurantPanel` as in existing `AdminDashboard.test.tsx`

- [x] **Task C2: Write tests for `SessionRestaurantCard` notes flow** (AC: 1–8, 11)
  - [x] Open `src/test/SessionRestaurantCard.test.tsx` (extends existing file — do not delete existing tests)
  - [x] Test: card with `notes: undefined` renders "Add Note" button and no note text
  - [x] Test: card with `notes: "cash only"` renders note text "cash only" and "Edit Note" button (not "Add Note")
  - [x] Test: clicking "Add Note" opens textarea (empty) and "Save Note" button (disabled)
  - [x] Test: typing in textarea enables "Save Note" button
  - [x] Test: clicking "Save Note" calls `onNotesChange` with `(restaurant.id, 'trimmed text')` and collapses editor
  - [x] Test: clicking "Cancel" collapses editor without calling `onNotesChange`
  - [x] Test: clicking "Edit Note" on a restaurant with notes opens textarea pre-populated with existing note and "Delete Note" button visible
  - [x] Test: clicking "Delete Note" calls `onNotesChange` with `(restaurant.id, '')` and collapses editor
  - [x] Test: "Delete Note" button is NOT rendered when `notes` is undefined (Add Note path)
  - [x] Test: `data-testid="note-textarea"` present when editor is open
  - [x] Use `userEvent` from `@testing-library/user-event` for typing interactions (consistent with existing `SessionRestaurantCard.test.tsx` patterns)
  - [x] Mock `onNotesChange` as `vi.fn()` — assert call arguments

## Dev Notes

### Architecture Context

- **In-memory session pattern**: `sessionRestaurants` in `AdminDashboard` is React state only — no persistence to `public/restaurants.json`. The `notes` field on a `Restaurant` record is `notes?: string` (optional). Setting it to `undefined` effectively removes it from the record. This is consistent with the tier-change pattern in Story 4.3.
- **`Restaurant` type**: `notes?: string` is already defined in `src/types/restaurant.ts` (line 10). No type changes needed.
- **`SessionRestaurantCard` existing pattern**: The component already manages two states (`isEditing` for tier, `selectedTier`). Notes adds `isEditingNotes` and `noteText` as parallel local states. The two edit modes (tier, notes) are mutually exclusive — guard in Task B5.
- **`onNotesChange` prop signature**: `(id: string, notes: string) => void` — passing empty string means delete. The parent (`AdminDashboard`) handles the `'' → undefined` coercion to keep `Restaurant` records clean (no `notes: ""` stored).
- **No new hooks, routes, utilities, or types required**: This story is pure React state and UI. No Google API calls. Dev environment works without a valid `VITE_GOOGLE_MAPS_API_KEY` when testing these components in isolation.
- **`autoFocus` on textarea**: Place cursor at the end of pre-populated text. Since `autoFocus` sets focus on mount, and `defaultValue` / `value` initializes the position, typing appends. This is the expected UX.

### Component Hierarchy After This Story

```
AdminDashboard
├── AddRestaurantPanel          (Story 4.2 — unchanged)
│   ├── PlacesSearchInput
│   └── RestaurantDraftForm     (notes textarea already present at add-time)
└── [session list]
    └── SessionRestaurantCard   ← MODIFIED: add onNotesChange prop + notes UI
        └── TierBadge           (unchanged)
```

### Styling Conventions (consistent with existing codebase)

- Background color: `#FFFBF5` (warm off-white) — dashboard container
- Border: `border-[#E8E0D5]` — all card and input borders
- Input/textarea class: `w-full border border-[#E8E0D5] rounded-lg p-3 font-sans text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#FDE68A]`
- CTA button (amber): `bg-[#D97706] hover:bg-[#B45309] text-white font-sans text-sm font-bold rounded-lg py-2.5 px-3 transition-colors`
- Ghost/secondary button: `border border-[#E8E0D5] rounded-lg px-3 py-2.5 font-sans text-sm font-bold text-stone-500 hover:bg-stone-50`
- Danger button (delete): `border border-red-300 text-red-600 hover:bg-red-50 font-sans text-sm font-bold rounded-lg py-2.5 px-3 transition-colors`
- Font label: `block font-sans text-[11px] font-bold uppercase tracking-[0.1em] text-stone-400 mb-1`
- Note text display: `font-sans text-xs text-stone-600 mt-1 leading-snug`
- Touch targets: minimum `min-h-[44px]` on all buttons (AC 11, NFR mobile)

### Notes Field Already in Add Flow

`RestaurantDraftForm.tsx` already renders a `notes` textarea (lines 255–267) and includes `notes` in the saved `Restaurant` record (line 112). Story 4.4 adds the ability to edit notes on existing session records after add — it is a complement to, not a replacement for, the add-time notes field.

### Testing Standards

- Test framework: Vitest + `@testing-library/react`
- Setup file: `src/test/setup.ts`
- Test location: `src/test/` — all tests co-located here, not alongside components
- Use `userEvent` from `@testing-library/user-event` for realistic typing simulation
- Mock pattern for `useAdminAuth`: `vi.mock('../hooks', () => ({ useAdminAuth: () => ({ logout: vi.fn(), isAuthenticated: true }) }))` — see `src/test/AdminDashboard.test.tsx`
- Mock pattern for `AddRestaurantPanel`: see existing `AdminDashboard.test.tsx` — mock it to avoid Google Maps API dependency in dashboard tests
- `onNotesChange` mock: `const mockOnNotesChange = vi.fn()` — pass as prop, assert `.toHaveBeenCalledWith(id, expectedNotes)`
- Do not mock `TIER_COLORS` or `TierBadge` — use real components

### Key File Paths

- `src/components/AdminDashboard.tsx` — modify: add `handleNotesChange`, pass `onNotesChange` to `SessionRestaurantCard`
- `src/components/SessionRestaurantCard.tsx` — modify: add `onNotesChange` prop, notes display, notes editor UI, 3 handler functions, mutual exclusion guard
- `src/test/AdminDashboard.test.tsx` — extend: add 2 new tests for `handleNotesChange`
- `src/test/SessionRestaurantCard.test.tsx` — extend: add ~11 new tests for notes flow
- `src/types/restaurant.ts` — read-only: `notes?: string` already defined (line 10)
- `src/constants/tierColors.ts` — read-only: `TIER_COLORS` unchanged
- `public/restaurants.json` — do NOT modify

### Project Structure Notes

- All modifications are in `src/components/` and `src/test/` — no new files required
- No new routes, hooks, utilities, or types introduced in this story
- No changes to build config, Nginx config, or `public/restaurants.json`
- Export from `src/components/index.ts` not needed — `SessionRestaurantCard` is already exported; props change is backward-compatible once `onNotesChange` is added as required prop and caller (`AdminDashboard`) is updated in the same story

### References

- Story 4.3 (done): `_bmad-output/implementation-artifacts/4-3-tier-assignment-and-promotion.md` — establishes `SessionRestaurantCard` component structure, `handleTierChange` pattern, mutual state pattern
- Story 4.2 (done): `_bmad-output/implementation-artifacts/4-2-add-restaurant-with-google-places-search.md` — establishes `RestaurantDraftForm` notes textarea (add-time), in-memory session pattern
- Story 4.1 (done): `_bmad-output/implementation-artifacts/4-1-curator-authentication-and-dashboard-route.md` — establishes `AdminDashboard` shell, `useAdminAuth` context, test structure
- Restaurant type: `src/types/restaurant.ts` — `notes?: string` field (line 10)
- Dashboard component: `src/components/AdminDashboard.tsx`
- Session card: `src/components/SessionRestaurantCard.tsx`
- Draft form (notes already in add flow): `src/components/RestaurantDraftForm.tsx` (lines 255–267)
- Epics file: `_bmad-output/planning-artifacts/epics.md` — Story 4.4 (lines 541–563)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

- All tasks A1, B1–B5, C1–C2 implemented and verified green.
- Mutual exclusion implemented by keeping Add/Edit Note buttons visible even when tier editor is open (notes display section gated only on `!isEditingNotes`); clicking a note button while tier editor is open closes tier editor before opening note editor.
- `italic` style added to note display `<p>` per design system spec.
- 147/147 tests passing, lint clean.

### File List

- `src/components/AdminDashboard.tsx` — modified: added `handleNotesChange`, passed `onNotesChange` to `SessionRestaurantCard`
- `src/components/SessionRestaurantCard.tsx` — modified: added `onNotesChange` prop, `isEditingNotes`/`noteText` state, notes display section, note editor UI, three handler functions, mutual exclusion guards
- `src/test/AdminDashboard.test.tsx` — extended: 2 new tests for `handleNotesChange` (set notes, remove notes)
- `src/test/SessionRestaurantCard.test.tsx` — extended: 13 new tests across 4 describe blocks covering notes display, add note, edit note, and mutual exclusion flows
