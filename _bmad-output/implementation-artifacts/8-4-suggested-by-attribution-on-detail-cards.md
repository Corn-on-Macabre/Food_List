# Story 8.4: "Suggested By" Attribution on Detail Cards

Status: ready-for-dev

## Story

As a visitor viewing the map,
I want to see who suggested a community-submitted restaurant,
so that recommendations feel personal and trustworthy.

## Acceptance Criteria

1. **Attribution on detail card** — When a restaurant was added via community submission, the detail card shows "Suggested by [Name]" with the submitter's Google avatar as a small thumbnail, below the cuisine type.

2. **No attribution for curator-added** — Restaurants added directly by Bobby (no `suggested_by` field) show no attribution line.

3. **Data storage** — The `Restaurant` type has optional `suggested_by` (display name) and `suggested_by_avatar` (avatar URL) fields. These are populated when Bobby approves a submission.

4. **Approval populates attribution** — When Bobby approves a submission in the admin dashboard, the submitter's name and avatar are carried through to the restaurant record via the `suggested_by` and `suggested_by_avatar` fields.

5. **Display-only** — Clicking the attribution does nothing (no user profiles for MVP).

6. **Database migration** — The `restaurants` table gets two new nullable columns: `suggested_by` (text) and `suggested_by_avatar` (text).

7. **TypeScript passes** — `npx tsc --noEmit` clean.

8. **Existing tests unaffected** — All previously passing tests continue to pass.

## Tasks / Subtasks

### Group A — Database migration

- [ ] A1. Create SQL migration `supabase/migrations/004_suggested_by.sql` (AC: 6)
  - [ ] A1.1 ALTER TABLE restaurants ADD COLUMN suggested_by text
  - [ ] A1.2 ALTER TABLE restaurants ADD COLUMN suggested_by_avatar text

### Group B — Type update

- [ ] B1. Add fields to Restaurant type (AC: 3)
  - [ ] B1.1 Add `suggested_by?: string` to Restaurant interface in `src/types/restaurant.ts`
  - [ ] B1.2 Add `suggested_by_avatar?: string` to Restaurant interface

### Group C — Approval flow carries attribution

- [ ] C1. Pass submitter info through approval flow (AC: 4)
  - [ ] C1.1 Read `src/components/SubmissionsPanel.tsx` — the approve callback already passes submission data to AdminDashboard
  - [ ] C1.2 Read `src/components/AdminDashboard.tsx` — understand how prefill data flows to AddRestaurantPanel
  - [ ] C1.3 Extend the prefill data to include `suggested_by` (from submission's `user_display_name`) and `suggested_by_avatar` (from the submitter's profile)
  - [ ] C1.4 Read `src/api/submissions.ts` — check if `fetchPendingSubmissions()` returns user avatar; if not, join profiles table or add avatar_url column to submissions
  - [ ] C1.5 Ensure AddRestaurantPanel includes `suggested_by` and `suggested_by_avatar` in the saved restaurant record when prefill contains them

### Group D — Detail card attribution display

- [ ] D1. Add "Suggested by" line to RestaurantCard (AC: 1, 2, 5)
  - [ ] D1.1 After the cuisine line, if `restaurant.suggested_by` exists, render avatar (24px circle) + "Suggested by [Name]"
  - [ ] D1.2 If `suggested_by_avatar` exists, show the avatar image; otherwise show a letter initial fallback
  - [ ] D1.3 Style: subtle, secondary text, not clickable
  - [ ] D1.4 If `suggested_by` is absent, render nothing (curator-added restaurants)

### Group E — Verification

- [ ] E1. TypeScript check (AC: 7)
- [ ] E2. Run existing test suite (AC: 8)

## Dev Notes

### Submission → Restaurant attribution flow
1. User submits a restaurant → `submissions` table stores `user_display_name` and `user_id`
2. Bobby approves → AdminDashboard passes submission data as prefill to AddRestaurantPanel
3. AddRestaurantPanel creates restaurant with `suggested_by` and `suggested_by_avatar` from prefill
4. RestaurantCard displays the attribution

### Getting the submitter's avatar
The `submissions` table has `user_display_name` but may not have the avatar URL. Two approaches:
1. **Preferred**: Add `user_avatar_url` to the submissions table (simple ALTER + update submissions API to include it)
2. **Alternative**: Join with profiles table in fetchPendingSubmissions query

Option 1 is simpler — add a column to submissions and populate it on insert. The `submitRestaurant()` function already has access to the user metadata via `supabase.auth.getUser()`.

### Files to create
- `supabase/migrations/004_suggested_by.sql`

### Files to modify
- `src/types/restaurant.ts` — add suggested_by fields
- `src/components/RestaurantCard.tsx` — add attribution display
- `src/api/submissions.ts` — include avatar in submission data
- `src/components/AdminDashboard.tsx` — pass attribution through approval
- `src/components/AddRestaurantPanel.tsx` — include attribution in saved record

### DO NOT
- Do not make attribution clickable or link to a profile
- Do not change existing restaurant records
- Do not modify map, filter, or pin behavior

### References
- RestaurantCard: [Source: src/components/RestaurantCard.tsx]
- Restaurant type: [Source: src/types/restaurant.ts]
- SubmissionsPanel: [Source: src/components/SubmissionsPanel.tsx]
- AdminDashboard: [Source: src/components/AdminDashboard.tsx]
- Submissions API: [Source: src/api/submissions.ts]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
