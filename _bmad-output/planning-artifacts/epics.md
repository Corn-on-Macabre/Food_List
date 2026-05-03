---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
inputDocuments: ['_bmad-output/docs/prd.md', '_bmad-output/docs/architecture.md']
---

# Food_List - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Food_List, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

**Map Display & Navigation**

FR1: Users can view an interactive map of the Phoenix metro area populated with all curated restaurant pins
FR2: Users can have the map auto-center on their current location via browser geolocation
FR3: Users can zoom and pan the map to explore any area manually
FR4: Users can see a pin legend that explains what each pin color/tier represents
FR5: Users can see color-coded pins distinguishing Loved (gold), Recommended (blue), and On My Radar (green) restaurants

**Restaurant Discovery & Filtering**

FR6: Users can filter visible restaurants by cuisine type
FR7: Users can filter visible restaurants by distance from their current location or a chosen point
FR8: Users can combine multiple filters simultaneously (cuisine + distance)
FR9: Users can clear all filters to return to the full map view
FR10: Users can see the map update immediately when filters are applied or changed

**Restaurant Information**

FR11: Users can click/tap any restaurant pin to view a detail card
FR12: Users can see the restaurant name, tier, and cuisine type on the detail card
FR13: Users can see curator notes on the detail card (when notes exist for that restaurant)
FR14: Users can click through from the detail card to the restaurant's Google Maps page for directions, hours, and further details
FR15: Users can dismiss the detail card to return to map browsing

**Sharing & Access**

FR16: Users can access the full app experience via a single shareable URL with no account creation or login required
FR17: Users can use the app on mobile browsers with a fully responsive layout
FR18: Users can use the app on desktop browsers with the same full functionality

**Data Management (Curator -- Growth Phase)**

FR19: Curator can add a new restaurant to the collection by searching for it by name and location
FR20: Curator can have new restaurant records auto-populated with data from Google Places API (address, hours, price level, cuisine, photos, ratings)
FR21: Curator can assign a tier (Loved, Recommended, On My Radar) to any restaurant
FR22: Curator can change a restaurant's tier (e.g., promote from On My Radar to Loved)
FR23: Curator can add, edit, and delete personal notes on any restaurant
FR24: Curator can add source attribution to a restaurant ("saw on TikTok," "friend Dave recommended")
FR25: Curator can add occasion/vibe tags to a restaurant (date night, quick lunch, patio, kid-friendly)
FR26: Curator can mark a restaurant as a featured "Bobby's Pick"
FR27: Curator can access the management interface via a password-protected route

**Data Enrichment (Growth Phase)**

FR28: The system can enrich restaurant records with structured data from Google Places API (price level, hours, photos, ratings)
FR29: Users can see Google Places rating and price level on the restaurant detail card
FR30: Users can see a restaurant photo on the detail card (sourced from Google Places)

### NonFunctional Requirements

**Performance**

NFR1: Map with all pins (~200 markers) renders in under 3 seconds on a standard 4G mobile connection
NFR2: Cuisine and distance filter interactions produce updated map results in under 100ms (client-side filtering)
NFR3: Pin click to detail card display in under 100ms
NFR4: Static asset bundle (HTML, CSS, JS, restaurant data JSON) totals under 500KB excluding Google Maps API payload
NFR5: No perceptible lag when zooming or panning the map with all pins visible

**Integration**

NFR6: The app depends on Google Maps JavaScript API for map rendering, pin display, and geolocation -- hard dependency with no offline fallback
NFR7: Google Places API (growth phase) is used for data enrichment only; failure to reach Places API must not break the core map experience
NFR8: All Google API calls must stay within the free tier ($200/month credit) under expected usage
NFR9: Restaurant data is decoupled from Google APIs -- the static JSON file is the source of truth, Google enriches but doesn't own the data

**Security**

NFR10: No user authentication required for the public-facing map (MVP)
NFR11: Curator dashboard (growth phase) protected by a basic authentication mechanism
NFR12: Google API keys restricted by HTTP referrer to prevent unauthorized usage
NFR13: No personally identifiable user data collected or stored

### Additional Requirements

- Greenfield React + Vite + TypeScript project scaffold required
- Tailwind CSS for styling with mobile-first responsive breakpoints
- `@vis.gl/react-google-maps` for Google Maps integration
- Static `restaurants.json` loaded via fetch (~200 records, <50KB)
- TypeScript interfaces: `Restaurant`, `Tier`, `FilterState`
- `useRestaurants` custom hook for client-side filtering
- `useGeolocation` custom hook for browser location
- Haversine distance calculation utility (`distance.ts`)
- Deployment: Nginx on VPS via `rsync` of `dist/` build output
- Environment variable `VITE_GOOGLE_MAPS_API_KEY` via Vite `.env`
- Map default center: Phoenix metro (33.4484, -112.0740), zoom level 11

### UX Design Requirements

No UX Design document exists. UX requirements will be addressed during implementation using the frontend-design skill.

### FR Coverage Map

| FR | Epic | Description |
|---|---|---|
| FR1 | Epic 1 | Interactive map with restaurant pins |
| FR2 | Epic 1 | Auto-center on user location |
| FR3 | Epic 1 | Zoom and pan exploration |
| FR4 | Epic 1 | Pin legend for tier colors |
| FR5 | Epic 1 | Color-coded tier pins |
| FR6 | Epic 3 | Cuisine type filter |
| FR7 | Epic 3 | Distance filter |
| FR8 | Epic 3 | Combined filters |
| FR9 | Epic 3 | Clear all filters |
| FR10 | Epic 3 | Instant map update on filter change |
| FR11 | Epic 2 | Click pin to view detail card |
| FR12 | Epic 2 | Name, tier, cuisine on card |
| FR13 | Epic 2 | Curator notes on card |
| FR14 | Epic 2 | Google Maps link on card |
| FR15 | Epic 2 | Dismiss detail card |
| FR16 | Epic 1 | Single shareable URL, no login |
| FR17 | Epic 1 | Mobile responsive |
| FR18 | Epic 1 | Desktop responsive |
| FR19 | Epic 4 | Add restaurant by search |
| FR20 | Epic 4 | Google Places auto-populate |
| FR21 | Epic 4 | Assign tier |
| FR22 | Epic 4 | Change tier |
| FR23 | Epic 4 | Add/edit/delete notes |
| FR24 | Epic 4 | Source attribution |
| FR25 | Epic 4 | Occasion/vibe tags |
| FR26 | Epic 4 | Bobby's Pick badge |
| FR27 | Epic 4 | Password-protected admin |
| FR28 | Epic 5 | Google Places API enrichment |
| FR29 | Epic 5 | Rating and price on detail card |
| FR30 | Epic 5 | Restaurant photo on detail card |

## Epic List

### Epic 1: Interactive Restaurant Map
Users can open a single shareable URL and see all curated restaurants displayed as color-coded tier pins on an interactive, zoomable Google Map centered on their location, with a legend explaining the tiers. Works on mobile and desktop with a fully responsive layout.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR16, FR17, FR18

### Epic 2: Restaurant Details & Navigation
Users can click any restaurant pin to see a detail card with the restaurant's name, tier, cuisine, and curator notes, then click through to Google Maps for directions. They can dismiss the card and keep browsing.
**FRs covered:** FR11, FR12, FR13, FR14, FR15

### Epic 3: Smart Filtering
Users can filter visible restaurants by cuisine type and distance from their location, combine filters, clear them, and see the map update instantly.
**FRs covered:** FR6, FR7, FR8, FR9, FR10

### Epic 4: Curator Dashboard (Growth Phase)
The curator can manage the restaurant collection through a password-protected web dashboard -- quick-add with Google Places auto-fill, tier assignment and promotion, note editing, source attribution, occasion/vibe tags, and Bobby's Pick badges.
**FRs covered:** FR19, FR20, FR21, FR22, FR23, FR24, FR25, FR26, FR27

### Epic 5: Data Enrichment & Enhanced Details (Growth Phase)
The system auto-enriches restaurant records with Google Places data (price level, hours, photos, ratings) and users see richer detail cards without curator effort.
**FRs covered:** FR28, FR29, FR30

---

## Epic 1: Interactive Restaurant Map

Users can open a single shareable URL and see all curated restaurants displayed as color-coded tier pins on an interactive, zoomable Google Map centered on their location, with a legend explaining the tiers. Works on mobile and desktop with a fully responsive layout.

### Story 1.1: Project Setup & Google Map Display

As a user,
I want to open the app URL and see an interactive Google Map of the Phoenix metro area,
So that I have a visual canvas to explore restaurant locations.

**Acceptance Criteria:**

**Given** the user navigates to the app URL
**When** the page loads
**Then** a Google Map renders centered on Phoenix metro (33.4484, -112.0740) at zoom level 11
**And** the map supports zoom and pan interactions
**And** the page loads with no authentication or login prompt

**Given** the project is scaffolded
**When** a developer runs `npm run dev`
**Then** a React + Vite + TypeScript app starts with Tailwind CSS configured
**And** the Google Maps API key is loaded from `VITE_GOOGLE_MAPS_API_KEY` environment variable
**And** `@vis.gl/react-google-maps` renders the map via `APIProvider` and `Map` components

**Given** the Google Maps API is unreachable
**When** the page loads
**Then** the user sees a meaningful error state instead of a blank screen

### Story 1.2: Restaurant Data Loading & Pin Display

As a user,
I want to see all curated restaurants displayed as color-coded pins on the map,
So that I can visually identify restaurant tiers and density at a glance.

**Acceptance Criteria:**

**Given** the app has loaded the Google Map
**When** `restaurants.json` is fetched successfully
**Then** every restaurant in the dataset renders as an `AdvancedMarker` pin on the map at its lat/lng coordinates
**And** Loved restaurants display as gold (#F59E0B) pins
**And** Recommended restaurants display as blue (#3B82F6) pins
**And** On My Radar restaurants display as green (#10B981) pins

**Given** the dataset contains ~200 restaurants
**When** all pins are rendered
**Then** the map with all pins renders in under 3 seconds on a standard 4G connection (NFR1)
**And** there is no perceptible lag when zooming or panning (NFR5)

**Given** the `restaurants.json` file fails to load
**When** the fetch returns an error
**Then** the user sees a friendly error message indicating data could not be loaded

**Given** the TypeScript data model
**When** a restaurant record is loaded
**Then** it conforms to the `Restaurant` interface with required fields: id, name, tier, cuisine, lat, lng, googleMapsUrl, dateAdded
**And** optional fields: notes, source

### Story 1.3: Pin Legend

As a user,
I want to see a legend on the map explaining what each pin color means,
So that I understand the curation tiers without needing instructions.

**Acceptance Criteria:**

**Given** the map is displayed with restaurant pins
**When** the user views the map
**Then** a pin legend overlay is visible showing three entries:
- Gold pin = "Loved" (personally tried and loved)
- Blue pin = "Recommended" (tried and would recommend)
- Green pin = "On My Radar" (pre-vetted, want to try)

**And** the legend is always visible without requiring interaction to reveal it
**And** the legend does not obscure critical map content
**And** the legend colors exactly match the pin colors on the map

### Story 1.4: User Geolocation & Map Centering

As a user,
I want the map to auto-center on my current location,
So that I can immediately see restaurants near me without manual navigation.

**Acceptance Criteria:**

**Given** the user opens the app
**When** the browser prompts for geolocation permission and the user grants it
**Then** the map re-centers on the user's current coordinates
**And** a `useGeolocation` hook manages the geolocation state

**Given** the user opens the app
**When** the user denies geolocation permission or the browser does not support it
**Then** the map remains centered on the Phoenix metro default (33.4484, -112.0740)
**And** no error is shown to the user -- the app works normally without location

**Given** the geolocation API returns coordinates
**When** the map re-centers
**Then** the transition is smooth and does not disrupt any pins already rendered

### Story 1.5: Responsive Layout

As a user,
I want the app to work well on my phone, tablet, and laptop,
So that I can find restaurants whether I'm standing in a hallway or sitting at my desk.

**Acceptance Criteria:**

**Given** the user opens the app on a mobile device (screen width < 768px)
**When** the page renders
**Then** the map consumes the majority of the viewport
**And** the pin legend is positioned so it does not block map interaction
**And** all UI elements are usable on a 375px-wide screen without horizontal scrolling

**Given** the user opens the app on a tablet (768px - 1024px)
**When** the page renders
**Then** the layout adapts with appropriate spacing and sizing

**Given** the user opens the app on a desktop (screen width > 1024px)
**When** the page renders
**Then** the full functionality is available with a desktop-appropriate layout
**And** the map and all controls are fully functional

**Given** the static asset bundle
**When** the production build is created
**Then** the total bundle size (HTML, CSS, JS, restaurants.json) is under 500KB excluding Google Maps API payload (NFR4)

### Story 1.6: Production Deployment

As a user,
I want to access the app via a shareable public URL with no login required,
So that I can bookmark it and share it with friends.

**Acceptance Criteria:**

**Given** the app is built with `npm run build`
**When** the build completes
**Then** a `dist/` folder is produced containing index.html, JS/CSS assets, and restaurants.json

**Given** the dist folder is deployed to the VPS
**When** Nginx serves the static files
**Then** the app is accessible at the configured domain/subdomain over HTTPS
**And** the `try_files` directive falls back to index.html for SPA routing
**And** the Google Maps API key is restricted by HTTP referrer to the app's domain (NFR12)

**Given** a deploy script exists
**When** the developer runs the deploy script
**Then** the build output is synced to the VPS via rsync
**And** the existing n8n service is unaffected

---

## Epic 2: Restaurant Details & Navigation

Users can click any restaurant pin to see a detail card with the restaurant's name, tier, cuisine, and curator notes, then click through to Google Maps for directions. They can dismiss the card and keep browsing.

### Story 2.1: Pin Click & Detail Card Display

As a user,
I want to click a restaurant pin and see a detail card with the restaurant's information,
So that I can learn about the restaurant before deciding to go.

**Acceptance Criteria:**

**Given** the map is displayed with restaurant pins
**When** the user clicks or taps a restaurant pin
**Then** a RestaurantCard component appears displaying:
- Restaurant name
- Tier displayed as a colored badge (gold/blue/green matching the pin)
- Cuisine type
**And** the card appears in under 100ms (NFR3)

**Given** a restaurant has curator notes
**When** the detail card is displayed
**Then** the curator notes are shown on the card

**Given** a restaurant has no curator notes
**When** the detail card is displayed
**Then** the notes section is not shown (no empty placeholder or "no notes" message)

**Given** the user clicks a different pin while a card is already open
**When** the new pin is clicked
**Then** the detail card updates to show the newly selected restaurant

### Story 2.2: Google Maps Navigation Link

As a user,
I want to click through from the detail card to Google Maps,
So that I can get directions, check hours, and see more details about the restaurant.

**Acceptance Criteria:**

**Given** a restaurant detail card is displayed
**When** the user views the card
**Then** a prominent "Open in Google Maps" button/link is visible
**And** the link navigates to the restaurant's `googleMapsUrl`

**Given** the user clicks the Google Maps link
**When** the link is activated
**Then** it opens in a new browser tab
**And** the Food List app remains open in the original tab

### Story 2.3: Detail Card Dismissal

As a user,
I want to dismiss the detail card and return to browsing the map,
So that I can continue exploring other restaurants.

**Acceptance Criteria:**

**Given** a restaurant detail card is displayed
**When** the user clicks a close button on the card
**Then** the card is dismissed and the map is fully interactive again

**Given** a restaurant detail card is displayed
**When** the user clicks on the map background (not on a pin)
**Then** the card is dismissed

**Given** the detail card is dismissed
**When** the user interacts with the map
**Then** no restaurant is selected and the map behaves as if no card was ever open

---

## Epic 3: Smart Filtering

Users can filter visible restaurants by cuisine type and distance from their location, combine filters, clear them, and see the map update instantly.

### Story 3.1: Cuisine Type Filter

As a user,
I want to filter restaurants by cuisine type,
So that I can quickly narrow down to the kind of food I'm in the mood for.

**Acceptance Criteria:**

**Given** the map is displayed with restaurant pins
**When** the user views the FilterBar
**Then** a cuisine dropdown is available populated with all unique cuisine values extracted from the loaded restaurant dataset (no hardcoded list)

**Given** the user selects a cuisine type from the dropdown
**When** the filter is applied
**Then** only restaurants matching the selected cuisine remain visible on the map
**And** the map updates immediately with no perceptible delay (NFR2: <100ms)
**And** all non-matching pins are hidden

**Given** a cuisine is selected that matches zero restaurants in the current view
**When** the filter is applied
**Then** no pins are displayed and the map remains interactive

### Story 3.2: Distance Filter

As a user,
I want to filter restaurants by distance from my location,
So that I can find places that are close enough to get to right now.

**Acceptance Criteria:**

**Given** the user has granted geolocation permission
**When** the FilterBar renders
**Then** a distance filter control is available (slider or dropdown) with range options from 5 to 30 miles and an "Any" option

**Given** the user sets a distance value
**When** the filter is applied
**Then** only restaurants within the specified radius of the user's location remain visible
**And** distance is calculated using the Haversine formula via `distance.ts` utility
**And** the map updates immediately (NFR2: <100ms)

**Given** the user has denied geolocation or geolocation is unavailable
**When** the FilterBar renders
**Then** the distance filter is hidden or disabled
**And** only the cuisine filter is available
**And** no error message is shown about the missing distance filter

### Story 3.3: Combined Filters & Clear All

As a user,
I want to combine cuisine and distance filters and clear them all at once,
So that I can refine my search precisely and reset when I want to browse everything.

**Acceptance Criteria:**

**Given** both cuisine and distance filters are available
**When** the user selects a cuisine type AND sets a distance
**Then** only restaurants matching BOTH criteria are visible on the map
**And** the filters are applied simultaneously with no sequential lag

**Given** one or more filters are active
**When** the user clicks a "Clear Filters" button
**Then** all filters reset to their default state (all cuisines, any distance)
**And** all restaurant pins reappear on the map
**And** the map updates immediately

**Given** the user has applied filters
**When** the user views the FilterBar
**Then** the active filter state is visually indicated (selected cuisine shown, distance value displayed)

---

## Epic 4: Curator Dashboard (Growth Phase)

The curator can manage the restaurant collection through a password-protected web dashboard -- quick-add with Google Places auto-fill, tier assignment and promotion, note editing, source attribution, occasion/vibe tags, and Bobby's Pick badges.

### Story 4.1: Curator Authentication & Dashboard Route

As a curator,
I want to access a password-protected management dashboard,
So that only I can modify the restaurant collection.

**Acceptance Criteria:**

**Given** React Router is configured with two routes
**When** a user navigates to `/`
**Then** the public map experience loads as before with no login required (NFR10)

**Given** a user navigates to `/admin`
**When** the dashboard route loads
**Then** a password prompt is displayed before any dashboard content is shown
**And** the authentication mechanism checks against an environment variable or server-side credential (NFR11)

**Given** the curator enters the correct password
**When** authentication succeeds
**Then** the curator dashboard is displayed with restaurant management capabilities

**Given** a user enters an incorrect password
**When** authentication fails
**Then** access is denied with a clear message and the user can retry
**And** no PII is collected or stored (NFR13)

### Story 4.2: Add Restaurant with Google Places Search

As a curator,
I want to add a new restaurant by searching for it by name and having it auto-populated with Google Places data,
So that I can capture a new find in under 30 seconds.

**Acceptance Criteria:**

**Given** the curator is authenticated on the dashboard
**When** the curator types a restaurant name and location into the quick-add search field
**Then** Google Places API returns matching results for selection

**Given** the curator selects a result from the Places search
**When** the restaurant is selected
**Then** a draft record is auto-populated with: name, address, lat/lng coordinates, price level, hours, cuisine category, photo URL, and Google Maps URL
**And** the curator can review and edit any auto-filled field before saving

**Given** the curator saves the new restaurant
**When** the save action completes
**Then** the restaurant is added to the collection with a unique ID and the current date
**And** it appears on the public map on next data refresh

**Given** the Google Places API is unreachable
**When** the curator attempts to search
**Then** the curator can still manually enter restaurant details without auto-fill
**And** the core dashboard remains functional (NFR7)

### Story 4.3: Tier Assignment & Promotion

As a curator,
I want to assign and change a restaurant's tier,
So that I can promote a restaurant from "On My Radar" to "Loved" after I visit it.

**Acceptance Criteria:**

**Given** the curator is adding a new restaurant
**When** the add form is displayed
**Then** a tier selector offers three options: Loved, Recommended, On My Radar
**And** the curator must select a tier before saving

**Given** the curator views an existing restaurant in the dashboard
**When** the curator selects a different tier
**Then** the tier is updated immediately
**And** the pin color changes on the public map on next data refresh

**Given** the curator changes a tier
**When** the update is saved
**Then** the previous tier is not recorded (no tier history for MVP growth phase)

### Story 4.4: Notes Management

As a curator,
I want to add, edit, and delete personal notes on any restaurant,
So that I can share specific recommendations like "try the bone marrow pho" or "cash only."

**Acceptance Criteria:**

**Given** the curator views a restaurant in the dashboard
**When** the curator adds notes to a restaurant that has no notes
**Then** the notes are saved and appear on the public detail card

**Given** the curator views a restaurant with existing notes
**When** the curator edits the notes text
**Then** the updated notes replace the previous version
**And** the changes appear on the public detail card on next data refresh

**Given** the curator views a restaurant with existing notes
**When** the curator deletes the notes (clears the field)
**Then** the notes are removed and the public detail card no longer shows a notes section

### Story 4.5: Source Attribution & Occasion Tags

As a curator,
I want to record where I heard about a restaurant and tag it with occasion/vibe labels,
So that users get richer context and I can remember my sources.

**Acceptance Criteria:**

**Given** the curator is adding or editing a restaurant
**When** the source attribution field is available
**Then** the curator can enter freeform text (e.g., "TikTok @phxfoodie", "friend Dave recommended")
**And** source attribution is optional

**Given** the curator is adding or editing a restaurant
**When** the tags interface is available
**Then** the curator can add one or more occasion/vibe tags from a suggested set (date night, quick lunch, patio, kid-friendly) or create custom tags
**And** tags are optional

**Given** a restaurant has source attribution or tags
**When** the public detail card is displayed (future enhancement to detail card)
**Then** the data is stored and available for display when the detail card is updated to show it

### Story 4.6: Bobby's Pick Featured Badge

As a curator,
I want to mark select restaurants as a featured "Bobby's Pick,"
So that my absolute top recommendations stand out from the rest.

**Acceptance Criteria:**

**Given** the curator views a restaurant in the dashboard
**When** the curator toggles the "Bobby's Pick" designation
**Then** the restaurant is marked as featured
**And** the featured status is saved to the restaurant record

**Given** a restaurant is marked as Bobby's Pick
**When** the curator toggles it off
**Then** the featured designation is removed

**Given** a restaurant is marked as Bobby's Pick
**When** the public detail card is displayed (future enhancement to detail card)
**Then** the featured badge data is stored and available for display when the detail card is updated to show it

---

## Epic 5: Data Enrichment & Enhanced Details (Growth Phase)

The system auto-enriches restaurant records with Google Places data (price level, hours, photos, ratings) and users see richer detail cards without curator effort.

### Story 5.1: Google Places API Enrichment Pipeline

As a curator,
I want the system to automatically enrich restaurant records with Google Places data,
So that I don't have to manually look up ratings, hours, and prices for every restaurant.

**Acceptance Criteria:**

**Given** a restaurant record exists in the collection
**When** the enrichment pipeline runs (manually triggered or via cron/n8n workflow)
**Then** the system calls Google Places API for each restaurant and retrieves: price level, hours, rating, photo URL, and formatted address
**And** enrichment data is stored alongside or extending the restaurant record with an `enrichedAt` timestamp

**Given** the Google Places API returns data for a restaurant
**When** the enrichment completes
**Then** only fields with valid data are updated (null/missing fields from Google are not overwritten with empty values)
**And** curator-authored fields (notes, tier, tags, source) are never overwritten by enrichment

**Given** the Google Places API fails for a specific restaurant
**When** the enrichment encounters an error
**Then** that restaurant is skipped without affecting other records
**And** the core map experience continues to work without enrichment data (NFR7)

**Given** the enrichment pipeline runs
**When** API calls are made
**Then** total API usage stays within the Google free tier ($200/month credit) (NFR8)

### Story 5.2: Enhanced Detail Card with Ratings & Price

As a user,
I want to see Google ratings and price level on the restaurant detail card,
So that I can make a more informed decision without leaving the app.

**Acceptance Criteria:**

**Given** a restaurant has been enriched with Google Places data
**When** the user views the restaurant detail card
**Then** the Google Places rating is displayed (e.g., 4.3 stars)
**And** the price level is displayed (e.g., $, $$, $$$, $$$$)

**Given** a restaurant has NOT been enriched (no enrichment data)
**When** the user views the restaurant detail card
**Then** the rating and price fields are not shown (no empty placeholders)
**And** the card displays normally with the base information (name, tier, cuisine, notes)

### Story 5.3: Restaurant Photos on Detail Card

As a user,
I want to see a photo of the restaurant on the detail card,
So that I get a visual sense of the place before visiting.

**Acceptance Criteria:**

**Given** a restaurant has been enriched and has a photo URL from Google Places
**When** the user views the restaurant detail card
**Then** a restaurant photo is displayed prominently on the card

**Given** a restaurant has no photo URL (not enriched or Google returned no photo)
**When** the user views the restaurant detail card
**Then** no photo placeholder or broken image is shown
**And** the card layout adjusts gracefully without the photo

**Given** the photo URL fails to load (network error, expired URL)
**When** the image fails
**Then** the photo is hidden gracefully without breaking the card layout

---

## Epic 6: User-Facing Enhancements

User-facing quality-of-life improvements that make bobby.menu more useful and shareable.

### Story 6.3: Shareable Restaurant Links

As a user,
I want to share a direct link to a specific restaurant on bobby.menu,
So that when I send it to a friend, they land directly on that restaurant with the pin selected and detail card open.

**Acceptance Criteria:**

**Given** a user is viewing a restaurant detail card
**When** the user clicks a share/copy-link button
**Then** a shareable URL is copied to the clipboard (e.g., `bobby.menu/r/pizzeria-bianco`)
**And** a brief toast notification confirms the link was copied

**Given** someone opens a shareable restaurant URL
**When** the page loads
**Then** the app centers the map on that restaurant's location
**And** the restaurant's pin is selected
**And** the detail card opens automatically

**Given** someone opens a shareable URL with an invalid or unknown restaurant slug
**When** the page loads
**Then** the app falls back to the default map view (Phoenix metro center)
**And** a brief toast or message indicates the restaurant was not found

**Given** the user is on a mobile device with Web Share API support
**When** the user taps the share button
**Then** the native share sheet opens with the restaurant URL
**And** the share includes the restaurant name as the title

**Given** the shareable URL format
**When** React Router processes the URL
**Then** the route `/r/:slug` resolves to the main map view with the matching restaurant pre-selected
**And** existing slug IDs from `generateSlugId` are used (no new ID scheme)

---

## Epic 7: Google OAuth + Supabase Migration

Replace password-based admin auth with Google OAuth and migrate from static JSON to Supabase Postgres. This is the foundation for all future features requiring auth, persistent storage, or user identity.
**FRs covered:** FR31, FR32, FR33, FR34, FR35

### Story 7.1: Supabase Project Setup & Restaurant Data Migration

As a developer,
I want bobby.menu's restaurant data stored in a Supabase Postgres table,
So that the app has a real database supporting auth, queries, and future features.

**Acceptance Criteria:**

**Given** a new Supabase project is created
**When** the project is configured
**Then** the Supabase URL and anon key are stored as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables
**And** a `.env.example` is updated with the new variables

**Given** the current `Restaurant` TypeScript interface
**When** the `restaurants` table is created in Supabase
**Then** the schema matches all fields from the `Restaurant` type: id (text PK), name, tier, cuisine, lat, lng, notes, googleMapsUrl, source, dateAdded, tags (text[]), featured (boolean), enrichedAt, rating, userRatingCount, priceLevel, photoRef
**And** row-level security is enabled: public read for all, authenticated write for admin only

**Given** the existing `public/restaurants.json` file
**When** a migration script is run
**Then** all restaurant records are imported into the Supabase `restaurants` table
**And** no data is lost or transformed incorrectly
**And** the JSON file is kept as a seed/fallback

**Given** the Supabase `restaurants` table is populated
**When** the `useRestaurants` hook fetches data
**Then** it reads from Supabase instead of the static JSON file
**And** the public map renders identically to the current experience
**And** filtering, search, and deep links continue to work

### Story 7.2: Google OAuth for Admin

As Bobby (the curator),
I want to log into the admin dashboard with my Google account,
So that I don't need to remember or type a password.

**Acceptance Criteria:**

**Given** Google OAuth is configured as a provider in Supabase Auth
**When** a user navigates to `/admin`
**Then** a "Sign in with Google" button is displayed instead of a password form

**Given** Bobby clicks "Sign in with Google"
**When** the Google OAuth popup completes successfully
**Then** Supabase creates a session for the authenticated user
**And** the admin dashboard is displayed

**Given** the authenticated user's email matches the admin allowlist (environment variable)
**When** the session is checked by `ProtectedRoute`
**Then** access to the admin dashboard is granted

**Given** the authenticated user's email does NOT match the admin allowlist
**When** the session is checked by `ProtectedRoute`
**Then** access is denied with a message: "You don't have admin access"
**And** the user can sign out and try a different account

**Given** the admin is authenticated
**When** the admin closes the browser and returns later
**Then** the Supabase session persists (no re-login required until session expires)

**Given** the migration is complete
**When** the old environment variables are checked
**Then** `VITE_ADMIN_PASSWORD` and `ADMIN_PASSWORD` are no longer required
**And** the `AdminAuthContext` uses Supabase session instead of `sessionStorage`

### Story 7.3: Migrate Restaurant CRUD to Supabase

As Bobby (the curator),
I want the admin dashboard to read and write restaurants via Supabase,
So that data changes persist in the database instead of a JSON file.

**Acceptance Criteria:**

**Given** the admin is authenticated on the dashboard
**When** the admin adds a new restaurant via Google Places search
**Then** the restaurant is inserted into the Supabase `restaurants` table
**And** it appears on the public map immediately (no deploy required)

**Given** the admin edits a restaurant (tier, notes, tags, featured)
**When** the changes are saved
**Then** the Supabase record is updated
**And** the public map reflects the changes on next data fetch

**Given** the admin deletes a restaurant
**When** the deletion is confirmed
**Then** the record is removed from the Supabase `restaurants` table
**And** the pin disappears from the public map

**Given** the Google Places enrichment pipeline runs
**When** enrichment data is written
**Then** it updates the corresponding Supabase record (not a JSON file)

**Given** all CRUD operations work via Supabase
**When** the Express `server/index.js` is evaluated
**Then** it can be retired if no other endpoints remain
**Or** it is kept only for server-side operations that can't run from the client (e.g., Places API proxy)

---

## Epic 8: Community Submissions

Let visitors suggest restaurants that Bobby can review and approve. Requires Google sign-in for submissions (prevents spam, gives attribution). Depends on Epic 7.
**FRs covered:** FR36, FR37, FR38, FR39, FR40

### Story 8.1: Google Sign-in for Visitors

As a visitor to bobby.menu,
I want to optionally sign in with Google,
So that I can submit restaurant recommendations.

**Acceptance Criteria:**

**Given** the public map is displayed
**When** the visitor views the page
**Then** a subtle "Sign in" button is visible (e.g., top-right corner or in a menu)
**And** the map is fully functional without signing in

**Given** a visitor clicks "Sign in"
**When** the Google OAuth popup completes
**Then** Supabase creates a user session
**And** a record is created in the `users` table (google_id, name, email, avatar, date_joined)
**And** the visitor's avatar and name are displayed in place of the sign-in button

**Given** a signed-in visitor
**When** they click their avatar/name
**Then** a dropdown or menu appears with "Sign out" option
**And** signing out clears the session and returns to anonymous browsing

**Given** the visitor is not signed in
**When** they browse the map, filter, search, and view restaurant cards
**Then** all public features work identically to the anonymous experience

### Story 8.2: Submission Form & Review Queue

As a signed-in user,
I want to submit a restaurant recommendation via a simple form,
So that Bobby can consider adding it to the map.

**Acceptance Criteria:**

**Given** a signed-in user is viewing the map
**When** they click a "Suggest a Restaurant" button
**Then** a submission form opens with fields: restaurant name, location/address, why you recommend it

**Given** the user fills out the form and submits
**When** the submission is saved
**Then** a record is inserted into the Supabase `submissions` table with status `pending`
**And** the record includes the user's ID, name, and submission timestamp
**And** a confirmation message is shown: "Thanks! Bobby will review your suggestion."

**Given** a user who is not signed in
**When** they try to access the submission form
**Then** they are prompted to sign in with Google first

**Given** row-level security on the `submissions` table
**When** a user queries submissions
**Then** they can only see their own submissions
**And** only the admin can see all submissions and update status

**Given** Bobby is on the admin dashboard
**When** he views the "Submissions" tab
**Then** all pending submissions are listed with: restaurant name, location, user note, submitted by, date
**And** each submission has "Approve" and "Dismiss" actions

**Given** Bobby approves a submission
**When** the approval is confirmed
**Then** a new restaurant record is created (Bobby assigns tier and adds notes)
**And** the submission status changes to `approved`
**And** the restaurant appears on the public map

**Given** Bobby dismisses a submission
**When** the dismissal is confirmed
**Then** the submission status changes to `dismissed`
**And** no restaurant record is created

**Given** a user has submitted 5 restaurants today
**When** they try to submit another
**Then** the submission is blocked with a message: "You've reached today's limit. Try again tomorrow."

### Story 8.3: URL-Based Submission with Auto-Extraction

As a signed-in user,
I want to paste a Google Maps link and have restaurant details auto-filled,
So that submitting a recommendation is fast and accurate.

**Acceptance Criteria:**

**Given** the submission form is open
**When** the user pastes a Google Maps URL into the location field
**Then** the system parses the URL to extract the place ID or coordinates
**And** calls the Google Places API to retrieve: name, address, lat/lng, cuisine, rating, price level, photo

**Given** the Places API returns data successfully
**When** the auto-extraction completes
**Then** the form fields are pre-populated with the extracted data
**And** the user can review, edit, and add their personal recommendation note before submitting

**Given** the URL cannot be parsed or the Places API fails
**When** auto-extraction fails
**Then** the form falls back to manual entry mode
**And** the user is informed: "Couldn't extract details automatically. Please fill in the form manually."

**Given** a valid Google Maps URL format
**When** the URL is analyzed
**Then** the system handles common formats: `google.com/maps/place/...`, `maps.app.goo.gl/...`, `goo.gl/maps/...`

### Story 8.4: "Suggested By" Attribution on Detail Cards

As a visitor viewing the map,
I want to see who suggested a community-submitted restaurant,
So that recommendations feel personal and trustworthy.

**Acceptance Criteria:**

**Given** a restaurant was added via community submission
**When** the detail card is displayed
**Then** a "Suggested by [Name]" line appears below the cuisine type
**And** the submitter's Google avatar is displayed as a small thumbnail

**Given** a restaurant was added by Bobby (curator-added)
**When** the detail card is displayed
**Then** no "Suggested by" attribution is shown

**Given** the `suggested_by` field on the restaurant record
**When** a submission is approved
**Then** the submitter's name is stored in the restaurant's `suggested_by` field
**And** their avatar URL is stored in `suggested_by_avatar`

**Given** a restaurant has "Suggested by" attribution
**When** the user clicks on the attribution
**Then** nothing happens (no user profiles for MVP — attribution is display-only)
