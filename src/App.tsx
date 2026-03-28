import { APIProvider, Map } from '@vis.gl/react-google-maps';
import { useRestaurants } from './hooks';
import { RestaurantPin } from './components';
import './index.css';

const PHOENIX_CENTER = { lat: 33.4484, lng: -112.0740 };

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

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <APIProvider apiKey={apiKey}>
        <Map
          style={{ width: '100vw', height: '100vh' }}
          defaultCenter={PHOENIX_CENTER}
          defaultZoom={11}
          mapId="food-list-map"
        >
          {restaurants.map(r => (
            <RestaurantPin key={r.id} restaurant={r} />
          ))}
        </Map>
      </APIProvider>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 pointer-events-none">
          <div className="p-6 bg-white rounded shadow text-center">
            <p className="text-gray-700 font-medium">Loading restaurants...</p>
          </div>
        </div>
      )}

      {error !== null && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60">
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
