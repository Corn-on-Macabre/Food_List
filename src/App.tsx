import { useState, useEffect, useMemo } from 'react';
import { APIProvider, Map, useMap, type MapMouseEvent } from '@vis.gl/react-google-maps';
import { useRestaurants, useGeolocation } from './hooks';
import { RestaurantPin, PinLegend, RestaurantCard, FilterBar } from './components';
import type { Restaurant } from './types';
import type { FilterState } from './types/restaurant';
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

  return <AppWithMap apiKey={apiKey} />;
}

function AppWithMap({ apiKey }: { apiKey: string }) {
  const { restaurants, loading, error } = useRestaurants();
  // geoDenied used in Story 3.2 to hide/show distance control
  const { coords, loading: geoLoading, denied: geoDenied } = useGeolocation();
  void geoDenied; // forward-compat: consumed by Story 3.2 DistanceFilter
  // resolvedCenter: user coords if geolocation succeeded, else Phoenix default
  const resolvedCenter = coords ?? PHOENIX_CENTER;

  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [filters, setFilters] = useState<FilterState>({ cuisine: null, maxDistance: null });

  const filteredRestaurants = useMemo(
    () => restaurants.filter(r => !filters.cuisine || r.cuisine === filters.cuisine),
    [restaurants, filters.cuisine]
  );

  const cuisines = useMemo(
    () => Array.from(new Set(restaurants.map(r => r.cuisine))).sort(),
    [restaurants]
  );

  function handleMapClick(event: MapMouseEvent) {
    // Only dismiss when clicking empty map space — not on a place/pin
    if (!selectedRestaurant) return;
    if (!event.detail.placeId) {
      setSelectedRestaurant(null);
    }
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      {/* TODO: change to top-[60px] when app header is implemented (Story 4.x) */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-[rgba(255,251,245,0.92)] backdrop-blur-sm border-b border-stone-200">
        <FilterBar
          cuisines={cuisines}
          activeCuisine={filters.cuisine}
          onCuisineChange={(cuisine) => setFilters(f => ({ ...f, cuisine }))}
        />
      </div>
      <APIProvider apiKey={apiKey}>
        <Map
          style={{ width: '100vw', height: '100vh' }}
          defaultCenter={PHOENIX_CENTER}
          defaultZoom={11}
          mapId="food-list-map"
          onClick={handleMapClick}
        >
          {filteredRestaurants.map(r => (
            <RestaurantPin key={r.id} restaurant={r} />
          ))}
          {/* Smoothly pan to user location once geolocation resolves */}
          {!geoLoading && coords && <MapCenterer coords={resolvedCenter} />}
        </Map>
      </APIProvider>

      <PinLegend />

      {selectedRestaurant && (
        <RestaurantCard
          restaurant={selectedRestaurant}
          onDismiss={() => setSelectedRestaurant(null)}
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
    </div>
  );
}

export default App;
