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
