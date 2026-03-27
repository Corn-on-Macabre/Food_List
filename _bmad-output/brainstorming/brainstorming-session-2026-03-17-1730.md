---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: []
session_topic: 'Personal food concierge web app - curated Phoenix restaurant lists'
session_goals: 'Share curated lists publicly, enable proximity/cuisine discovery, learn Google APIs, grow into concierge experience'
selected_approach: 'ai-recommended'
techniques_used: ['Role Playing', 'Cross-Pollination', 'SCAMPER Method']
ideas_generated: [51]
session_active: false
workflow_completed: true
context_file: ''
---

# Brainstorming Session Results

**Facilitator:** Rhunnicutt
**Date:** 2026-03-17

## Session Overview

**Topic:** Personal food concierge web app that surfaces curated, vetted restaurant lists (loved, recommended, want-to-try) for friends, coworkers, and the broader Phoenix metro area.

**Goals:**
- Share curated Google Maps lists in a more accessible, browsable format
- Enable smart discovery: proximity search, cuisine filtering, natural-language questions
- Learn Google APIs (Maps, Places, etc.) hands-on through a real project
- Potentially grow into a concierge-like experience people use regularly

### Context Guidance

- Passion/hobby project with real social proof (friends and coworkers already ask for recs)
- Core value prop: "never gamble on your next meal"
- Existing data lives in Google Maps lists (loved / recommended / want-to-try)
- Phoenix metro area focus

### Session Setup

- User has clear domain expertise and existing data source
- Dual motivation: share knowledge + learn new tech (Google APIs)
- Audience ranges from close friends to potentially broader public

## Technique Selection

**Approach:** AI-Recommended Techniques
**Analysis Context:** Personal food concierge web app with focus on sharing curated lists, enabling discovery, learning Google APIs

**Recommended Techniques:**

- **Role Playing:** Embody different user personas (friend, coworker, newcomer, foodie) to surface real needs from the other side of the counter
- **Cross-Pollination:** Raid adjacent domains (Letterboxd, Untappd, Spotify, hotel concierge workflows) for proven feature patterns
- **SCAMPER Method:** Systematically transform the existing Google Maps list workflow into concrete app features

**AI Rationale:** User has deep domain expertise but needs to externalize implicit knowledge, discover non-obvious features from adjacent spaces, and ground ideas in the existing workflow that already works.

## Technique Execution Results

### Role Playing (Technique 1)

**Personas Explored:** Jamie (new-to-Phoenix coworker) and Alex (local foodie planning a date night)

**Key Breakthroughs:**
- The map-first experience as a trust signal -- pin density proves expertise before the user reads a word
- Three-tier curation pipeline (Loved / Recommended / On My Radar) is not just organization, it's a trust hierarchy
- "On My Radar" is pre-vetted by the curator's network and taste -- nothing is accidental
- Occasion/scenario is the missing search dimension: "date night" vs. "quick Tuesday lunch" vs. "impress the boss"
- AI research agent as a curator's assistant: drafts notes, researches menus, suggests tags. Bobby approves. Bobby's voice stays authentic.

**Ideas Generated:**
1. **Visual Credibility Wall** -- Map loaded with color-coded pins on first load as a trust signal
2. **Conversational Filtering** -- "What are you in the mood for?" progressively filters the map
3. **Progressive Drill-Down** -- Stacked filters (cuisine -> distance -> vibe) with real-time map animation
4. **Curated Pipeline, Not Random** -- Every entry arrived through a deliberate filter; nothing is accidental
5. **Tiered Confidence Indicators** -- Color-coded pins with legend: Loved (gold), Recommended (blue), On My Radar (green)
6. **Explorer vs. Safe Bet** -- Two user types served by the same tier system without building two apps
7. **Concierge Notes** -- Personal tasting notes per restaurant ("try the pad see ew," "ask about the patio")
8. **Analysis Paralysis Antidote** -- "Tens of thousands exist. Here are the 150-200 that matter."
9. **Radical Transparency** -- Being upfront about which tier each restaurant sits in strengthens trust
10. **Feedback Loop (Phase 2)** -- Users signal back "went here, loved it" to help the list evolve
11. **Personal Brand Layer** -- People come because they trust the curator, not the platform
12. **Occasion Tagging** -- "Date night," "quick lunch," "brunch," "business dinner" metadata
13. **Google Places API Enrichment** -- Auto-pull price, hours, cuisine, photos; API handles facts, curator handles feelings
14. **Scenario-Based Search** -- "Friday date night, impressive" as a query; intent over attributes
15. **Schema Design -- The Enrichment Stack** -- Three layers: API base data, curator data, community data
16. **Alex's "What's The Move" Query** -- Multi-dimensional scenario query only possible with enriched data
17. **Agent-Powered Restaurant Research** -- LLM scrapes menus/reviews to pre-populate cards; curator approves
18. **Curator Review Workflow** -- Agent presents draft card; 30 seconds per restaurant instead of 15 minutes
19. **"Bobby's Notes" as Brand Voice** -- Consistent voice whether handwritten or AI-drafted and approved
20. **Living Menu Intelligence** -- Agent periodically re-checks for closures, menu changes, buzz
21. **Confidence Indicators on Notes** -- Subtle distinction between firsthand experience and researched suggestions

### Cross-Pollination (Technique 2)

**Domains Raided:** Letterboxd, Blockbuster tastemakers, hotel concierge cards, Phoenix New Times / editorial food media

**Key Breakthroughs:**
- Tastemaker vs. reviewer distinction: a reviewer rates everything; a tastemaker only surfaces what's worth your time
- The "digital concierge card" emerged as the product's north star metaphor
- Editorial food lists (Phoenix New Times) create great content but deliver it broken -- no map, no proximity filter
- Location-aware relevance is the single biggest advantage over every article, blog, and Google Doc
- The finite collection (150-200 restaurants) is a trust signal, not a limitation

**Ideas Generated:**
22. **Tastemaker Identity** -- Positions curator explicitly as tastemaker, not reviewer. People follow people, not databases.
23. **Dynamic Sub-Lists / Occasion Collections** -- AI-grouped occasion collections from tags; auto-populated as new restaurants are tagged
24. **Taste Profile as Content** -- Collection reveals curator's taste: "Bobby skews Mexican and Thai, loves casual spots"
25. **Personal Food Diary (Phase 2)** -- Persistent users log visits, track journey. "I've tried 12 of Bobby's picks."
26. **Jumping-Off Point Philosophy** -- App is discovery/filtering layer, NOT a replacement for Google Maps
27. **Minimal Friction Share Target** -- Entire product is one shareable URL. No accounts, no downloads, no onboarding.
28. **The Editorial List Problem** -- Food publications create great lists but present them as flat articles. Your app solves the last mile.
29. **Location-Aware Relevance** -- A recommendation without distance context is incomplete. The map fixes this for free.
30. **Two Modes of Hunger** -- "Hungry NOW, what's close" vs. "planning something this weekend." Map serves both.
31. **Article-to-Map Translation** -- You're a one-person Eater Phoenix with a better delivery mechanism.
32. **The Digital Concierge Card** -- North star metaphor. You are the concierge, the app is the card. It points, doesn't replace.
33. **Finite Collection as Trust Signal** -- 150-200 restaurants. A concierge who recommends everywhere recommends nowhere.
34. **"Get Out of the Way" UX** -- App succeeds when user leaves quickly with a confident decision. Time-on-app is an anti-metric.

### SCAMPER Method (Technique 3)

**Letters Explored:** Substitute, Combine, Adapt, Modify, Put to Other Uses, Eliminate, Reverse

**Key Breakthroughs:**
- Substituting Google Maps as the curator's home base unlocks multi-platform review aggregation
- The intake funnel (TikTok -> Google Maps -> list -> note) is spread across three apps; collapsing it is high-value
- AI belongs on curator side, search on consumer side -- clean architectural split
- "The MVP is the Map" -- the irreducible core that everything else builds on
- One-way broadcast (curator -> consumer) is a design decision, not a limitation

**Ideas Generated:**
35. **Substitute Google Maps as Home Base** -- App becomes primary list tool; Google Maps drops to navigation
36. **Multi-Platform Review Aggregation** -- Google + Yelp + others side by side on each card
37. **Three Voices Per Restaurant** -- Crowd (reviews), curator (tier), concierge (notes) -- triangulated trust
38. **The Intake Funnel** -- Compress TikTok/Reddit/article discovery into one streamlined capture flow
39. **Source Attribution** -- Capture where you heard about each place: TikTok, Reddit, friend, article
40. **Quick Capture with Auto-Enrichment** -- Type name, API fills card, add tier + note. 15 seconds.
41. **TikTok-to-List Pipeline** -- Optimize the most common discovery path with minimal taps
42. **Semantic Search Over AI Chat** -- Elasticsearch-style matching; fast, predictable, no LLM needed consumer-side
43. **AI for Curator, Search for Consumer** -- Clean architectural split. AI on backend, consumer side stays instant.
44. **Featured / Starred Highlights** -- "Bobby's Pick" badge on the best of the best within each tier
45. **Recency Signal** -- "Recently Added" badge shows the list is alive and maintained
46. **Seasonal / Contextual Promotion** -- Patios in spring, ramen in winter. Tags + time logic = living relevance.
47. **Extended Audiences** -- Real estate agents, recruiters, visitors. Same data, new contexts, zero extra work.
48. **The MVP is the Map** -- Strip everything away. Map + curated pins + user location = already more useful than any article.
49. **The Build Priority Stack** -- Map -> tiers -> click-through -> filtering -> notes -> everything else
50. **One-Way Broadcast is the Model** -- No accounts, no submissions, no social. Intentional design decision.
51. **Quick Capture is the Real Reverse Feature** -- Curator's productivity is the bottleneck. Fast add deserves investment.

### Creative Facilitation Narrative

The session began with Role Playing, where embodying "Jamie" (a new coworker) immediately surfaced the map-first trust signal and the three-tier curation pipeline. Shifting to "Alex" (a local foodie planning a date) cracked open the occasion/scenario dimension and the AI research assistant concept. Cross-Pollination drew strong parallels from Letterboxd (tastemaker identity), editorial food media (the spatial delivery problem), and hotel concierge cards (finite, opinionated, points-you-there). The "digital concierge card" metaphor emerged organically as the product's north star. SCAMPER grounded everything in the existing workflow, producing the clearest scope boundaries: map is the MVP, AI is for the curator, the consumer experience stays fast and simple.

Throughout the session, the curator demonstrated exceptional product instinct -- repeatedly drawing clear scope boundaries, resisting feature creep, and anchoring decisions in how the product would actually be used. The strongest ideas came when the curator connected personal experience ("I'm already doing this") to user needs ("they always ask me for recommendations").

## Idea Organization and Prioritization

### Thematic Organization

| Theme | Ideas | Description |
|-------|-------|-------------|
| Core Product / The Map | #1, #5, #27, #48, #49 | The irreducible foundation: map, pins, tiers, shareable URL |
| Discovery & Search UX | #2, #3, #14, #30, #42 | How users find the right restaurant: filters, proximity, semantic search |
| Data Architecture & Enrichment | #12, #13, #15, #36, #37 | Schema design, API enrichment, multi-platform reviews |
| AI Curator Toolkit | #17, #18, #19, #20, #23 | Research agent, draft cards, living intelligence |
| Curator Workflow & Capture | #35, #38, #39, #40, #41, #51 | How restaurants get into the system quickly |
| Trust, Brand & Philosophy | #4, #8, #9, #32, #33, #34, #43 | The concierge identity and design principles |
| Content & Personalization | #7, #21, #22, #24, #44, #45 | What makes each pin worth clicking |
| Phase 2 & Future Growth | #10, #25, #46, #47, #50 | Feedback, diary, seasonal, extended audiences |

### Prioritization Results

**User's Stated Priorities:**
1. **Core Product / The Map** -- Low friction, map-driven, the thing the curator themselves would use daily
2. **Location-Driven Discovery** -- "Best tacos" means nothing if they're 45 minutes away
3. **Data Enrichment** -- Google Places API, multi-platform reviews, filterable tags (patio, kid-friendly, date night)
4. **Digital Concierge Card Philosophy** -- Design filter, not a feature. Points, doesn't replace. Gets out of the way.

**Quick Win Opportunities:**
- Export existing Google Maps data and render it on a web-based map with colored pins
- Add browser geolocation to center on user
- Deploy to a single shareable URL

**Breakthrough Concepts for Longer-Term:**
- AI research agent as curator's assistant (scales Bobby's Notes without losing voice)
- Occasion-based search ("date night, impressive, not too loud") powered by enrichment tags
- Multi-platform review aggregation (Google + Yelp + curator opinion as three trust signals)

### Action Planning

**Phase v0.1 -- The Map (Build First)**
- Export Google Maps lists into structured data
- Embed Google Maps JavaScript API on a web page
- Render pins color-coded by tier (Loved / Recommended / On My Radar) with legend
- Click pin -> card with name + tier + notes + link to Google Maps
- Deploy to shareable URL (Vercel, Netlify, or GitHub Pages)
- **Success:** Text link to a friend, they find a restaurant near them, click through to Google Maps

**Phase v0.2 -- Discovery**
- Add browser geolocation to center map on user
- Add cuisine tags to restaurant data
- Build filter bar: cuisine dropdown + distance slider
- Map re-renders on filter change
- **Success:** Filter by cuisine + distance, see only relevant pins nearby

**Phase v0.3 -- Enrichment**
- Hit Google Places API per restaurant: pull price, hours, photos, ratings
- Cache enrichment data to avoid repeated API calls
- Design restaurant card: API data + curator data in one view
- Explore Yelp API for multi-platform review aggregation
- **Success:** Card shows Google rating, price, hours, your notes, your tags -- one view

**Phase v0.4 -- Curator Dashboard**
- Build a quick-add flow: type restaurant name -> API auto-fills -> add tier + notes -> save
- Source attribution field ("saw on TikTok," "friend Dave")
- App becomes the primary list management tool, replacing Google Maps for curation
- **Success:** Adding a new restaurant takes 15 seconds

**Phase v0.5 -- Bobby's Notes & Occasion Tags**
- Add occasion tags (date night, quick lunch, brunch, business dinner)
- Featured/starred "Bobby's Pick" badge
- Recently Added indicator
- AI research agent drafts notes; curator approves
- **Success:** Users can filter by occasion; notes feel personal and specific

**Future Phases:**
- AI living intelligence (monitors closures, menu changes, buzz)
- Dynamic sub-lists auto-generated from tags
- Seasonal/contextual promotion
- Feedback loop from users (if audience grows)

## Session Summary and Insights

**Key Achievements:**
- 51 ideas generated across 3 techniques in a single session
- Clear product identity emerged: "The Digital Concierge Card"
- Concrete 5-phase build roadmap from MVP to full vision
- Clean architectural principle established: AI for curator, search for consumer
- Scope boundaries firmly drawn: passion project, one-way broadcast, no social features, map is the product

**Core Product Truths Discovered:**
- "I'm taking tens of thousands of restaurants and distilling them into 150-200 to eliminate analysis paralysis" -- the value proposition in one sentence
- The map is the product. Everything else is layered on top.
- A restaurant recommendation without distance context is incomplete -- geography is built into the interface, not an afterthought
- The finite collection is a trust signal, not a limitation
- The app succeeds when the user leaves it quickly with a confident decision

**Design Principles Established:**
1. **The Concierge Card Test:** "Would a concierge do this?" If yes, build it. If no, it's scope creep.
2. **Show, Don't Tell:** Pin density on the map proves expertise before a word is read.
3. **Get Out of the Way:** Time-on-app is an anti-metric. Fast decisions = success.
4. **Radical Transparency:** Be honest about what's firsthand vs. researched, loved vs. on the radar.
5. **AI Behind the Counter:** The consumer never waits for AI. The AI did its work before they showed up.
