# Food List

A personal restaurant curation tool for the Phoenix metro area, made shareable as a public web app.

## Language

**Curator**:
The single person who maintains the restaurant collection, assigns tiers, and approves submissions. There is exactly one curator.
_Avoid_: Admin (when referring to the domain role), owner, Bobby

**Tier**:
How strongly the curator vouches for a restaurant. Ranges from personal favorites to places worth watching. Tiers are mutable — a restaurant can be promoted or demoted as the curator's experience evolves.
_Avoid_: Rank, rating, level

**Loved**:
The highest tier. The curator has eaten here multiple times and would send anyone without hesitation.
_Avoid_: Favorite, top-tier

**Recommended**:
The middle tier. The curator has eaten here and considers it worthy of consideration.
_Avoid_: Good, solid

**On My Radar**:
The lowest tier. Pre-vetted through trusted sources but the curator has not yet visited.
_Avoid_: Watchlist, untried, bookmarked

**Restaurant**:
Any food or drink establishment the curator considers worth listing. Not limited to sit-down dining — includes food trucks, coffee shops, bakeries, bars with food, etc. The term is deliberately broad.
_Avoid_: Venue, establishment, place, location

**Submission**:
A suggestion from a site visitor recommending a restaurant the curator should check out. A form of social engagement, not a formal review process. When approved, the curator independently creates a restaurant entry — the submission is the nudge, not the draft.
_Avoid_: Request, recommendation (too formal), review

**Enrichment**:
The manual, on-demand process of supplementing a restaurant record with third-party data from Google Places (rating, review count, price level, photo). Decorative, not authoritative — curator-provided fields always take precedence. Run ad hoc when adding new restaurants, not on an automated schedule.
_Avoid_: Sync, import, update (too generic)

**Featured**:
The curator's current highlights — a small subset of restaurants that says "if you only try a few, try these." Independent of tier, though in practice most featured restaurants will be loved. Not currently in use but reserved for future spotlighting.
_Avoid_: Bobby's Pick (too personal for domain language), pinned, starred

**Tag**:
A label describing the occasion or vibe of a restaurant (e.g., "date night", "patio", "kid-friendly"). Drawn from a controlled set managed by the curator — new tags can be created, but freeform input is not allowed. Submitters may suggest tags, but only the curator assigns them. Tags are a filter dimension that changes the user's browsing experience.
_Avoid_: Category (conflicts with cuisine), label (too generic), keyword

**Cuisine**:
The type of food a restaurant is known for (e.g., "Korean", "Vietnamese", "American"). Drawn from a controlled set. Each restaurant has exactly one cuisine. For places that lean one direction but cross boundaries, the curator picks the dominant cuisine. "Fusion" is a valid cuisine for places where the blend itself is the identity.
_Avoid_: Food type, category, genre

**Filter**:
A user-controlled criterion that hides restaurants not matching it. Purely subtractive — does not reorder, sort, or change how matching restaurants are displayed. Multiple filters combine with AND logic (all must match). All filtering is client-side with no server round-trips.
_Avoid_: Search (too narrow — search is one filter dimension), sort, query
