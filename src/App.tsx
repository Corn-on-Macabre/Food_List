import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { APIProvider, Map, useMap, type MapMouseEvent } from '@vis.gl/react-google-maps';
import { useRestaurants, useGeolocation, useCollection } from './hooks';

import { ClusteredPins, PinLegend, RestaurantCard, FilterBar, ProtectedRoute, AdminDashboard, Toast, SuggestButton, SubmissionForm, StatsPage, CollectionBanner } from './components';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import type { Restaurant } from './types';
import type { FilterState } from './types/restaurant';
import { haversineDistance, isOpenNow, localNowMinutes, metroTimezone, filtersToSearchParams, filtersFromSearchParams, shareUrl } from './utils';
import { FROSTED_BAR, CARD_SURFACE } from './components/styles';
import { METRO_REGIONS, DEFAULT_METRO_ID, EVERYWHERE_ID, nearestMetroId } from './constants/metros';
import { TAG_VOCABULARY } from './constants/tags';
import './index.css';

function findNearestMetro(lat: number, lng: number): string {
  return nearestMetroId(lat, lng, haversineDistance);
}

function getMetro(id: string) {
  return METRO_REGIONS.find((m) => m.id === id);
}

const DEFAULT_METRO = getMetro(DEFAULT_METRO_ID)!;

// Every filter except city, in its cleared state — one literal so "initial"
// and "clear filters" can never drift apart when a new filter field is added.
const CLEARED_FILTERS: Omit<FilterState, 'city'> = {
  cuisine: null, tier: null, maxDistance: null, searchTerm: null, openNow: false, tags: [], recognized: false,
};

// Smoothly pans the map to the given coords using the native animated panTo.
// Must be rendered as a child of <Map> to access the map instance via useMap().
// NOTE: getCurrentPosition has no cancellation API. If the parent unmounts before
// geolocation resolves, setCoords/setLoading fire on the unmounted component —
// React 18 handles this as a no-op.
function MapCenterer({ coords, zoom }: { coords: { lat: number; lng: number }; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (map) {
      map.setCenter(coords);
      if (zoom != null) {
        map.setZoom(zoom);
      }
    }
  }, [map, coords, zoom]);
  return null;
}

// Fits the map viewport around all collection member pins, once, when the
// collection resolves. Single-pin collections get a sane fixed zoom instead
// of fitBounds' max zoom-in.
function MapBoundsFitter({ points }: { points: { lat: number; lng: number }[] }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (!map || fitted.current || points.length === 0) return;
    fitted.current = true;
    if (points.length === 1) {
      map.setCenter(points[0]);
      map.setZoom(15);
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    for (const p of points) bounds.extend(p);
    map.fitBounds(bounds, 48);
  }, [map, points]);
  return null;
}

function App() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey || apiKey === 'PLACEHOLDER_KEY') {
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-brand-bg">
        <div className={`${CARD_SURFACE} p-6 shadow-lg text-center max-w-md`}>
          <h1 className="font-display text-xl font-bold text-stone-900 mb-2">Configuration Error</h1>
          <p className="font-sans text-sm text-stone-500">
            Google Maps API key is not configured. Set{' '}
            <code className="bg-brand-surface-warm px-1 rounded text-sm">VITE_GOOGLE_MAPS_API_KEY</code>{' '}
            in your <code className="bg-brand-surface-warm px-1 rounded text-sm">.env</code> file and restart the dev server.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
    <AdminAuthProvider>
      <Routes>
        <Route path="/" element={<AppWithMap apiKey={apiKey} />} />
        <Route path="/city/:cityId" element={<AppWithMap apiKey={apiKey} />} />
        <Route
          path="/admin"
          element={
            <APIProvider apiKey={apiKey} libraries={['places']}>
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            </APIProvider>
          }
        />
        <Route path="/r/:slug" element={<AppWithMap apiKey={apiKey} />} />
        <Route path="/c/:collectionSlug" element={<AppWithMap apiKey={apiKey} />} />
        <Route
          path="/stats"
          element={
            <ProtectedRoute>
              <StatsPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AdminAuthProvider>
    </AuthProvider>
  );
}

function AppWithMap({ apiKey }: { apiKey: string }) {
  const { slug, cityId: urlCityId, collectionSlug } = useParams<{ slug?: string; cityId?: string; collectionSlug?: string }>();
  const navigate = useNavigate();
  const { collection, notFound: collectionNotFound } = useCollection(collectionSlug);
  const { restaurants, loading, error } = useRestaurants();
  const { coords, loading: geoLoading, denied: geoDenied } = useGeolocation();

  // Resolve initial city: URL param > default (will be updated by geolocation)
  const initialCity = (urlCityId && (getMetro(urlCityId) || urlCityId === EVERYWHERE_ID)) ? urlCityId : DEFAULT_METRO_ID;
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  // Lazy initializer: shareable filters arrive as query params (?tier=loved&tags=patio)
  const [filters, setFilters] = useState<FilterState>(() =>
    filtersFromSearchParams(window.location.search, { city: initialCity, ...CLEARED_FILTERS }));

  // Resolve city from geolocation once (only if no URL city was specified)
  const geoResolved = useRef(false);
  useEffect(() => {
    if (geoResolved.current || geoLoading || !coords || urlCityId) return;
    geoResolved.current = true;
    const nearest = findNearestMetro(coords.lat, coords.lng);
    setFilters((f) => ({ ...f, city: nearest }));
  }, [coords, geoLoading, urlCityId]);

  // The user's nearest metro (for deciding whether to show distance filter)
  const userNearestMetro = useMemo(
    () => (coords ? findNearestMetro(coords.lat, coords.lng) : null),
    [coords],
  );

  const activeMetro = getMetro(filters.city ?? DEFAULT_METRO_ID) ?? DEFAULT_METRO;

  const { isAuthenticated, loading: authLoading } = useAuth();
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);

  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  }, []);

  const deepLinkProcessed = useRef(false);
  const [deepLinkCenter, setDeepLinkCenter] = useState<{ lat: number; lng: number } | null>(null);

  // Autocomplete selection: pan to restaurant and open detail card
  const [panTarget, setPanTarget] = useState<{ lat: number; lng: number; key: number } | null>(null);
  const panKeyRef = useRef(0);

  const handleAutocompleteSelect = useCallback((restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    panKeyRef.current += 1;
    setPanTarget({ lat: restaurant.lat, lng: restaurant.lng, key: panKeyRef.current });
    setFilters(f => ({ ...f, searchTerm: null }));
  }, []);

  // Collection not-found: toast and fall back to the default map (mirrors the /r/ deep-link miss)
  const collectionMissProcessed = useRef(false);
  useEffect(() => {
    if (!collectionNotFound || collectionMissProcessed.current) return;
    collectionMissProcessed.current = true;
    showToast('Collection not found');
    navigate('/', { replace: true });
  }, [collectionNotFound, showToast, navigate]);

  // Deep link resolution: when restaurants finish loading and a slug is present, select that restaurant
  useEffect(() => {
    if (!slug || restaurants.length === 0 || deepLinkProcessed.current) return;
    deepLinkProcessed.current = true;
    const found = restaurants.find((r) => r.id === slug);
    if (found) {
      setSelectedRestaurant(found);
      setDeepLinkCenter({ lat: found.lat, lng: found.lng });
      // Auto-select the restaurant's city
      if (found.city) {
        setFilters((f) => ({ ...f, city: found.city }));
      }
    } else {
      showToast('Restaurant not found');
    }
  }, [slug, restaurants, showToast]);

  // URL sync: update browser URL when selectedRestaurant or filters change.
  // Precedence: /r/:id (clean, canonical) > /c/:slug + params > /city/:city + params > / + params.
  // Filters survive in state; their query params reappear when the card is dismissed.
  // replaceState doesn't touch router state, so useParams keeps collectionSlug
  // while a card is open inside a collection — dismissing restores /c/:slug.
  useEffect(() => {
    let path: string;
    let search = '';
    if (selectedRestaurant) {
      path = `/r/${selectedRestaurant.id}`;
    } else if (collectionSlug && !collectionNotFound) {
      path = `/c/${collectionSlug}`;
      search = filtersToSearchParams(filters);
    } else {
      path = filters.city && filters.city !== DEFAULT_METRO_ID ? `/city/${filters.city}` : '/';
      search = filtersToSearchParams(filters);
    }
    if (window.location.pathname + window.location.search !== path + search) {
      window.history.replaceState(null, '', path + search);
    }
  }, [selectedRestaurant, filters, collectionSlug, collectionNotFound]);

  // Distance filter: only active when viewing user's nearest city and coords
  // available. Collections span metros, so "nearest metro === city" is
  // meaningless there — force it off.
  const showDistance = !collection && !geoDenied && coords !== null && userNearestMetro === filters.city;
  const effectiveMaxDistance = showDistance ? filters.maxDistance : null;

  // Restaurants in the selected city; Everywhere shows all pins (including
  // the 'elsewhere' bucket, which belongs to no metro)
  const isEverywhere = filters.city === EVERYWHERE_ID;
  const cityRestaurants = useMemo(
    () => (isEverywhere ? restaurants : restaurants.filter((r) => r.city === filters.city)),
    [restaurants, filters.city, isEverywhere],
  );

  // Collection mode: membership replaces the city scope entirely (a collection can span metros)
  const collectionIds = useMemo(
    () => (collection ? new Set(collection.restaurant_ids) : null),
    [collection],
  );
  const baseRestaurants = useMemo(
    () => (collectionIds ? restaurants.filter((r) => collectionIds.has(r.id)) : cityRestaurants),
    [collectionIds, restaurants, cityRestaurants],
  );
  const collectionPoints = useMemo(
    () => (collection ? baseRestaurants.map((r) => ({ lat: r.lat, lng: r.lng })) : []),
    [collection, baseRestaurants],
  );
  const everywherePoints = useMemo(
    () => (isEverywhere && !collection ? restaurants.map((r) => ({ lat: r.lat, lng: r.lng })) : []),
    [isEverywhere, collection, restaurants],
  );

  const filteredRestaurants = useMemo(
    () => {
      const searchLower = filters.searchTerm?.toLowerCase() ?? null;
      // Opening hours are stored in each place's local time. Everywhere view
      // (and collections) mix timezones, so resolve per restaurant, cached per
      // tz. (Plain object — `Map` here is the @vis.gl map component import.)
      const nowMinutesByTz: Record<string, number> = {};
      const nowFor = (city: string | undefined): number => {
        const tz = metroTimezone(city);
        nowMinutesByTz[tz] ??= localNowMinutes(tz);
        return nowMinutesByTz[tz];
      };
      return baseRestaurants.filter((r) => {
        if (searchLower && !r.name.toLowerCase().includes(searchLower)) return false;
        if (filters.cuisine && r.cuisine !== filters.cuisine) return false;
        if (filters.tier && r.tier !== filters.tier) return false;
        if (filters.openNow && !isOpenNow(r.openingHours, nowFor(r.city))) return false;
        if (filters.recognized && !(r.accolades && r.accolades.length > 0)) return false;
        if (filters.tags.length > 0 && !filters.tags.every((t) => r.tags?.includes(t))) return false;
        if (effectiveMaxDistance !== null && coords !== null) {
          const dist = haversineDistance(coords.lat, coords.lng, r.lat, r.lng);
          if (dist > effectiveMaxDistance) return false;
        }
        return true;
      });
    },
    [baseRestaurants, filters.searchTerm, filters.cuisine, filters.tier, filters.openNow, filters.recognized, filters.tags, effectiveMaxDistance, coords],
  );

  // Cuisines scoped to the current view (selected city, or collection members)
  const cuisines = useMemo(
    () => Array.from(new Set(baseRestaurants.map(r => r.cuisine))).sort(),
    [baseRestaurants],
  );

  // Tags present in the current view, in vocabulary order; hours availability gates the Open Now chip
  const availableTags = useMemo(() => {
    const present = new Set(baseRestaurants.flatMap((r) => r.tags ?? []));
    return TAG_VOCABULARY.filter((t) => present.has(t));
  }, [baseRestaurants]);
  const hasHours = useMemo(() => baseRestaurants.some((r) => r.openingHours), [baseRestaurants]);
  const hasAccolades = useMemo(() => baseRestaurants.some((r) => r.accolades && r.accolades.length > 0), [baseRestaurants]);

  // Dynamically measure the filter bar height so the map container can offset below it.
  // ResizeObserver keeps the padding in sync when the bar resizes (e.g., distance row appearing).
  const filterBarRef = useRef<HTMLDivElement>(null);
  const [filterBarHeight, setFilterBarHeight] = useState(0);

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

  const hasActiveFilters = filters.searchTerm !== null || filters.cuisine !== null || filters.tier !== null || filters.maxDistance !== null || filters.openNow || filters.recognized || filters.tags.length > 0;

  function handleClearFilters() {
    setFilters((f) => ({ ...f, ...CLEARED_FILTERS }));
  }

  const handleCityChange = useCallback((cityId: string) => {
    setFilters((f) => {
      // Auto-clear cuisine if it doesn't exist in the new city (Everywhere has them all)
      const inNewCity = cityId === EVERYWHERE_ID ? restaurants : restaurants.filter((r) => r.city === cityId);
      const newCityCuisines = new Set(inNewCity.map((r) => r.cuisine));
      const cuisine = f.cuisine && newCityCuisines.has(f.cuisine) ? f.cuisine : null;
      return { ...f, city: cityId, cuisine, maxDistance: null, searchTerm: null };
    });
    setSelectedRestaurant(null);
    navigate(cityId === DEFAULT_METRO_ID ? '/' : `/city/${cityId}`, { replace: true });
  }, [restaurants, navigate]);

  const handleShareView = useCallback(() => {
    // The URL-sync effect keeps window.location current, so the address bar IS the shareable link
    void shareUrl('bobby.menu', window.location.href).then((ok) => {
      if (ok) showToast('Link copied!');
    });
  }, [showToast]);

  function handleMapClick(event: MapMouseEvent) {
    // Only dismiss when clicking empty map space — not on a place/pin
    if (!selectedRestaurant) return;
    if (!event.detail.placeId) {
      setSelectedRestaurant(null);
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', paddingTop: `${filterBarHeight}px` }}>
      {/* fixed keeps the bar anchored to the visual viewport on mobile (avoids iOS 100vh scroll bug) */}
      <div ref={filterBarRef} className={`fixed top-0 left-0 right-0 z-50 overflow-visible ${FROSTED_BAR}`}>
        <FilterBar
          cuisines={cuisines}
          activeCuisine={filters.cuisine}
          onCuisineChange={(cuisine) => setFilters(f => ({ ...f, cuisine }))}
          activeTier={filters.tier}
          onTierChange={(tier) => setFilters(f => ({ ...f, tier }))}
          activeDistance={effectiveMaxDistance}
          onDistanceChange={(miles) => setFilters(f => ({ ...f, maxDistance: miles }))}
          searchTerm={filters.searchTerm}
          onSearchChange={(term) => setFilters(f => ({ ...f, searchTerm: term }))}
          restaurants={baseRestaurants}
          onRestaurantSelect={handleAutocompleteSelect}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
          onShareView={handleShareView}
          activeCity={filters.city ?? DEFAULT_METRO_ID}
          onCityChange={handleCityChange}
          showDistance={showDistance}
          openNow={filters.openNow}
          onOpenNowChange={(openNow) => setFilters(f => ({ ...f, openNow }))}
          activeTags={filters.tags}
          onTagToggle={(tag) => setFilters(f => ({ ...f, tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag] }))}
          availableTags={availableTags}
          hasHours={hasHours}
          recognized={filters.recognized}
          onRecognizedChange={(recognized) => setFilters(f => ({ ...f, recognized }))}
          hasAccolades={hasAccolades}
          hideCity={collection !== null}
        />
        {collection && (
          <CollectionBanner
            title={collection.title}
            blurb={collection.blurb}
            count={baseRestaurants.length}
            onShareSuccess={() => showToast('Link copied!')}
          />
        )}
      </div>
      <APIProvider apiKey={apiKey}>
        <Map
          style={{ width: '100%', height: '100%' }}
          defaultCenter={activeMetro.center}
          defaultZoom={activeMetro.zoom}
          mapId="f1de4e716bd1afb992c78c8e"
          onClick={handleMapClick}
        >
          <ClusteredPins
            restaurants={filteredRestaurants}
            onRestaurantClick={setSelectedRestaurant}
            selectedRestaurantId={selectedRestaurant?.id ?? null}
            deepLinkedId={slug ?? null}
          />
          {/* Jump to selected city center (collections and Everywhere fit bounds instead) */}
          {!collection && !isEverywhere && <MapCenterer coords={activeMetro.center} zoom={activeMetro.zoom} />}
          {/* Fit the viewport around all collection members once resolved */}
          {collection && !deepLinkCenter && collectionPoints.length > 0 && (
            <MapBoundsFitter points={collectionPoints} />
          )}
          {/* Everywhere: fit around every pin (key remounts the once-guard on re-entry) */}
          {!collection && isEverywhere && !deepLinkCenter && everywherePoints.length > 0 && (
            <MapBoundsFitter key="everywhere-fit" points={everywherePoints} />
          )}
          {/* Pan to deep-linked restaurant once resolved */}
          {deepLinkCenter && <MapCenterer coords={deepLinkCenter} zoom={15} />}
          {/* Pan to autocomplete-selected restaurant */}
          {panTarget && <MapCenterer key={panTarget.key} coords={panTarget} zoom={15} />}
        </Map>
        {/* SubmissionForm rendered inside APIProvider so it can access google.maps.places */}
        {showSubmissionForm && (
          <SubmissionForm onClose={() => setShowSubmissionForm(false)} />
        )}
      </APIProvider>

      <PinLegend />

      {!loading && hasActiveFilters && filteredRestaurants.length === 0 && (
        <div
          className={`${CARD_SURFACE} absolute left-1/2 -translate-x-1/2 z-10 shadow-md px-4 py-3 flex items-center gap-3 animate-fade-in motion-reduce:animate-none whitespace-nowrap`}
          style={{ top: filterBarHeight + 16 }}
        >
          <p className="font-sans text-sm text-stone-500">No spots match &mdash; try clearing a filter.</p>
          <button
            onClick={handleClearFilters}
            className="font-sans text-sm font-semibold text-brand-accent hover:text-brand-accent-hover underline underline-offset-2 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cta rounded"
          >
            Clear filters
          </button>
        </div>
      )}

      {selectedRestaurant && (
        <RestaurantCard
          key={selectedRestaurant.id}
          restaurant={selectedRestaurant}
          onDismiss={() => setSelectedRestaurant(null)}
          onShareSuccess={() => showToast('Link copied!')}
          filterBarHeight={filterBarHeight}
        />
      )}

      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-brand-bg/70 backdrop-blur-[2px] pointer-events-none">
          <div className="text-center">
            <p className="font-display text-2xl font-bold text-stone-900 animate-pulse">bobby.menu</p>
            <p className="font-sans text-sm text-stone-500 mt-1">setting the table&hellip;</p>
          </div>
        </div>
      )}

      {error !== null && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-brand-bg/70 backdrop-blur-[2px]">
          <div className={`${CARD_SURFACE} p-6 shadow-lg text-center max-w-sm`}>
            <h1 className="font-display text-xl font-bold text-stone-900 mb-2">Well, this is awkward</h1>
            <p className="font-sans text-sm text-stone-500">Couldn't load the list. Give the page a refresh.</p>
          </div>
        </div>
      )}

      {!authLoading && isAuthenticated && (
        <SuggestButton onClick={() => setShowSubmissionForm(true)} />
      )}

      <Toast message={toastMessage} visible={toastVisible} onHide={() => setToastVisible(false)} />
    </div>
  );
}

export default App;
