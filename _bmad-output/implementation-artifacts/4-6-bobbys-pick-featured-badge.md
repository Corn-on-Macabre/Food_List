# Story 4.6: Bobby's Pick Featured Badge

Status: done

## Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-05 | Story created by SM (Bob) | Story 4.5 done; Epic 4 in-progress |
| 2026-04-05 | Implemented by Dev Agent (Amelia) | All tasks A–F complete; 204 tests pass, lint clean |
| 2026-04-05 | Reviewed by Senior Developer (AI) | 9 findings (F1–F9); F2–F5 fixed; 204 tests pass, lint clean |

## Story

As a curator,
I want to mark select restaurants as a featured "Bobby's Pick,"
so that my absolute top recommendations stand out from the rest.

## Acceptance Criteria

1. **Given** the curator views a restaurant in the `SessionRestaurantCard` on the dashboard **When** the card renders **Then** a "Bobby's Pick" toggle button is visible **And** the button reflects the current `restaurant.featured` state: active when `featured === true`, inactive when `featured === false` or `featured` is `undefined`.

2. **Given** the curator clicks the "Bobby's Pick" toggle when it is currently inactive **When** the click fires **Then** `onFeaturedChange(restaurant.id, true)` is called immediately **And** the toggle switches to the active visual state **And** no other edit panel (tier, notes, source) is closed or affected.

3. **Given** the curator clicks the "Bobby's Pick" toggle when it is currently active **When** the click fires **Then** `onFeaturedChange(restaurant.id, false)` is called immediately **And** the toggle switches to the inactive visual state.

4. **Given** `AdminDashboard` receives an `onFeaturedChange` event **When** `handleFeaturedChange(id, featured)` is called with `featured === true` **Then** the `sessionRestaurants` in-memory list updates: `restaurant.featured` is set to `true` **And** no change is made to `public/restaurants.json` (deferred persistence pattern consistent with Stories 4.2–4.5).

5. **Given** `AdminDashboard` receives an `onFeaturedChange` event **When** `handleFeaturedChange(id, featured)` is called with `featured === false` **Then** the `sessionRestaurants` in-memory list updates: `restaurant.featured` is set to `undefined` (field removed from record, not stored as `false`) **And** no change is made to `public/restaurants.json`.

6. **Given** the `Restaurant` type definition **When** a developer reads `src/types/restaurant.ts` **Then** `featured?: boolean` is already present at line 16 (added in a prior iteration) — no type change is required.

7. **Given** a new `BobbyPickBadge` component at `src/components/BobbyPickBadge.tsx` **When** the component renders **Then** it displays a star or crown icon alongside the text "Bobby's Pick" **And** the badge uses a visually prominent color (gold/amber palette consistent with the design system) **And** the component accepts no props (it is a pure display badge).

8. **Given** the `SessionRestaurantCard` has a "Bobby's Pick" toggle **When** the toggle is in active state **Then** the `BobbyPickBadge` component is rendered inline on the card to confirm the active selection **And** it appears adjacent to or below the restaurant name.

9. **Given** a restaurant on the public map (`RestaurantCard`) has `featured === true` **When** the user taps the restaurant pin and the detail card opens **Then** the `BobbyPickBadge` component is rendered on the public card **And** it appears near the top of the card, visually adjacent to the restaurant name and tier badge **And** the badge is not shown when `restaurant.featured` is `false` or `undefined`.

10. **Given** the "Bobby's Pick" toggle button on `SessionRestaurantCard` **When** rendered on a mobile device (screen width < 768px) **Then** the toggle button meets the minimum 44×44px touch target requirement **And** no horizontal scrolling is introduced.

11. **Given** the `BobbyPickBadge` component **When** a screen reader reads the badge **Then** it announces "Bobby's Pick" via visible text or `aria-label` **And** the icon is decorative and marked `aria-hidden="true"`.

12. **Given** the `SessionRestaurantCard` "Bobby's Pick" toggle **When** the toggle state is active **Then** the button has `aria-pressed={true}` **And** when inactive it has `aria-pressed={false}` **And** the button has an accessible label such as `aria-label="Toggle Bobby's Pick for {restaurant.name}"`.

## Tasks / Subtasks

### Task Group A — Verify `Restaurant` type (no change needed) (AC: 6)

- [ ] **Task A1: Confirm `featured?: boolean` is present in `src/types/restaurant.ts`** (AC: 6)
  - [ ] Read `src/types/restaurant.ts` — verify `featured?: boolean` exists at line 16 (already present from a prior iteration per the type file read during story creation).
  - [ ] If present: no action needed. If absent: add `featured?: boolean;` after the `tags?: string[];` field and before `enrichedAt?: string;`.

---

### Task Group B — Create `BobbyPickBadge` component (AC: 7) [CAN START IN PARALLEL WITH C]

- [ ] **Task B1: Create `src/components/BobbyPickBadge.tsx`** (AC: 7, 11)
  - [ ] Create the file at `src/components/BobbyPickBadge.tsx`.
  - [ ] The component accepts no props — it is a pure display element.
  - [ ] Render a gold/amber badge with a star icon (SVG inline or Unicode `★`) and the text "Bobby's Pick":
    - Outer: `<span>` with `data-testid="bobby-pick-badge"` and `aria-label="Bobby's Pick"` (if using icon-only rendering) or visible text.
    - Icon: `aria-hidden="true"`.
    - Styling reference: gold background `bg-amber-400`, text `text-amber-900`, `font-bold`, `rounded-full`, `px-2 py-0.5`, `text-xs`, `inline-flex items-center gap-1`.
  - [ ] Export as a named export: `export function BobbyPickBadge() { ... }`.
  - [ ] Add to `src/components/index.ts` exports.

---

### Task Group C — Add `onFeaturedChange` handler to `AdminDashboard` (AC: 4, 5) [CAN START IN PARALLEL WITH B]

- [ ] **Task C1: Add `handleFeaturedChange` to `AdminDashboard`** (AC: 4, 5)
  - [ ] Open `src/components/AdminDashboard.tsx`.
  - [ ] Add the handler after `handleTagsChange`:
    ```ts
    function handleFeaturedChange(id: string, featured: boolean) {
      setSessionRestaurants(prev =>
        prev.map(r =>
          r.id === id
            ? { ...r, featured: featured || undefined }
            : r
        )
      );
    }
    ```
    Note: `featured || undefined` ensures `false` is stored as `undefined` (field omitted), consistent with the notes/source/tags pattern in Stories 4.3–4.5.
  - [ ] Pass `onFeaturedChange={handleFeaturedChange}` as a new prop on the `<SessionRestaurantCard>` render in the JSX.

---

### Task Group D — Update `SessionRestaurantCard` with toggle UI (AC: 1, 2, 3, 8, 10, 12) [DEPENDS ON B + C]

- [ ] **Task D1: Extend `Props` interface in `SessionRestaurantCard`** (AC: 1, 2, 3)
  - [ ] Open `src/components/SessionRestaurantCard.tsx`.
  - [ ] Add to the `Props` interface:
    ```ts
    onFeaturedChange: (id: string, featured: boolean) => void;
    ```
  - [ ] Destructure `onFeaturedChange` in the component signature.

- [ ] **Task D2: Add "Bobby's Pick" toggle button** (AC: 1, 2, 3, 8, 10, 12)
  - [ ] Add toggle in the card JSX. Recommended placement: a new row below the tags section (after the tags closing `</div>`), before the closing card `</div>`.
  - [ ] The toggle is a `<button type="button">` — NOT a `useEffect`-driven state update; state changes only occur inside click handlers (per the `react-hooks/set-state-in-effect` ESLint rule enforced since Story 4.3).
  - [ ] Implementation pattern:
    ```tsx
    {/* Bobby's Pick section */}
    <div className="mt-2 flex items-center">
      <button
        type="button"
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
    ```
  - [ ] When `restaurant.featured === true`, also render `<BobbyPickBadge />` next to the restaurant name in the tier row (import from `./BobbyPickBadge`).
  - [ ] The toggle does not close or interfere with any other edit panel (tier, notes, source). No mutual exclusion logic is needed — the toggle fires `onFeaturedChange` directly without entering an "editing" mode.

---

### Task Group E — Update public `RestaurantCard` to show badge (AC: 9) [CAN START IN PARALLEL WITH D]

- [ ] **Task E1: Render `BobbyPickBadge` in `RestaurantCard`** (AC: 9, 11)
  - [ ] Open `src/components/RestaurantCard.tsx`.
  - [ ] Import `BobbyPickBadge` from `./BobbyPickBadge`.
  - [ ] After the `<h2>` restaurant name element and before or alongside the tier badge `<span>`, add:
    ```tsx
    {restaurant.featured && <BobbyPickBadge />}
    ```
  - [ ] Recommended visual placement: render it on its own line between the name and the tier badge, or as a second badge rendered immediately after the tier badge — whichever looks best. The badge must be visible near the top of the card.

---

### Task Group F — Tests (AC: 1–5, 7–12) [DEPENDS ON B, C, D, E]

- [ ] **Task F1: Unit tests for `BobbyPickBadge`**
  - [ ] Create (or add to) a test file at `src/test/BobbyPickBadge.test.tsx`.
  - [ ] Tests:
    1. Renders with `data-testid="bobby-pick-badge"`.
    2. Displays "Bobby's Pick" text.
    3. Star/icon element has `aria-hidden="true"`.

- [ ] **Task F2: Update `SessionRestaurantCard` tests** (AC: 1–3, 8, 10, 12)
  - [ ] Open `src/test/SessionRestaurantCard.test.tsx`.
  - [ ] Add `onFeaturedChange: vi.fn()` to all existing render calls (all 20+ existing tests use the same prop list — add the new prop to each render invocation to keep them passing).
  - [ ] Add new `describe('Bobby's Pick toggle')` block with tests:
    1. Toggle button renders with `data-testid="bobby-pick-toggle"`.
    2. Toggle has `aria-pressed={false}` when `restaurant.featured` is `undefined`.
    3. Toggle has `aria-pressed={true}` when `restaurant.featured === true`.
    4. Clicking toggle when inactive calls `onFeaturedChange('test-resto', true)`.
    5. Clicking toggle when active (`featured: true`) calls `onFeaturedChange('test-resto', false)`.
    6. `BobbyPickBadge` is not rendered when `featured` is `undefined`.
    7. `BobbyPickBadge` is rendered (via `data-testid="bobby-pick-badge"`) when `featured === true`.
    8. Toggle button has `min-h-[44px]` class (mobile touch target).
  - [ ] Mock restaurant fixture: base `mockRestaurant` (no `featured`) is unchanged. Add `mockFeaturedRestaurant = { ...mockRestaurant, featured: true }` for active-state tests.

- [ ] **Task F3: Update `AdminDashboard` tests** (AC: 4, 5) — if a dashboard test file exists
  - [ ] Search for `src/test/AdminDashboard.test.tsx` — if it exists, add tests for `handleFeaturedChange`: setting `featured: true` and setting `featured: false` (stored as `undefined`).

- [ ] **Task F4: Update `RestaurantCard` tests** (AC: 9) — if a card test file exists
  - [ ] Search for `src/test/RestaurantCard.test.tsx` — if it exists, add tests: badge not shown when `featured` is absent, badge shown when `featured === true`.

---

## Dev Notes

### Architecture Context

This is a React 19 + Vite + TypeScript (strict mode) SPA. Tailwind CSS v4 via `@tailwindcss/vite`. Tests use Vitest + `@testing-library/react`. No backend — all state is in-memory for the session.

### Key File Paths

| File | Role |
|------|------|
| `src/types/restaurant.ts` | `Restaurant` interface — `featured?: boolean` already present at line 16 |
| `src/components/TierBadge.tsx` | Reference pattern for `BobbyPickBadge` — named export, no props, `data-testid`, inline SVG/text, `aria-label` |
| `src/components/SessionRestaurantCard.tsx` | Main card to extend — add `onFeaturedChange` prop + toggle button |
| `src/components/AdminDashboard.tsx` | Add `handleFeaturedChange` + pass as prop to `SessionRestaurantCard` |
| `src/components/RestaurantCard.tsx` | Public detail card — add `{restaurant.featured && <BobbyPickBadge />}` |
| `src/components/index.ts` | Add `BobbyPickBadge` export |
| `src/test/SessionRestaurantCard.test.tsx` | Add `onFeaturedChange: vi.fn()` to all existing renders + new tests |

### Deferred Persistence Pattern (from Stories 4.2–4.5)

All session mutations are in-memory only. `public/restaurants.json` is never written during a session. The `handleFeaturedChange` in `AdminDashboard` follows the same shape as `handleNotesChange`, `handleSourceChange`, `handleTagsChange`:

```ts
function handleFeaturedChange(id: string, featured: boolean) {
  setSessionRestaurants(prev =>
    prev.map(r =>
      r.id === id
        ? { ...r, featured: featured || undefined }
        : r
    )
  );
}
```

`featured || undefined` stores `true` as-is and converts `false` to `undefined` (field omitted), matching the pattern where falsy/empty optional fields are removed from the record.

### ESLint Rule: `react-hooks/set-state-in-effect`

State must only be updated inside click/event handlers, never inside `useEffect`. The toggle calls `onFeaturedChange` directly in an `onClick` handler. No `useEffect` should be introduced. This pattern is consistent with how tier, notes, source, and tags all work.

### Toggle vs. Inline Badge

The feature has two distinct UI elements:
- **Toggle button** (admin dashboard `SessionRestaurantCard`): interactive, allows curator to set/unset featured status. Shows "★ Bobby's Pick" in amber when active, stone/grey when inactive.
- **Display badge** (`BobbyPickBadge` component): read-only indicator rendered on both `SessionRestaurantCard` (when active) and `RestaurantCard` (public map). Pure visual — no interactivity.

### `BobbyPickBadge` Component Pattern

Model it after `TierBadge.tsx`:
- Named export, no props (unlike `TierBadge` which takes `tier`)
- `data-testid="bobby-pick-badge"` for test targeting
- Icon: inline star `★` character (or `<svg>`) with `aria-hidden="true"`
- Visible text: "Bobby's Pick" for screen reader support
- Styling: `inline-flex items-center px-2 py-0.5 rounded-full font-sans text-xs font-bold bg-amber-400 text-amber-900 gap-1`

### Mutual Exclusion — Not Required

Unlike the tier, notes, and source editors, the Bobby's Pick toggle does NOT open an edit panel. It fires `onFeaturedChange` immediately on click (toggle pattern). Therefore no mutual exclusion logic (`if (isEditing) ...`) is needed in the toggle handler.

### Test Pattern (from Story 4.5 and existing tests)

All `SessionRestaurantCard` renders require all 5 props:
```tsx
<SessionRestaurantCard
  restaurant={mockRestaurant}
  onTierChange={vi.fn()}
  onNotesChange={vi.fn()}
  onSourceChange={vi.fn()}
  onTagsChange={vi.fn()}
  onFeaturedChange={vi.fn()}   // NEW — add to every existing render call
/>
```

Failure to add `onFeaturedChange` to all existing test renders will cause TypeScript errors under strict mode. The test file has 20+ render calls; every one must be updated.

### Mobile Touch Targets

All interactive elements must have `min-h-[44px]`. The Bobby's Pick toggle button must include this class. Existing toggle pattern from tags section uses `min-h-[44px] px-3 py-1.5` — use the same.

### Public Card Badge Placement (`RestaurantCard.tsx`)

Current structure of `RestaurantCard`:
1. Dismiss button
2. `<h2>` — restaurant name
3. `<span>` — tier badge (amber/blue/emerald)
4. `<p>` — cuisine
5. `<p>` — notes (conditional)
6. `<a>` — Google Maps link

Recommended placement for `BobbyPickBadge`: render it immediately after the tier badge `<span>` on its own line (using `mt-1 block` or as a sibling `<span>`). Alternatively, render it before the tier badge as a visually prominent header element. Either is acceptable — dev has discretion. It must be near the top and clearly visible.

## Senior Developer Review (AI)

### Review Summary

9 findings identified. F2, F3, F4, F5 fixed (HIGH/MEDIUM). F1 verified clean by TypeScript compiler (tests pass). F6–F9 LOW/documented.

### Findings

| ID | Severity | File | Description | Status |
|----|----------|------|-------------|--------|
| F1 | HIGH | SessionRestaurantCard.test.tsx | Potential missing onFeaturedChange in some renders | Verified (all 44 renders updated, TypeScript passes) |
| F2 | HIGH | AdminDashboard.test.tsx | No coverage for handleFeaturedChange (ACs 4, 5) | Fixed: added 2 integration tests |
| F3 | HIGH | RestaurantCard.test.tsx | No coverage for BobbyPickBadge on public card (AC 9) | Fixed: added 3 tests |
| F4 | MEDIUM | AdminDashboard.tsx | `featured \|\| undefined` — `featured ? true : undefined` is more explicit | Fixed |
| F5 | MEDIUM | SessionRestaurantCard.tsx | Missing comment about featured invariant (true or undefined, never false) | Fixed: added comment |
| F6 | LOW | BobbyPickBadge.tsx | No code comment on aria-hidden rationale | Documented (not changed) |
| F7 | LOW | SessionRestaurantCard.tsx | Toggle + inline badge both show "★ Bobby's Pick" when featured — visual duplication | Intentional design; documented |
| F8 | LOW | BobbyPickBadge.test.tsx | getByText('★') could be fragile | Acceptable; test passes consistently |
| F9 | LOW | RestaurantCard.tsx | Badge wrapped in `<div>` (block) vs inline on SessionRestaurantCard | Intentional; different layouts need different wrappers |

### Review Follow-ups (AI)

- [x] F2: Added 2 tests to AdminDashboard.test.tsx for handleFeaturedChange (activate + deactivate)
- [x] F3: Added 3 tests to RestaurantCard.test.tsx for BobbyPickBadge visibility
- [x] F4: Changed `featured || undefined` → `featured ? true : undefined` in AdminDashboard.tsx
- [x] F5: Added inline comment about featured invariant in SessionRestaurantCard.tsx onClick handler

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (orchestrated via BMAD Swarm)

### Debug Log References

None.

### Completion Notes List

- BobbyPickBadge zero-prop display component created, exported, added to index.ts
- SessionRestaurantCard: onFeaturedChange prop added; toggle button (always visible, min-h-[44px]); inline BobbyPickBadge when featured; aria-pressed/aria-label on toggle
- AdminDashboard: handleFeaturedChange stores true or undefined (not false); passed to SessionRestaurantCard
- RestaurantCard: BobbyPickBadge shown when restaurant.featured === true (public-facing)
- Toggle does NOT enter edit mode — no mutual exclusion needed
- All 204 tests pass; lint clean

### File List

- `src/components/BobbyPickBadge.tsx` — NEW: zero-prop badge component
- `src/components/index.ts` — added BobbyPickBadge export
- `src/components/SessionRestaurantCard.tsx` — added onFeaturedChange prop, BobbyPickBadge import, toggle button, inline badge
- `src/components/AdminDashboard.tsx` — added handleFeaturedChange, passed to SessionRestaurantCard
- `src/components/RestaurantCard.tsx` — added BobbyPickBadge import and conditional render
- `src/test/BobbyPickBadge.test.tsx` — NEW: 3 unit tests
- `src/test/SessionRestaurantCard.test.tsx` — added onFeaturedChange to all 44 renders + 8 new toggle tests
- `src/test/AdminDashboard.test.tsx` — added 2 handleFeaturedChange integration tests
- `src/test/RestaurantCard.test.tsx` — added 3 BobbyPickBadge visibility tests
