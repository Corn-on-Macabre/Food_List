# Story 4.3: Tier Assignment & Promotion

Status: done

## Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-04 | Story created by SM (Bob) | Story 4.2 done; Epic 4 in-progress |

## Story

As a curator,
I want to assign and change a restaurant's tier directly from the dashboard,
so that I can promote a restaurant from "On My Radar" to "Loved" after I visit it, keeping the map current with my actual experience.

## Acceptance Criteria

1. **Given** the curator is adding a new restaurant via the `RestaurantDraftForm` **When** the add form is displayed **Then** a tier selector `<select>` offers exactly three options: "Loved", "Recommended", "On My Radar" (in that order) **And** the default state is an empty disabled placeholder ("— select tier —") **And** the "Save Restaurant" button is disabled while the tier field is empty **And** a validation error message "Tier is required" is shown if the curator attempts to save without selecting a tier.

2. **Given** the curator selects a tier in the `RestaurantDraftForm` **When** a valid tier value (`"loved"`, `"recommended"`, or `"on_my_radar"`) is selected **Then** the "Save Restaurant" button becomes enabled **And** the selected tier is stored correctly on the `Restaurant` record's `tier` field upon save.

3. **Given** the curator is authenticated and the `AdminDashboard` displays the "Added this session" list **When** the list contains one or more restaurants **Then** each list item displays a visual tier badge — a small colored dot or pill using the tier's canonical color (`loved` = `#F59E0B` gold, `recommended` = `#3B82F6` blue, `on_my_radar` = `#10B981` green) alongside the restaurant name and cuisine.

4. **Given** the curator views an existing restaurant in the "Added this session" list **When** the curator clicks an "Edit Tier" control on a session-added restaurant card **Then** an inline tier selector (or a small dropdown) appears on that card with the three tier options **And** the current tier is pre-selected.

5. **Given** the inline tier editor is displayed for a session-added restaurant **When** the curator selects a different tier and confirms **Then** the restaurant's `tier` field is updated in the in-memory `sessionRestaurants` list immediately **And** the tier badge color on the card updates to match the new tier without a page reload **And** the tier selector collapses back to display mode.

6. **Given** the curator changes a tier on a session-added restaurant **When** the update is applied **Then** no previous tier history is recorded — the `Restaurant` record's `tier` field reflects only the current tier (no `previousTier`, no audit trail for MVP growth phase).

7. **Given** the curator changes a tier to the same tier that is already selected **When** the update is applied **Then** no state change occurs (idempotent) **And** the UI does not flicker or re-render unnecessarily.

8. **Given** the `AdminDashboard` session list has restaurants with a mix of tiers **When** the curator views the list **Then** each restaurant's tier badge is visually distinct from the other two tiers and is consistent with the pin colors on the public map (`TIER_COLORS` constant from `src/constants/tierColors.ts`).

9. **Given** the curator updates a tier on a session-added restaurant **When** the public map at `/` is viewed in the same browser session **Then** the static `public/restaurants.json` is unchanged — tier changes in the dashboard affect only the in-memory session state and do not propagate to the public map until `restaurants.json` is manually updated (consistent with the deferred persistence pattern established in Story 4.2).

10. **Given** the tier selector in both add and edit contexts **When** rendered on mobile (screen width < 768px) **Then** the selector is fully tappable with sufficient touch target area (minimum 44×44px) and does not require horizontal scrolling.

## Tasks / Subtasks

### Task Group A — Tier Badge Display in Session List (AC: 3, 8)

- [x] **Task A1: Add tier color badge to session restaurant list items in `AdminDashboard`** (AC: 3, 8)
  - [x] Import `TIER_COLORS` from `src/constants/tierColors.ts` into `src/components/AdminDashboard.tsx`
  - [x] In the `sessionRestaurants.map()` render, add a colored `<span>` dot (12×12px circle, `rounded-full`, `inline-block`) using `backgroundColor: TIER_COLORS[r.tier]` before the restaurant name
  - [x] Add an accessible `aria-label` or `title` attribute to the dot: `aria-label={`Tier: ${r.tier.replace('_', ' ')}`}`
  - [x] Verify the badge colors match the map pin colors exactly (gold `#F59E0B`, blue `#3B82F6`, green `#10B981`)

### Task Group B — Inline Tier Editing for Session Restaurants (AC: 4, 5, 6, 7, 9)

- [x] **Task B1: Create `TierBadge` component** (AC: 3, 8)
  - [x] Create `src/components/TierBadge.tsx`
  - [x] Props: `tier: Tier` — renders a colored pill/badge using `TIER_COLORS[tier]` with the human-readable label ("Loved" / "Recommended" / "On My Radar")
  - [x] Use inline style `backgroundColor` from `TIER_COLORS` for the badge color; white text on gold/blue/green
  - [x] Include `data-testid="tier-badge"` for test targeting
  - [x] Export from `src/components/index.ts`

- [x] **Task B2: Create `SessionRestaurantCard` component** (AC: 4, 5, 6, 7, 9, 10)
  - [x] Create `src/components/SessionRestaurantCard.tsx`
  - [x] Props: `restaurant: Restaurant`, `onTierChange: (id: string, newTier: Tier) => void`
  - [x] Default display state: shows restaurant name, cuisine, and `<TierBadge tier={restaurant.tier} />` with an "Edit Tier" button (pencil icon or text link, `font-sans text-xs text-stone-400`)
  - [x] Clicking "Edit Tier" toggles to edit state: renders a `<select>` with the three tier options, pre-selected to the current tier; a "✓ Apply" button and an "✕ Cancel" button
  - [x] "✓ Apply": calls `onTierChange(restaurant.id, selectedTier)` then collapses back to display state
  - [x] "✕ Cancel": collapses back to display state without calling `onTierChange`
  - [x] If selected tier is the same as current tier on Apply, calls `onTierChange` idempotently — parent `handleTierChange` should guard against unnecessary state updates
  - [x] Select and buttons have minimum 44px touch target height on mobile (use `min-h-[44px]` or `py-2.5`)
  - [x] Include `data-testid="session-restaurant-card"` on the root element
  - [x] Export from `src/components/index.ts`

- [x] **Task B3: Add `handleTierChange` to `AdminDashboard` and swap list item to `SessionRestaurantCard`** (AC: 5, 6, 7, 9)
  - [x] In `src/components/AdminDashboard.tsx`, add `handleTierChange(id: string, newTier: Tier)` function:
    ```ts
    function handleTierChange(id: string, newTier: Tier) {
      setSessionRestaurants(prev =>
        prev.map(r => r.id === id ? { ...r, tier: newTier } : r)
      );
    }
    ```
  - [x] Replace the current `<li>` render inside `sessionRestaurants.map()` with `<SessionRestaurantCard restaurant={r} onTierChange={handleTierChange} />`
  - [x] Import `SessionRestaurantCard` from `./SessionRestaurantCard` (or from `src/components/index.ts`)
  - [x] Import `Tier` type from `src/types`

### Task Group C — Validation & Add Form Hardening (AC: 1, 2)

- [x] **Task C1: Verify tier validation in `RestaurantDraftForm` matches ACs** (AC: 1, 2)
  - [x] Open `src/components/RestaurantDraftForm.tsx` — confirm `validate()` returns `errs.tier = 'Tier is required'` when `fields.tier === ''`
  - [x] Confirm "Save Restaurant" button `disabled={!isTierSelected}` where `isTierSelected = fields.tier !== ''`
  - [x] Confirm tier `<select>` has the placeholder option `<option value="" disabled>— select tier —</option>` as the first option
  - [x] Confirm `TIER_OPTIONS` order: Loved, Recommended, On My Radar (matches AC: 1)
  - [x] No code changes needed if already correct — document as verified in Dev Notes

### Task Group D — Tests (AC: 1–10)

- [x] **Task D1: Write tests for `TierBadge` component** (AC: 3, 8)
  - [x] Create `src/test/TierBadge.test.tsx`
  - [x] Test: renders correct label text for each tier (`'Loved'`, `'Recommended'`, `'On My Radar'`)
  - [x] Test: applies background color style matching `TIER_COLORS[tier]` for each tier
  - [x] Test: `data-testid="tier-badge"` is present

- [x] **Task D2: Write tests for `SessionRestaurantCard` component** (AC: 4, 5, 6, 7)
  - [x] Create `src/test/SessionRestaurantCard.test.tsx`
  - [x] Test: renders restaurant name, cuisine, and tier badge in default display state
  - [x] Test: clicking "Edit Tier" shows the `<select>` with three options
  - [x] Test: selecting a new tier and clicking "✓ Apply" calls `onTierChange` with correct `(id, newTier)` arguments
  - [x] Test: clicking "✕ Cancel" collapses back to display state without calling `onTierChange`
  - [x] Test: applying the same tier calls `onTierChange` (idempotent — parent guards)
  - [x] Mock no external APIs — component is pure UI with no side effects

- [x] **Task D3: Update `AdminDashboard` tests for tier change flow** (AC: 5, 9)
  - [x] Open `src/test/AdminDashboard.test.tsx`
  - [x] Add test: after a restaurant is added, the session list renders a `SessionRestaurantCard` (not a raw `<li>`)
  - [x] Add test: triggering `handleTierChange` on a session restaurant updates the tier displayed in the list
  - [x] Do not modify existing tests that cover render and sign-out (Story 4.1 coverage)

## Dev Notes

### Architecture Context

- **`AdminDashboard` state pattern**: `sessionRestaurants` is in-memory React state — no persistence to `public/restaurants.json` during a session (deferred). Tier changes update the same in-memory array. This is consistent with the pattern established in Story 4.2.
- **`TIER_COLORS` constant**: `src/constants/tierColors.ts` exports `TIER_COLORS: Record<Tier, string>` with values `{ loved: '#F59E0B', recommended: '#3B82F6', on_my_radar: '#10B981' }`. Import and use this — do NOT hardcode hex colors inline.
- **`Tier` type**: `"loved" | "recommended" | "on_my_radar"` — defined in `src/types/restaurant.ts` and re-exported from `src/types/index.ts`.
- **Tier validation already implemented**: `RestaurantDraftForm.tsx` already includes tier validation (`errs.tier = 'Tier is required'`), disabled Save button (`disabled={!isTierSelected}`), and correct `TIER_OPTIONS` order. Task C1 is a verification task, not an implementation task — if the existing code is correct, no changes are needed.
- **No Google API calls**: This story has zero dependency on the Google Maps/Places API. All changes are pure React state and UI. The dev environment (`npm run dev`) will function without a valid `VITE_GOOGLE_MAPS_API_KEY` for these components if the `APIProvider` is not mounted in the test/render path.

### Component Hierarchy After This Story

```
AdminDashboard
├── AddRestaurantPanel          (Story 4.2 — unchanged)
│   ├── PlacesSearchInput
│   └── RestaurantDraftForm     (tier selector — verify only)
└── [session list]
    └── SessionRestaurantCard   ← NEW
        └── TierBadge           ← NEW
```

### Styling Conventions (from existing codebase)

- Background color: `#FFFBF5` (warm off-white) — dashboard container
- Border: `border-[#E8E0D5]` — all card borders
- Select/input classes: `w-full border border-[#E8E0D5] rounded-lg p-3 font-sans text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#FDE68A]`
- CTA button (amber): `bg-[#D97706] hover:bg-[#B45309] text-white font-sans text-sm font-bold rounded-lg py-2.5 px-4 transition-colors`
- Secondary/ghost button: `border border-[#E8E0D5] rounded-lg px-3 py-1.5 font-sans text-sm font-bold text-stone-500 hover:bg-stone-50`
- Font label: `block font-sans text-[11px] font-bold uppercase tracking-[0.1em] text-stone-400 mb-1`

### Testing Standards

- Test framework: Vitest + `@testing-library/react`
- Setup file: `src/test/setup.ts`
- Test location: `src/test/` (all new tests go here, not co-located — see pattern from Story 4.2)
- Mock pattern for `useAdminAuth`: `vi.mock('../hooks', () => ({ useAdminAuth: () => ({ logout: vi.fn(), isAuthenticated: true }) }))` — see `src/test/AdminDashboard.test.tsx` for reference
- Do not mock `TIER_COLORS` — import and assert actual hex values in badge tests

### Key File Paths

- `src/components/AdminDashboard.tsx` — modify: add `handleTierChange`, swap list item render
- `src/components/TierBadge.tsx` — create new
- `src/components/SessionRestaurantCard.tsx` — create new
- `src/components/index.ts` — export new components
- `src/components/RestaurantDraftForm.tsx` — verify only (no changes expected)
- `src/constants/tierColors.ts` — import `TIER_COLORS` (read-only)
- `src/types/restaurant.ts` — import `Tier`, `Restaurant` (read-only)
- `src/test/TierBadge.test.tsx` — create new
- `src/test/SessionRestaurantCard.test.tsx` — create new
- `src/test/AdminDashboard.test.tsx` — extend with 2 new tests

### Project Structure Notes

- All new components live in `src/components/` and are exported from `src/components/index.ts` — consistent with `AddRestaurantPanel`, `PlacesSearchInput`, `RestaurantDraftForm`.
- All new tests live in `src/test/` — consistent with Story 4.1 and 4.2 test patterns.
- No new routes, hooks, utilities, or types are required for this story.
- No changes to `public/restaurants.json` or any build/deploy config.

### References

- Story 4.2 (done): `_bmad-output/implementation-artifacts/4-2-add-restaurant-with-google-places-search.md` — establishes in-memory session pattern, `RestaurantDraftForm` tier selector implementation
- Story 4.1 (done): `_bmad-output/implementation-artifacts/4-1-curator-authentication-and-dashboard-route.md` — establishes `AdminDashboard` shell, `useAdminAuth` context pattern, test structure
- Tier colors: `src/constants/tierColors.ts`
- Restaurant type: `src/types/restaurant.ts`
- Dashboard component: `src/components/AdminDashboard.tsx`
- Draft form: `src/components/RestaurantDraftForm.tsx`
- Epics file: `_bmad-output/planning-artifacts/epics.md` — Story 4.3 (lines 519–539)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- 2026-04-04: All 8 tasks implemented by claude-sonnet-4-6. `src/constants/tierColors.ts` already existed with correct values — no creation needed. Task C1 verified RestaurantDraftForm already compliant — no code changes. 131 tests pass, lint clean.

### File List

- `src/constants/tierColors.ts` — verified (pre-existing, correct values)
- `src/components/TierBadge.tsx` — created
- `src/components/SessionRestaurantCard.tsx` — created
- `src/components/AdminDashboard.tsx` — modified (added handleTierChange, SessionRestaurantCard, Tier import; removed inline li render)
- `src/components/index.ts` — modified (exported TierBadge, SessionRestaurantCard)
- `src/test/TierBadge.test.tsx` — created
- `src/test/SessionRestaurantCard.test.tsx` — created
- `src/test/AdminDashboard.test.tsx` — modified (added mock for AddRestaurantPanel, 2 new tests)

## Senior Developer Review (AI)

### Review Findings

| # | File | Severity | Finding |
|---|------|----------|---------|
| F1 | `src/components/TierBadge.tsx` | HIGH | Missing `aria-label` on badge span — screenreader users receive no tier information |
| F2 | `src/components/SessionRestaurantCard.tsx` | HIGH | "Edit Tier" button missing `min-h-[44px]` — AC 10 mobile touch target violated |
| F3 | `src/test/SessionRestaurantCard.test.tsx` | MEDIUM | No test for AC 10 (44px touch target) |
| F4 | `src/components/SessionRestaurantCard.tsx` | MEDIUM | `selectedTier` state not synced on prop change — theoretical risk if tier changes while edit open |
| F5 | `src/test/AdminDashboard.test.tsx` | LOW | Import path `../../src/contexts/AdminAuthContext` — fragile double-parent traversal |
| F6 | `src/components/TierBadge.tsx` | LOW | Missing comment about TIER_COLORS visual consistency contract |

### Review Follow-ups (AI)

- [x] F1: Added `aria-label={Tier: ${TIER_LABELS[tier]}}` to TierBadge span
- [x] F2: Added `min-h-[44px] px-2 inline-flex items-center` to "Edit Tier" button
- [x] F3: Added test asserting `min-h-[44px]` class on Edit Tier button
- [x] F4: Added comment documenting safe sync pattern (useEffect would trigger react-hooks/set-state-in-effect lint error; existing click-handler sync is correct for this state machine)
- [x] F5: Fixed import to `../contexts/AdminAuthContext`
- [x] F6: Added inline comment about TIER_COLORS contract at top of TierBadge.tsx
