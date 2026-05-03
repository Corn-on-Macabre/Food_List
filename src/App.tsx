import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { APIProvider, Map, useMap, type MapMouseEvent } from '@vis.gl/react-google-maps';
import { useRestaurants, useGeolocation } from './hooks';

import { ClusteredPins, PinLegend, RestaurantCard, FilterBar, ProtectedRoute, AdminDashboard, Toast } from './components';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import type { Restaurant } from './types';
import type { FilterState } from './types/restaurant';
import { haversineDistance } from './utils';
import './index.css';

const PHOENIX_CENTER = { lat: 33.4484, lng: -112.0740 };

// Smoothly pans the map to the given coords using the native animated panTo.
// Must be rendered as a child of <Map> to access the map instance via useMap().
// NOTE: getCurrentPosition has no cancellation API. If the parent unmounts before
// geolocation resolves, setCoords/setLoading fire on the unmounted component —
// React 18 handles this as a no-op.
function MapCenterer({ coords }: { coords: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    if (map) {
      map.panTo(coords);
    }
  }, [map, coords]);
  return null;
}

function App() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey || apiKey === 'PLACEHOLDER_KEY') {
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-gray-100">
        <div className="p-6 bg-white rounded shadow text-center">
          <h1 className="text-xl font-semibold text-red-600 mb-2">Configuration Error</h1>
          <p className="text-gray-700">
            Google Maps API key is not configured. Set{' '}
            <code className="bg-gray-100 px-1 rounded text-sm">VITE_GOOGLE_MAPS_API_KEY</code>{' '}
            in your <code className="bg-gray-100 px-1 rounded text-sm">.env</code> file and restart the dev server.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AdminAuthProvider>
      <Routes>
        <Route path="/" element={<AppWithMap apiKey={apiKey} />} />
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
  );
}

function AppWithMap({ apiKey }: { apiKey: string }) {
  const { slug } = useParams<{ slug?: string }>();
  const { restaurants, loading, error } = useRestaurants();
  // geoDenied used in Story 3.2 to hide/show distance control
  const { coords, loading: geoLoading, denied: geoDenied } = useGeolocation();
  // resolvedCenter: user coords if geolocation succeeded, else Phoenix default
  const resolvedCenter = coords ?? PHOENIX_CENTER;

  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [filters, setFilters] = useState<FilterState>({ cuisine: null, tier: null, maxDistance: null, searchTerm: null });

  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  }, []);

  const deepLinkProcessed = useRef(false);
  const [deepLinkCenter, setDeepLinkCenter] = useState<{ lat: number; lng: number } | null>(null);

  // Deep link resolution: when restaurants finish loading and a slug is present, select that restaurant
  useEffect(() => {
    if (!slug || restaurants.length === 0 || deepLinkProcessed.current) return;
    deepLinkProcessed.current = true;
    const found = restaurants.find((r) => r.id === slug);
    if (found) {
      setSelectedRestaurant(found);
      setDeepLinkCenter({ lat: found.lat, lng: found.lng });
    } else {
      showToast('Restaurant not found');
    }
  }, [slug, restaurants, showToast]);

  // URL sync: update browser URL when selectedRestaurant changes
  useEffect(() => {
    const path = selectedRestaurant ? `/r/${selectedRestaurant.id}` : '/';
    if (window.location.pathname !== path) {
      window.history.replaceState(null, '', path);
    }
  }, [selectedRestaurant]);

  // Derived: distance filter is suppressed when location is unavailable or denied (AC 5, 6, 7)
  const effectiveMaxDistance = geoDenied || coords === null ? null : filters.maxDistance;

  const filteredRestaurants = useMemo(
    () => {
      const searchLower = filters.searchTerm?.toLowerCase() ?? null;
      return restaurants.filter((r) => {
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
    [restaurants, filters.searchTerm, filters.cuisine, filters.tier, effectiveMaxDistance, coords]
  );

  const cuisines = useMemo(
    () => Array.from(new Set(restaurants.map(r => r.cuisine))).sort(),
    [restaurants]
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
    setFilters({ cuisine: null, tier: null, maxDistance: null, searchTerm: null });
  }

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
      <div ref={filterBarRef} className="fixed top-0 left-0 right-0 z-50 bg-[rgba(255,251,245,0.92)] backdrop-blur-sm border-b border-stone-200">
        <FilterBar
          cuisines={cuisines}
          activeCuisine={filters.cuisine}
          onCuisineChange={(cuisine) => setFilters(f => ({ ...f, cuisine }))}
          activeTier={filters.tier}
          onTierChange={(tier) => setFilters(f => ({ ...f, tier }))}
          userCoords={coords}
          geoDenied={geoDenied}
          activeDistance={effectiveMaxDistance}
          onDistanceChange={(miles) => setFilters(f => ({ ...f, maxDistance: miles }))}
          searchTerm={filters.searchTerm}
          onSearchChange={(term) => setFilters(f => ({ ...f, searchTerm: term }))}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
        />
      </div>
      <APIProvider apiKey={apiKey}>
        <Map
          style={{ width: '100%', height: '100%' }}
          defaultCenter={PHOENIX_CENTER}
          defaultZoom={11}
          mapId="food-list-map"
          onClick={handleMapClick}
        >
          <ClusteredPins
            restaurants={filteredRestaurants}
            onRestaurantClick={setSelectedRestaurant}
            selectedRestaurantId={selectedRestaurant?.id ?? null}
          />
          {/* Smoothly pan to user location once geolocation resolves */}
          {!geoLoading && coords && <MapCenterer coords={resolvedCenter} />}
          {/* Pan to deep-linked restaurant once resolved */}
          {deepLinkCenter && <MapCenterer coords={deepLinkCenter} />}
        </Map>
      </APIProvider>

      <PinLegend />

      {selectedRestaurant && (
        <RestaurantCard
          restaurant={selectedRestaurant}
          onDismiss={() => setSelectedRestaurant(null)}
          onShareSuccess={() => showToast('Link copied!')}
        />
      )}

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 pointer-events-none">
          <div className="p-6 bg-white rounded shadow text-center">
            <p className="text-gray-700 font-medium">Loading restaurants...</p>
          </div>
        </div>
      )}

      {error !== null && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60">
          <div className="p-6 bg-white rounded shadow text-center">
            <h1 className="text-xl font-semibold text-red-600 mb-2">Data Error</h1>
            <p className="text-gray-700">Could not load restaurant data. Please refresh the page.</p>
          </div>
        </div>
      )}

      <Toast message={toastMessage} visible={toastVisible} onHide={() => setToastVisible(false)} />
    </div>
  );
}

export default App;
