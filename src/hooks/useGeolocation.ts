import { useState, useEffect } from 'react';

interface Coords {
  lat: number;
  lng: number;
}

interface UseGeolocationResult {
  coords: Coords | null;
  loading: boolean;
  /** true if the user explicitly denied the geolocation permission prompt (error.code === 1).
   *  Consumed by the distance filter in Story 3.2 to hide the control when location is unavailable. */
  denied: boolean;
}

export function useGeolocation(): UseGeolocationResult {
  const [coords, setCoords] = useState<Coords | null>(null);
  // Initialize loading based on geolocation availability to avoid a synchronous setState
  // in the effect body (react-hooks/set-state-in-effect). When navigator.geolocation is
  // not available, loading starts false — the effect becomes a no-op with no extra render.
  const [loading, setLoading] = useState(() => !!navigator.geolocation);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    // NOTE: getCurrentPosition has no cancellation API. If this component unmounts before
    // the position resolves, setCoords/setLoading will fire on the unmounted component.
    // React 18 handles this as a no-op — no memory leak, no warning.
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLoading(false);
      },
      (error) => {
        if (error.code === 1) {
          setDenied(true);
        }
        setLoading(false);
      }
    );
  }, []);

  return { coords, loading, denied };
}
