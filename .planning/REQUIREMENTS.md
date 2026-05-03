# Requirements: Food List — Phoenix Restaurant Map

**Defined:** 2026-04-18
**Core Value:** Users can open one URL and instantly see all curated restaurants on an interactive map, filter to what they want, and navigate to any restaurant — fast, visual, zero friction.

## v1 Requirements

Requirements for this milestone. Each maps to roadmap phases.

### Navigation

- [ ] **NAV-01**: Authenticated user can see a navigation element on the public map view linking to admin
- [ ] **NAV-02**: Authenticated user can see a navigation element on the admin view linking to the map
- [ ] **NAV-03**: Navigation between admin and map uses client-side routing (no page reload, auth preserved)
- [ ] **NAV-04**: Navigation element is hidden for unauthenticated users
- [ ] **NAV-05**: Navigation element works on both mobile and desktop layouts

### Mobile UX

- [ ] **MUX-01**: Filter bar remains pinned to the top of the viewport when scrolling on mobile

## v2 Requirements

Deferred to future milestone. Tracked but not in current roadmap.

### Data Enrichment

- **ENRICH-01**: Restaurant records auto-enriched with Google Places data (ratings, price, photos)
- **ENRICH-02**: Enhanced detail card displays ratings and price level
- **ENRICH-03**: Restaurant photos shown on detail card

### Mobile UX

- **MUX-02**: Pin legend remains pinned to viewport when scrolling on mobile

## Out of Scope

| Feature | Reason |
|---------|--------|
| Sticky pin legend on mobile | Not selected for v1 — can revisit later |
| Desktop layout changes | Only mobile needs the sticky fix |
| Database or backend migration | MVP uses static JSON + Express API |
| User authentication on public map | Single curator, no user accounts |
| Custom domain setup | Deferred until domain purchased |
| CI/CD pipeline | Manual deploy via ./deploy.sh for now |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| NAV-01 | Phase 1 | Pending |
| NAV-02 | Phase 1 | Pending |
| NAV-03 | Phase 1 | Pending |
| NAV-04 | Phase 1 | Pending |
| NAV-05 | Phase 1 | Pending |
| MUX-01 | Phase 2 | Pending |

**Coverage:**
- v1 requirements: 6 total
- Mapped to phases: 6
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-18*
*Last updated: 2026-04-18 — traceability updated after roadmap creation*
