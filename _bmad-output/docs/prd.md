---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
inputDocuments: ['_bmad-output/brainstorming/brainstorming-session-2026-03-17-1730.md']
workflowType: 'prd'
documentCounts:
  briefs: 0
  research: 0
  brainstorming: 1
  projectDocs: 0
classification:
  projectType: web_app
  domain: general
  complexity: low
  projectContext: greenfield
---

# Product Requirements Document - Food List

**Author:** Rhunnicutt
**Date:** 2026-03-17

## Executive Summary

Food List is a map-based web app that turns one person's curated restaurant collection into a shareable, proximity-aware discovery tool for the Phoenix metro area. The curator maintains a vetted list of 150-200 restaurants across three confidence tiers -- personally loved, recommended, and on the radar -- sourced through years of active exploration, social media, and trusted referrals.

The app solves a specific problem: restaurant recommendations without geographic context are useless. A "best tacos in Phoenix" list means nothing when none of the spots are near you. Food List fixes this by placing every curated restaurant on an interactive map, centered on the user's location, filterable by cuisine and distance.

The target audience is the curator's existing network -- friends, coworkers, family -- who already ask for recommendations. The product replaces the text message, the Google Doc, and the shared Google Maps link with a single URL that answers "where should I eat right now?"

### What Makes This Special

Food List is not a review platform, recommendation algorithm, or social network. It is a digital concierge card -- one person's opinionated, finite collection delivered through a map. The constraint is the feature: in a world of infinite restaurant options (Google, Yelp, DoorDash), a deliberately small collection curated by someone you trust eliminates analysis paralysis.

The core insight is that the data already exists and is already valuable -- people already ask the curator for recommendations and trust the answers. The product is a presentation and discovery layer that makes existing curation shareable and spatially relevant.

## Project Classification

- **Type:** Web application (browser-based, single-page, mobile-responsive)
- **Domain:** Consumer lifestyle / food discovery
- **Complexity:** Low -- single curator, no user accounts, no payments, no regulatory concerns
- **Context:** Greenfield -- new build, no existing codebase
- **Tech Learning Goal:** Google Maps JavaScript API, Google Places API, web development fundamentals

## Design Principles

These principles emerged from brainstorming and guide every feature and UX decision:

1. **The Concierge Card Test:** "Would a concierge do this?" If yes, build it. If no, it's scope creep. The app points, it doesn't replace.
2. **Get Out of the Way:** The app succeeds when the user leaves it quickly with a confident decision. Time-on-app is an anti-metric.
3. **Show, Don't Tell:** Pin density on the map proves expertise before a word is read. The visual credibility of a full map is the trust signal.
4. **Radical Transparency:** Be honest about what's firsthand vs. researched, loved vs. on the radar. Honesty strengthens trust.
5. **AI for Curator, Search for Consumer:** AI lives on the backend curator side (research, enrichment, tagging). The consumer side stays fast, simple, and instant -- no AI in the user's path.
6. **The Finite Collection is the Feature:** 150-200 restaurants is a trust signal, not a limitation. A concierge who recommends everywhere recommends nowhere.
7. **Explorer vs. Safe Bet:** The three-tier system naturally serves two user types without building two apps. Conservative eaters stick to gold pins. Adventurous eaters browse green. Same data, different modes.

## Success Criteria

### User Success

- A user finds a restaurant near their location and clicks through to Google Maps within a few interactions -- no tutorial, no onboarding, no friction.
- Users discover restaurants they didn't know about despite living in the area -- the "how have I never heard of this place?" moment.
- Users return to the app the next time they need a restaurant recommendation instead of texting the curator directly.

### Business Success

This is a passion project, not a commercial product. No revenue targets, growth metrics, or conversion funnels.

- At least one person in the curator's network uses the app unprompted for an actual dining decision.
- The curator feels confident handing the link to anyone who asks "where should I eat?"
- The curator personally uses the app as their primary way to browse their own collection.

### Technical Success

- Google Maps JavaScript API renders an interactive, pin-populated map in the browser.
- Google Places API enriches restaurant records with structured data (price, hours, cuisine, photos, ratings).
- The curator gains hands-on understanding of how to pull, cache, and layer external API data onto a custom application.
- The app is deployed to a publicly accessible URL that works on mobile and desktop.

### Measurable Outcomes

- Map loads and displays all curated restaurants in under 3 seconds on a standard connection.
- Filtering by cuisine and distance produces results instantly (client-side, no server round-trip for ~200 records).
- At least one real-world "I used your app" moment from someone in the curator's network.
- The curator can add a new restaurant to the system in under 30 seconds.

## User Journeys

### Journey 1: The Lunch Decision (Consumer - Happy Path)

**Meet Sarah.** She's been on your team at work for about a year. She knows you're the food guy. It's 11:40 AM on a Wednesday, and three coworkers are standing around trying to decide on lunch. Nobody wants to pick. Sarah pulls up the link you dropped in the team Slack channel last month -- she bookmarked it.

The map loads centered on the office. She can immediately see a cluster of colored pins within a few miles. She taps the cuisine filter and picks "Vietnamese." Two pins remain -- one gold, one blue. She taps the gold one. A card pops up: "Pho 43 -- Loved. Try the bone marrow pho." There's a link to Google Maps. She taps it, sees it's 8 minutes away, and says "Pho 43, let's go." The whole interaction took about 30 seconds.

**What this journey reveals:**
- Map must load fast and centered on user location
- Filtering must feel instant (cuisine dropdown, proximity)
- Pin cards need: name, tier, notes, Google Maps link
- The app needs to work well on a phone (this is a standing-in-the-hallway moment)

### Journey 2: The Anniversary Plan (Consumer - Edge Case)

**Meet David.** He's your buddy from college who moved to Scottsdale last year. His anniversary is Saturday and he needs somewhere impressive -- nice dinner, good atmosphere, not a chain. He remembers you have that restaurant site. He opens the link on his laptop Thursday evening to plan ahead.

David doesn't filter by cuisine because he's open to anything. Instead, he zooms into the Scottsdale area and starts browsing the gold pins. He clicks through a few -- one has a note that says "great for a date, ask for the patio." That's exactly what he needed. He clicks through to Google Maps to check hours and photos, then makes a reservation through the restaurant's own site.

But here's the edge case: the area David zooms into only has two pins, and neither feels right. He zooms out a bit, finds a cluster in Old Town, and picks from there. The map made it easy to expand his radius visually without fiddling with a slider.

**What this journey reveals:**
- Manual map exploration (zoom/pan) is as important as the filter controls
- Curator notes with occasion context ("great for a date") are high-value for planning-mode users
- The app hands off to Google Maps and the restaurant's own site -- it doesn't try to handle reservations
- Sparse areas need to feel okay, not broken -- the map naturally invites zooming out

### Journey 3: The New Discovery (Curator - Maintenance)

**Meet Bobby (you).** It's Sunday morning. You're scrolling TikTok and a Phoenix food creator posts about a new ramen spot in Tempe that looks incredible. You want to capture it before you forget.

You open your curator dashboard on your phone. You type "Tanaka Ramen Tempe" into the quick-add field. The app hits Google Places API and pulls back the address, hours, price level, and a photo. A draft card appears. You set the tier to "On My Radar," add a note -- "saw on @phxfoodie, try the spicy miso" -- and tap Save. Fifteen seconds, done. The restaurant is now on the map for anyone who opens the link.

Later that week, you actually go to Tanaka Ramen. It's great. You open the curator dashboard, find the entry, and move it from "On My Radar" to "Loved." You update the note: "spicy miso is unreal, cash only, small parking lot." The map updates immediately.

**What this journey reveals:**
- Curator needs a fast mobile-friendly add flow (the TikTok-to-list pipeline)
- Google Places API auto-enrichment reduces manual data entry
- Tier changes need to be easy (promote from On My Radar to Loved)
- Notes need to be editable after the fact
- The curator is the most frequent user -- their workflow efficiency determines whether the list stays alive

### Journey Requirements Summary

| Capability | Revealed By | Priority |
|---|---|---|
| Map centered on user location (geolocation) | Journey 1, 2 | MVP |
| Color-coded tier pins with legend | Journey 1, 2 | MVP |
| Cuisine and distance filtering | Journey 1 | MVP |
| Pin card: name, tier, notes, Google Maps link | Journey 1, 2 | MVP |
| Mobile-responsive design | Journey 1, 3 | MVP |
| Manual map zoom/pan exploration | Journey 2 | MVP |
| Curator quick-add with Google Places auto-fill | Journey 3 | Growth |
| Tier promotion (change a restaurant's tier) | Journey 3 | Growth |
| Editable notes after initial entry | Journey 3 | Growth |
| Occasion/context in curator notes | Journey 2 | Growth |

## Web App Specific Requirements

### Project-Type Overview

Single-page application (SPA) -- one URL, one screen, no routing. The entire experience is a map with a filter bar and a restaurant detail card that appears on pin click. The user never navigates away from the page until they click through to Google Maps. Served as a static site with no server-side rendering.

### Technical Architecture

- **Application Type:** SPA, static deployment
- **Rendering:** Client-side only. No SSR -- SEO is not a concern and the dataset is small (~200 records).
- **Data Layer:** Static JSON file loaded at page init. No database for MVP.
- **API Integration:** Google Maps JavaScript API (map, pins, geolocation), Google Places API (enrichment in growth phase).
- **Hosting:** Static hosting (Vercel, Netlify, GitHub Pages). No backend server for MVP.

### Browser Support

| Browser | Support Level |
|---|---|
| Chrome (latest 2 versions) | Full support |
| Safari (latest 2 versions) | Full support |
| Firefox (latest 2 versions) | Full support |
| Edge (latest 2 versions) | Full support |
| Older browsers / IE | Not supported |

### Responsive Design

- **Mobile-first design** -- the most common use case is standing somewhere hungry, looking at a phone
- **Desktop equally supported** -- planning-mode users will use a laptop
- Breakpoints: mobile (< 768px), tablet (768-1024px), desktop (> 1024px)
- Map consumes the majority of the viewport on all screen sizes
- Filter bar and restaurant card usable on a 375px-wide screen without horizontal scrolling

### Accessibility

- Standard WCAG 2.1 Level AA best practices
- Keyboard navigation for filter controls
- Alt text on images, proper heading hierarchy
- Sufficient color contrast for pin colors and UI elements

### Implementation Considerations

- **No SEO requirements** -- shared via direct link, not discovered via search
- **No consumer authentication** -- the public-facing map is fully open
- **Curator authentication** -- growth phase dashboard needs basic auth (password-protected route)
- **No real-time sync** -- static data, refresh to see updates
- **Offline:** Not required. The app depends on Google Maps API which requires connectivity.

## Project Scoping & Phased Development

### MVP Strategy

**Approach:** Problem-solving MVP -- deliver the single core value (shareable map of curated restaurants) with zero extras. The app is "done" when you can text someone a link and they can find a restaurant near them.

**Resource Requirements:** Solo developer, working over weekends. No team, no infrastructure, no budget beyond free-tier API usage.

**Timeline:** No deadline. Build incrementally. Ship v0.1 as soon as the map renders with pins.

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**
- Journey 1 (The Lunch Decision): Fully supported
- Journey 2 (The Anniversary Plan): Partially supported -- map browsing and tier indicators work, but occasion-specific notes depend on content at launch

**Must-Have Capabilities:**
- Google Map rendered in browser, centered on user's location via geolocation
- All curated restaurants displayed as color-coded pins (Loved = gold, Recommended = blue, On My Radar = green)
- Pin legend explaining the three tiers
- Click a pin to see a detail card: restaurant name, tier, cuisine type, curator notes (if any), link to Google Maps
- Cuisine type filter (dropdown)
- Distance filter (radius slider or zoom-based)
- Mobile-responsive single-page layout
- Deployed to a public URL
- Restaurant data stored as a static JSON file (manually maintained for MVP)

**Explicitly Out of Scope for MVP:**
- Curator dashboard (edit the JSON file directly)
- Google Places API enrichment
- Multi-platform review aggregation
- Occasion/vibe tags
- Semantic search
- Any backend server or database

### Phase 2: Growth (Post-MVP)

- Google Places API enrichment: price level, hours, photos, ratings auto-populated per restaurant
- Curator dashboard with quick-add flow and auto-enrichment
- Editable notes and tier promotion through the dashboard
- Occasion and vibe tags (date night, patio, kid-friendly)
- "Bobby's Pick" featured badge
- Recently Added indicator
- Source attribution on On My Radar entries
- Semantic search ("Mexican near Old Town under $20")
- Basic curator authentication (password-protected route)

### Phase 3: Vision (Future)

- AI research agent for note drafting, tag suggestions, and restaurant monitoring
- Dynamic occasion-based sub-lists auto-generated from tags
- Seasonal/contextual promotion (patios in spring, ramen in winter)
- Curator mobile quick-capture optimized for the TikTok-to-list intake funnel
- Multi-platform review aggregation (Google + Yelp side by side)

### Risk Mitigation

**Technical Risks:**
- *Google Maps API learning curve* -- Mitigated by starting with simplest integration (static pins on a map). Google's documentation for basic map + markers is well-established.
- *Data migration from Google Maps lists* -- Mitigated by manual export (Google Takeout) or scripted extraction. Worst case, manually entering ~200 restaurants into a JSON file is achievable in a sitting or two.
- *API costs* -- Mitigated by Google's free tier ($200/month credit). At ~200 records and low traffic, costs should be negligible or zero.

**Market Risks:** None. Passion project for a known audience.

**Resource Risks:**
- *Solo developer fatigue* -- Mitigated by ruthlessly small MVP scope. If interest wanes after MVP, the product still works.

## Functional Requirements

### Map Display & Navigation

- **FR1:** Users can view an interactive map of the Phoenix metro area populated with all curated restaurant pins
- **FR2:** Users can have the map auto-center on their current location via browser geolocation
- **FR3:** Users can zoom and pan the map to explore any area manually
- **FR4:** Users can see a pin legend that explains what each pin color/tier represents
- **FR5:** Users can see color-coded pins distinguishing Loved (gold), Recommended (blue), and On My Radar (green) restaurants

### Restaurant Discovery & Filtering

- **FR6:** Users can filter visible restaurants by cuisine type
- **FR7:** Users can filter visible restaurants by distance from their current location or a chosen point
- **FR8:** Users can combine multiple filters simultaneously (cuisine + distance)
- **FR9:** Users can clear all filters to return to the full map view
- **FR10:** Users can see the map update immediately when filters are applied or changed

### Restaurant Information

- **FR11:** Users can click/tap any restaurant pin to view a detail card
- **FR12:** Users can see the restaurant name, tier, and cuisine type on the detail card
- **FR13:** Users can see curator notes on the detail card (when notes exist for that restaurant)
- **FR14:** Users can click through from the detail card to the restaurant's Google Maps page for directions, hours, and further details
- **FR15:** Users can dismiss the detail card to return to map browsing

### Sharing & Access

- **FR16:** Users can access the full app experience via a single shareable URL with no account creation or login required
- **FR17:** Users can use the app on mobile browsers with a fully responsive layout
- **FR18:** Users can use the app on desktop browsers with the same full functionality

### Data Management (Curator -- Growth Phase)

- **FR19:** Curator can add a new restaurant to the collection by searching for it by name and location
- **FR20:** Curator can have new restaurant records auto-populated with data from Google Places API (address, hours, price level, cuisine, photos, ratings)
- **FR21:** Curator can assign a tier (Loved, Recommended, On My Radar) to any restaurant
- **FR22:** Curator can change a restaurant's tier (e.g., promote from On My Radar to Loved)
- **FR23:** Curator can add, edit, and delete personal notes on any restaurant
- **FR24:** Curator can add source attribution to a restaurant ("saw on TikTok," "friend Dave recommended")
- **FR25:** Curator can add occasion/vibe tags to a restaurant (date night, quick lunch, patio, kid-friendly)
- **FR26:** Curator can mark a restaurant as a featured "Bobby's Pick"
- **FR27:** Curator can access the management interface via a password-protected route

### Data Enrichment (Growth Phase)

- **FR28:** The system can enrich restaurant records with structured data from Google Places API (price level, hours, photos, ratings)
- **FR29:** Users can see Google Places rating and price level on the restaurant detail card
- **FR30:** Users can see a restaurant photo on the detail card (sourced from Google Places)

## Non-Functional Requirements

### Performance

- Map with all pins (~200 markers) renders in under 3 seconds on a standard 4G mobile connection
- Cuisine and distance filter interactions produce updated map results in under 100ms (client-side filtering)
- Pin click to detail card display in under 100ms
- Static asset bundle (HTML, CSS, JS, restaurant data JSON) totals under 500KB excluding Google Maps API payload
- No perceptible lag when zooming or panning the map with all pins visible

### Integration

- The app depends on Google Maps JavaScript API for map rendering, pin display, and geolocation -- hard dependency with no offline fallback
- Google Places API (growth phase) is used for data enrichment only; failure to reach Places API must not break the core map experience
- All Google API calls must stay within the free tier ($200/month credit) under expected usage
- Restaurant data is decoupled from Google APIs -- the static JSON file is the source of truth, Google enriches but doesn't own the data

### Security

- No user authentication required for the public-facing map (MVP)
- Curator dashboard (growth phase) protected by a basic authentication mechanism
- Google API keys restricted by HTTP referrer to prevent unauthorized usage
- No personally identifiable user data collected or stored
