# Roadmap: Food List — Phoenix Restaurant Map

## Overview

Two focused improvements to reduce friction in daily curation and mobile browsing. Phase 1 eliminates the manual URL-switching and auth-drop problem for the admin workflow. Phase 2 keeps the filter bar accessible on mobile without requiring a scroll-to-top.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Admin/Map Nav Toggle** - Persistent nav element lets the curator switch between admin and map without losing auth
- [ ] **Phase 2: Sticky Mobile Filters** - Filter bar stays pinned to viewport on mobile so users can filter without scrolling back to the top

## Phase Details

### Phase 1: Admin/Map Nav Toggle
**Goal**: The authenticated curator can navigate between the admin dashboard and the public map in one click, with auth state intact
**Depends on**: Nothing (first phase)
**Requirements**: NAV-01, NAV-02, NAV-03, NAV-04, NAV-05
**Success Criteria** (what must be TRUE):
  1. When logged in, a nav element is visible on the map view with a link to `/admin`
  2. When logged in, a nav element is visible on the admin view with a link to `/`
  3. Clicking either nav link switches views without a full page reload and without dropping the auth session
  4. When not logged in, no nav toggle is visible on the public map
  5. The nav element renders and works correctly on both mobile and desktop screen sizes
**Plans**: TBD
**UI hint**: yes

### Phase 2: Sticky Mobile Filters
**Goal**: Mobile users can change filters from anywhere on the page without scrolling back to the top
**Depends on**: Phase 1
**Requirements**: MUX-01
**Success Criteria** (what must be TRUE):
  1. On a mobile device, the filter bar remains pinned to the top of the viewport while scrolling the map and restaurant list
  2. The sticky filter bar does not overlap or obscure map content or restaurant detail cards on mobile
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Admin/Map Nav Toggle | 0/? | Not started | - |
| 2. Sticky Mobile Filters | 0/? | Not started | - |
