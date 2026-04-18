# Architecture

**Analysis Date:** 2026-04-18

## Pattern Overview

**Overall:** Client-side filtered map SPA with dual-mode routing (public map / admin panel)

**Key Characteristics:**
- Single-page application with React Router dual-route system: public map route (`/`) and protected admin route (`/admin`)
- Client-side filtering on ~200 static restaurant records (no server round-trips)
- React Context for session-based admin authentication
- Google Maps integration via `@vis.gl/react-google-maps` with marker clustering
- Type-safe data with TypeScript strict mode

## Layers

**Presentation (UI Components):**
- Purpose: Render interactive UI and map interface
- Location: `src/components/`
- Contains: React functional components for map, filters, restaurant cards, admin panels, badges, forms
- Depends on: Hooks, types, utilities, constants
- Used by: Main App component and routes

**State & Hooks:**
- Purpose: Encapsulate component logic and external data fetching
- Location: `src/hooks/`
- Contains: Custom React hooks for restaurants, geolocation, auth, Google Places API integration
- Depends on: Types, API layer, browser APIs (Geolocation, Fetch)
- Used by: Components throughout the app

**Context (Application State):**
- Purpose: Provide session-scoped admin authentication state
- Location: `src/contexts/AdminAuthContext.tsx`
- Contains: AdminAuthProvider, useAdminAuth hook, password storage in sessionStorage
- Depends on: None (browser APIs)
- Used by: Admin routes, protected components

**API Layer:**
- Purpose: Encapsulate HTTP communication with backend for admin operations
- Location: `src/api/restaurants.ts`
- Contains: Functions for fetch/add/update/delete restaurants with Bearer token auth
- Depends on: Types
- Used by: AdminDashboard component, admin workflows

**Data Layer:**
- Purpose: Type definitions and constants
- Location: `src/types/`, `src/constants/`
- Contains: Restaurant type, FilterState, Tier enum, tier color mappings
- Depends on: None
- Used by: All other layers

**Utilities:**
- Purpose: Shared calculation and formatting functions
- Location: `src/utils/`
- Contains: Haversine distance calculation, slug ID generation, Google Places type mapping, price level formatting
- Depends on: Types (some files)
- Used by: Components and hooks

## Data Flow

**Public Map Flow:**

1. `main.tsx` bootstraps App → BrowserRouter
2. App.tsx routes to `/` → AppWithMap component
3. AppWithMap initializes:
   - useRestaurants hook fetches `/restaurants.json` (static public data)
   - useGeolocation hook requests browser geolocation with promise-based getCurrentPosition
   - useState for filters and selectedRestaurant
4. useMemo derived state: filteredRestaurants (search, cuisine, tier, distance filters applied)
5. APIProvider wraps Map from @vis.gl/react-google-maps
6. ClusteredPins renders AdvancedMarkers, MarkerClusterer groups by zoom
7. User clicks pin → setSelectedRestaurant → RestaurantCard renders below map
8. FilterBar receives filter changes (cuisine, tier, distance, search) → updates state → triggers useMemo recompute → re-render filtered pins

**Admin Flow:**

1. Navigate to `/admin`
2. ProtectedRoute checks AdminAuthContext.isAuthenticated
3. If false, renders AdminLogin → user enters password
4. AdminAuthProvider.login validates against VITE_ADMIN_PASSWORD → sets sessionStorage, updates context
5. AdminDashboard loads (once authenticated):
   - fetchAllRestaurants(password) via API layer with Bearer auth
   - AdminAuthProvider supplies password to API calls
6. User selects "add" tab → AddRestaurantPanel with RestaurantDraftForm
7. Form integrates PlacesSearchInput (Google Places Autocomplete) → PlacesDetailsInput (photo/rating fetch)
8. On submit: addRestaurant() → refetch all restaurants → update both allRestaurants and sessionRestaurants
9. User selects "list" tab → RestaurantListPanel shows all + session additions
10. Click restaurant row → SessionRestaurantCard with inline edit fields for tier, notes, source, tags, featured
11. updateRestaurant(password, id, changes) persists changes, updates local state dual-sync (session + all)

**State Management:**

- **Component state:** React useState for filter state, selected restaurant, tab selection
- **Derived state:** useMemo for filtered restaurant list, unique cuisines
- **Context state:** AdminAuthProvider holds authentication status and password for API calls
- **Session storage:** sessionStorage['food-list-admin-auth'] persists auth across page reloads during same session
- **Server state:** All restaurant data reflects server (not optimistically updated); refetch after mutations

## Key Abstractions

**FilterState Interface:**
- Purpose: Represents current filter selections across the public map
- Location: `src/types/restaurant.ts`
- Fields: cuisine (string | null), tier (Tier | null), maxDistance (number | null), searchTerm (string | null)
- Pattern: Immutable updates via useState setters

**Restaurant Type:**
- Purpose: Core domain model for restaurant record
- Location: `src/types/restaurant.ts`
- Fields: id (slug), name, tier, cuisine, lat/lng, notes, googleMapsUrl, rating, userRatingCount, priceLevel, photoRef, featured, tags, dateAdded
- Pattern: Fully typed, passed between layers

**Tier System:**
- Purpose: Categorize restaurants into three levels
- Values: "loved" (gold #F59E0B), "recommended" (blue #3B82F6), "on_my_radar" (green #10B981)
- Pattern: Type-safe enum, color mappings in `src/constants/tierColors.ts`

**Custom Hooks as Adapters:**
- useRestaurants: Wraps fetch logic, handles loading/error states
- useGeolocation: Wraps browser Geolocation API, tracks denied permission
- useAdminAuth: Context consumer, provides login/logout/isAuthenticated
- usePlacesAutocomplete, usePlaceDetails: Wrap Google Places API calls

## Entry Points

**Public Map:**
- Location: `src/App.tsx` (AppWithMap component)
- Triggers: Route `/`
- Responsibilities: Initialize map, manage filter/selection state, render UI layers, handle geolocation

**Admin Panel:**
- Location: `src/components/AdminDashboard.tsx`
- Triggers: Route `/admin` + authenticated
- Responsibilities: Load restaurant list, manage add/edit/delete workflows, dual-sync state

**Application Bootstrap:**
- Location: `src/main.tsx`
- Triggers: Page load
- Responsibilities: Mount React app, wrap with BrowserRouter, validate API key

## Error Handling

**Strategy:** User-facing error modals with recovery options

**Patterns:**

- **Data fetch errors:** useRestaurants catches HTTP errors, displays overlay modal "Could not load restaurant data. Please refresh the page."
- **API key missing:** App.tsx checks VITE_GOOGLE_MAPS_API_KEY before rendering, shows error if missing/placeholder
- **Admin API errors:** AdminDashboard catch blocks set error state, user retries action or refreshes
- **Geolocation errors:** useGeolocation silently catches, sets denied flag (permission denied) or leaves coords null (unavailable), distance filter hidden
- **Form validation:** RestaurantDraftForm validates required fields before submit, PlacesSearchInput requires selection

## Cross-Cutting Concerns

**Logging:** Console methods only (no external service), no structured logging framework

**Validation:** Type-safe with TypeScript strict mode; runtime validation via zod-style checks (Array.isArray in useRestaurants, property existence checks in forms)

**Authentication:** Session-based via sessionStorage token + context provider; password validated against build-time env var VITE_ADMIN_PASSWORD; no persistence across browser closes (sessionStorage scope)

**Geolocation:** Browser API with graceful degradation — if denied or unavailable, fall back to Phoenix center coords, hide distance filter

**Caching:** No explicit cache layer; restaurants.json served statically; admin endpoints refetch after mutation (no optimistic updates)

---

*Architecture analysis: 2026-04-18*
