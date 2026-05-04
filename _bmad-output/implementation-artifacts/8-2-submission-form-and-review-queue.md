# Story 8.2: Submission Form & Review Queue

Status: ready-for-dev

## Story

As a signed-in user,
I want to submit a restaurant recommendation via a simple form,
so that Bobby can consider adding it to the map.

## Acceptance Criteria

1. **Suggest button visible** — A "Suggest a Restaurant" button is visible on the public map when the user is signed in. Not visible when anonymous.

2. **Submission form** — Clicking the button opens a form with fields: restaurant name (required), location/address (required), why you recommend it (optional textarea). Clean, modal-style overlay.

3. **Submission saved** — On submit, a record is inserted into the Supabase `submissions` table with status `pending`, user ID, display name, and timestamp. User sees confirmation: "Thanks! Bobby will review your suggestion."

4. **Auth gate** — If a non-signed-in user somehow accesses the form, they are prompted to sign in first.

5. **RLS on submissions** — Users can only see their own submissions. Admin can see all submissions and update status.

6. **Admin review tab** — The admin dashboard has a new "Submissions" tab showing all pending submissions with: restaurant name, location, user note, submitted by, date. Each has "Approve" and "Dismiss" actions.

7. **Approve flow** — Approving a submission opens the existing AddRestaurantPanel pre-filled with the submission data. Bobby assigns tier and adds notes, then saves. The submission status changes to `approved`.

8. **Dismiss flow** — Dismissing a submission changes its status to `dismissed`. No restaurant record is created.

9. **Rate limiting** — A user who has submitted 5 restaurants today is blocked with message: "You've reached today's limit. Try again tomorrow."

10. **TypeScript passes** — `npx tsc --noEmit` clean.

11. **Existing tests unaffected** — All previously passing tests continue to pass.

## Tasks / Subtasks

### Group A — Submissions table

- [ ] A1. Create SQL migration `supabase/migrations/003_submissions.sql` (AC: 3, 5)
  - [ ] A1.1 CREATE TABLE `submissions` (id uuid PK default gen_random_uuid(), user_id uuid references auth.users NOT NULL, user_display_name text, restaurant_name text NOT NULL, location text NOT NULL, user_note text, status text NOT NULL default 'pending' CHECK (status IN ('pending','approved','dismissed')), created_at timestamptz default now())
  - [ ] A1.2 Enable RLS: users SELECT own rows (user_id = auth.uid()), admin SELECT/UPDATE all
  - [ ] A1.3 INSERT policy: authenticated users can insert with user_id = auth.uid()

### Group B — Submissions API

- [ ] B1. Create `src/api/submissions.ts` (AC: 3, 5, 9)
  - [ ] B1.1 `submitRestaurant(data)` — inserts into submissions table, returns the created record
  - [ ] B1.2 `fetchMySubmissionsToday()` — returns count of user's submissions with created_at today (for rate limiting)
  - [ ] B1.3 `fetchPendingSubmissions()` — returns all pending submissions (admin only, ordered by created_at desc)
  - [ ] B1.4 `updateSubmissionStatus(id, status)` — updates submission status to 'approved' or 'dismissed'

### Group C — Submission form UI

- [ ] C1. Create `src/components/SubmissionForm.tsx` (AC: 1, 2, 3, 4, 9)
  - [ ] C1.1 Modal overlay with form fields: restaurant name (input, required), location/address (input, required), why you recommend it (textarea, optional)
  - [ ] C1.2 Submit button calls `submitRestaurant()`, shows loading state
  - [ ] C1.3 On success: show confirmation message "Thanks! Bobby will review your suggestion.", auto-close after 2s
  - [ ] C1.4 Rate limit check on mount: call `fetchMySubmissionsToday()`, if >= 5 show limit message instead of form
  - [ ] C1.5 Close button / click-outside to dismiss modal
  - [ ] C1.6 Tailwind-only styling consistent with existing app aesthetic

- [ ] C2. Create "Suggest a Restaurant" button in the map view (AC: 1, 4)
  - [ ] C2.1 Only visible when `useAuth().isAuthenticated` is true
  - [ ] C2.2 Position: fixed bottom-right area (above legend, not blocking map)
  - [ ] C2.3 Opens SubmissionForm modal on click
  - [ ] C2.4 Style: warm amber button matching app palette

### Group D — Admin submissions tab

- [ ] D1. Create `src/components/SubmissionsPanel.tsx` (AC: 6, 7, 8)
  - [ ] D1.1 Fetch and display pending submissions list using `fetchPendingSubmissions()`
  - [ ] D1.2 Each submission shows: restaurant name, location, user note, submitted by (display name), date
  - [ ] D1.3 "Approve" button: changes status to `approved`, triggers callback to parent with submission data for pre-filling AddRestaurantPanel
  - [ ] D1.4 "Dismiss" button: changes status to `dismissed`, removes from list
  - [ ] D1.5 Empty state: "No pending submissions"
  - [ ] D1.6 Loading and error states

- [ ] D2. Add "Submissions" tab to AdminDashboard (AC: 6, 7)
  - [ ] D2.1 Add third tab button "Submissions (N)" with pending count
  - [ ] D2.2 Wire up SubmissionsPanel as tab content
  - [ ] D2.3 On approve: switch to "add" tab with submission data pre-filled in AddRestaurantPanel
  - [ ] D2.4 AdminDashboard tab type expands from `'add' | 'list'` to `'add' | 'list' | 'submissions'`

### Group E — Integrate submission button into map

- [ ] E1. Add SubmissionForm and trigger button to `AppWithMap` in App.tsx (AC: 1)
  - [ ] E1.1 Import and render `SuggestButton` + `SubmissionForm` modal
  - [ ] E1.2 Manage modal open/close state
  - [ ] E1.3 Only render when auth is loaded and user is authenticated

### Group F — Verification

- [ ] F1. TypeScript check (AC: 10)
- [ ] F2. Run existing test suite (AC: 11)

## Dev Notes

### Submissions table design
The `submissions` table is separate from `restaurants` — submissions are NOT restaurants until Bobby approves them. On approval, Bobby creates a new restaurant via the existing AddRestaurantPanel workflow (manual tier assignment, notes, etc). The submission record just tracks status.

### Rate limiting approach
Client-side rate limiting is sufficient for MVP. The `fetchMySubmissionsToday()` query filters by `user_id = auth.uid()` AND `created_at >= start of today (UTC)`. No server-side enforcement beyond RLS.

### Approve flow detail
When Bobby approves a submission:
1. Submission status → `approved`
2. Dashboard switches to "add" tab
3. AddRestaurantPanel receives pre-fill data: { name: submission.restaurant_name, location: submission.location }
4. Bobby uses the existing Places search or manual entry to create the full restaurant record
5. The submission data is a starting point, NOT auto-created as a restaurant

### AdminDashboard pre-fill pattern
The `AddRestaurantPanel` already accepts restaurant data for editing. Pass the submission data as initial values. The existing `onRestaurantAdded` callback handles the save.

### Existing patterns to follow
- Modal pattern: see how RestaurantCard and detail cards use overlays
- API pattern: follow `src/api/restaurants.ts` structure (Supabase-first, no Express fallback needed for submissions — Supabase-only)
- Auth check: use `useAuth()` from AuthContext for visitor auth
- Admin check: AdminDashboard already uses `useAdminAuth()`

### Files to create
- `supabase/migrations/003_submissions.sql`
- `src/api/submissions.ts`
- `src/components/SubmissionForm.tsx`
- `src/components/SubmissionsPanel.tsx`

### Files to modify
- `src/App.tsx` — add suggest button + submission form modal
- `src/components/AdminDashboard.tsx` — add submissions tab
- `src/components/index.ts` — export new components

### DO NOT
- Do not auto-create a restaurant record on submission approval — Bobby manually creates it
- Do not add an Express API for submissions — Supabase only
- Do not change existing map, filter, or pin behavior
- Do not use `git add -A`

### Parallelization guide
- **Group A + Group B** can run in parallel (SQL migration + API helper)
- **Group C** depends on Group B (uses submissions API)
- **Group D** depends on Group B (uses submissions API)
- **Group E** depends on Group C (renders SubmissionForm)
- **Group F** depends on all

### References
- Supabase client: [Source: src/lib/supabase.ts]
- Auth context: [Source: src/contexts/AuthContext.tsx]
- Admin dashboard: [Source: src/components/AdminDashboard.tsx]
- Restaurants API pattern: [Source: src/api/restaurants.ts]
- AddRestaurantPanel: [Source: src/components/AddRestaurantPanel.tsx]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
