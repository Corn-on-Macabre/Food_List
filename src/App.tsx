import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { APIProvider, Map, useMap, type MapMouseEvent } from '@vis.gl/react-google-maps';
import { useRestaurants, useGeolocation } from './hooks';

import { ClusteredPins, PinLegend, RestaurantCard, FilterBar, ProtectedRoute, AdminDashboard, Toast, SuggestButton, SubmissionForm } from './components';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import type { Restaurant } from './types';
import type { FilterState } from './types/restaurant';
import { haversineDistance } from './utils';
import { FROSTED_BAR, CARD_SURFACE } from './components/styles';
import { METRO_REGIONS, DEFAULT_METRO_ID } from './constants/metros';
import './index.css';

function findNearestMetro(lat: number, lng: number): string {
  let bestId = DEFAULT_METRO_ID;
  let bestDist = Infinity;
  for (const metro of METRO_REGIONS) {
    const dist = haversineDistance(lat, lng, metro.center.lat, metro.center.lng);
    if (dist < bestDist) {
      bestId = metro.id;
      bestDist = dist;
    }
  }
  return bestId;
}

function getMetro(id: string) {
  return METRO_REGIONS.find((m) => m.id === id);
}

const DEFAULT_METRO = getMetro(DEFAULT_METRO_ID)!;

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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AdminAuthProvider>
    </AuthProvider>
  );
}

function AppWithMap({ apiKey }: { apiKey: string }) {
  const { slug, cityId: urlCityId } = useParams<{ slug?: string; cityId?: string }>();
  const navigate = useNavigate();
  const { restaurants, loading, error } = useRestaurants();
  const { coords, loading: geoLoading, denied: geoDenied } = useGeolocation();

  // Resolve initial city: URL param > default (will be updated by geolocation)
  const initialCity = (urlCityId && getMetro(urlCityId)) ? urlCityId : DEFAULT_METRO_ID;
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [filters, setFilters] = useState<FilterState>({ city: initialCity, cuisine: null, tier: null, maxDistance: null, searchTerm: null });

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

  // URL sync: update browser URL when selectedRestaurant or city changes
  useEffect(() => {
    let path: string;
    if (selectedRestaurant) {
      path = `/r/${selectedRestaurant.id}`;
    } else if (filters.city && filters.city !== DEFAULT_METRO_ID) {
      path = `/city/${filters.city}`;
    } else {
      path = '/';
    }
    if (window.location.pathname !== path) {
      window.history.replaceState(null, '', path);
    }
  }, [selectedRestaurant, filters.city]);

  // Distance filter: only active when viewing user's nearest city and coords available
  const showDistance = !geoDenied && coords !== null && userNearestMetro === filters.city;
  const effectiveMaxDistance = showDistance ? filters.maxDistance : null;

  // Restaurants in the selected city
  const cityRestaurants = useMemo(
    () => restaurants.filter((r) => r.city === filters.city),
    [restaurants, filters.city],
  );

  const filteredRestaurants = useMemo(
    () => {
      const searchLower = filters.searchTerm?.toLowerCase() ?? null;
      return cityRestaurants.filter((r) => {
        if (searchLower && !r.name.toLowerCase().includes(searchLower)) return false;
        if (filters.cuisine && r.cuisine !== filters.cuisine) return false;
        if (filters.tier && r.tier !== filters.tier) return false;
        if (effectiveMaxDistance !== null && coords !== null) {
          const dist = haversineDistance(coords.lat, coords.lng, r.lat, r.lng);
          if (dist > effectiveMaxDistance) return false;
        }
        return true;
      });
    },
    [cityRestaurants, filters.searchTerm, filters.cuisine, filters.tier, effectiveMaxDistance, coords],
  );

  // Cuisines scoped to selected city
  const cuisines = useMemo(
    () => Array.from(new Set(cityRestaurants.map(r => r.cuisine))).sort(),
    [cityRestaurants],
  );

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

  const hasActiveFilters = filters.searchTerm !== null || filters.cuisine !== null || filters.tier !== null || filters.maxDistance !== null;

  function handleClearFilters() {
    setFilters((f) => ({ ...f, cuisine: null, tier: null, maxDistance: null, searchTerm: null }));
  }

  const handleCityChange = useCallback((cityId: string) => {
    setFilters((f) => {
      // Auto-clear cuisine if it doesn't exist in the new city
      const newCityCuisines = new Set(restaurants.filter((r) => r.city === cityId).map((r) => r.cuisine));
      const cuisine = f.cuisine && newCityCuisines.has(f.cuisine) ? f.cuisine : null;
      return { ...f, city: cityId, cuisine, maxDistance: null, searchTerm: null };
    });
    setSelectedRestaurant(null);
    navigate(cityId === DEFAULT_METRO_ID ? '/' : `/city/${cityId}`, { replace: true });
  }, [restaurants, navigate]);

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
          restaurants={cityRestaurants}
          onRestaurantSelect={handleAutocompleteSelect}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
          activeCity={filters.city ?? DEFAULT_METRO_ID}
          onCityChange={handleCityChange}
          showDistance={showDistance}
        />
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
          {/* Jump to selected city center */}
          <MapCenterer coords={activeMetro.center} zoom={activeMetro.zoom} />
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
