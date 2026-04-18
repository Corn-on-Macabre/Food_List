---
phase: 02-sticky-mobile-filters
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/App.tsx
  - src/index.css
autonomous: false
requirements: [MUX-01]
must_haves:
  truths:
    - "On a mobile viewport, the filter bar remains pinned to the top of the visible screen while the user pans the map"
    - "The map content is not obscured by the filter bar — the visible map area begins below the filter bar"
    - "The RestaurantCard (bottom sheet on mobile) does not collide with or get hidden behind the filter bar"
  artifacts:
    - path: "src/App.tsx"
      provides: "Map container with top padding that accounts for fixed filter bar height"
      contains: "pt-"
    - path: "src/index.css"
      provides: "Mobile viewport height fix using dvh for proper iOS/Android viewport behavior"
      contains: "dvh"
  key_links:
    - from: "src/App.tsx (filter bar wrapper)"
      to: "src/App.tsx (map container)"
      via: "padding-top on map container matches filter bar height"
      pattern: "pt-\\[.*\\]"
---

<objective>
Fix the mobile sticky filter bar so it remains pinned to the viewport top and does not obscure the map content beneath it.

Purpose: MUX-01 requires the filter bar to stay visible on mobile without scrolling. The filter bar already has `fixed top-0` positioning, but the map container beneath it has no top offset, causing the map's top portion to render behind the filter bar. Additionally, mobile browsers (especially iOS Safari) have viewport height bugs with `100%` that cause layout overflow.

Output: Modified App.tsx with proper map container padding and updated index.css with dvh-based height for mobile viewport correctness.
</objective>

<execution_context>
@.claude/get-shit-done/workflows/execute-plan.md
@.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@src/App.tsx
@src/components/FilterBar.tsx
@src/components/RestaurantCard.tsx
@src/index.css

<interfaces>
<!-- From src/App.tsx — the key layout structure being modified -->

The AppWithMap component renders this layout:
```
<div style={{ position: 'relative', width: '100%', height: '100%' }}>  <!-- outer container -->
  <div className="fixed top-0 left-0 right-0 z-50 ...">               <!-- filter bar wrapper -->
    <FilterBar ... />
  </div>
  <APIProvider>
    <Map style={{ width: '100%', height: '100%' }} ... />              <!-- fills outer container -->
  </APIProvider>
  <PinLegend />                                                         <!-- fixed bottom-4 left-4 -->
  {selectedRestaurant && <RestaurantCard ... />}                        <!-- fixed bottom-0 on mobile -->
</div>
```

The filter bar height varies by content (search + cuisine chips + tier chips + optional distance chips).
On mobile it is approximately 160-200px tall. A CSS variable approach allows the padding to stay
in sync without hardcoding a pixel value.

From src/index.css:
```css
html, body { height: 100%; overflow: hidden; }
#root { height: 100%; overflow: auto; }
```

The `height: 100%` on html/body/#root is the source of the iOS viewport height bug.
Mobile Safari's 100% includes the URL bar area, causing content to overflow the visual viewport.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add dynamic filter bar height offset and fix mobile viewport</name>
  <files>src/App.tsx, src/index.css</files>
  <action>
Two changes to fix the root cause:

**src/index.css — Fix mobile viewport height:**
- Change `html, body { height: 100%; }` to `html, body { height: 100dvh; }` — this uses the dynamic viewport height unit which accounts for mobile browser chrome (URL bar, toolbar). Falls back gracefully in older browsers.
- Change `#root { height: 100%; }` to `#root { height: 100dvh; }` for consistency.

**src/App.tsx — Add padding-top to push map below filter bar:**
- Add a `useRef` + `useEffect` + `useState` pattern to measure the filter bar wrapper's actual height at runtime and apply it as padding-top on the map container. This avoids hardcoding a pixel value that would break when the filter bar content changes (e.g., distance row appearing/disappearing based on geolocation).

Specific implementation:

1. Import `useRef`, `useCallback` from React (useState/useEffect already imported).
2. Create a ref for the filter bar wrapper div: `const filterBarRef = useRef<HTMLDivElement>(null)`.
3. Create state: `const [filterBarHeight, setFilterBarHeight] = useState(0)`.
4. Use a ResizeObserver in a useEffect to track the filter bar height dynamically:
   ```typescript
   useEffect(() => {
     const el = filterBarRef.current;
     if (!el) return;
     const observer = new ResizeObserver((entries) => {
       for (const entry of entries) {
         setFilterBarHeight(entry.contentBoxSize[0].blockSize);
       }
     });
     observer.observe(el);
     return () => observer.disconnect();
   }, []);
   ```
5. Attach `ref={filterBarRef}` to the filter bar wrapper `<div className="fixed top-0 ...">`.
6. On the outer container div, replace the inline style `style={{ position: 'relative', width: '100%', height: '100%' }}` with:
   ```typescript
   style={{ position: 'relative', width: '100%', height: '100%', paddingTop: `${filterBarHeight}px` }}
   ```
7. The Map's `style={{ width: '100%', height: '100%' }}` will now fill the remaining space after padding, since the outer container uses `height: 100%` of #root which is `100dvh`.

This approach:
- Dynamically measures the actual filter bar height (handles variable content like distance row showing/hiding)
- Uses ResizeObserver so the padding updates when the filter bar resizes (e.g., window resize, orientation change)
- Does NOT use hardcoded pixel values
- Uses dvh to fix the iOS Safari viewport height bug

Do NOT use `position: sticky` — the filter bar needs `position: fixed` because the map is rendered by Google Maps which manages its own scroll/pan internally (sticky would not stick relative to a Google Maps pan gesture).

Do NOT add `touch-action` CSS to the filter bar — this would break chip scrolling.
  </action>
  <verify>
    <automated>cd /Users/rhunnicutt/Food_List && npx tsc --noEmit && npx vitest run --reporter=verbose 2>&1 | tail -30</automated>
  </verify>
  <done>
    - TypeScript compiles with no errors
    - All existing tests pass (no regressions)
    - The filter bar wrapper has a ref attached
    - A ResizeObserver measures filter bar height and stores it in state
    - The map container has paddingTop equal to the measured filter bar height
    - index.css uses 100dvh instead of 100% for html, body, and #root
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Fixed the mobile sticky filter bar: the filter bar remains pinned to the viewport top, and the map content is pushed below it so nothing is hidden. Also fixed the iOS/Android viewport height calculation using dvh units.</what-built>
  <how-to-verify>
    1. Run `npm run dev` to start the dev server
    2. Open the app on a mobile device (or use Chrome DevTools mobile emulation — toggle device toolbar with Ctrl+Shift+M, select iPhone 14 Pro or similar)
    3. Verify: The filter bar (search box + cuisine chips + tier chips) is pinned to the top of the screen
    4. Pan and zoom the map — verify the filter bar stays fixed and does not scroll away
    5. Verify: The map is fully visible below the filter bar — no map content is hidden behind it
    6. Tap a restaurant pin — verify the RestaurantCard bottom sheet appears and does not overlap with the filter bar
    7. If geolocation is available, verify the distance filter row appears and the map container adjusts (no jump or overlap)
    8. Test in landscape orientation — verify the filter bar still sticks and map adjusts
    9. On desktop, verify the layout still looks correct (filter bar at top, map below, no gaps)
  </how-to-verify>
  <resume-signal>Type "approved" if the filter bar stays pinned on mobile and map content is not obscured, or describe any issues</resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

No new trust boundaries introduced — this change is purely presentational CSS/layout.

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-02-01 | D (Denial of Service) | ResizeObserver callback | accept | ResizeObserver fires only on actual size changes; no infinite loop risk. Browser throttles internally. |
</threat_model>

<verification>
1. `npx tsc --noEmit` passes — no type errors
2. `npx vitest run` passes — no regressions
3. Manual mobile verification confirms filter bar stays pinned and map is not obscured
</verification>

<success_criteria>
- MUX-01 satisfied: Filter bar remains pinned to the top of the viewport when scrolling/panning on mobile
- Map content is fully visible below the filter bar (no overlap/obscuring)
- RestaurantCard bottom sheet does not collide with the filter bar
- No regression on desktop layout
- All existing tests pass
</success_criteria>

<output>
After completion, create `.planning/quick/260418-mlp-implement-phase-2-sticky-mobile-filters/260418-mlp-SUMMARY.md`
</output>
