import { useEffect, useRef, useCallback } from 'react';
import { AdvancedMarker, AdvancedMarkerAnchorPoint, useMap } from '@vis.gl/react-google-maps';
import { MarkerClusterer, type Renderer } from '@googlemaps/markerclusterer';
import { TIER_COLORS } from '../constants/tierColors';
import { TierDot } from './RestaurantPin';
import type { Restaurant } from '../types';

// Brand cluster bubbles: amber circle with cream ring and Karla count,
// replacing the library's default blue circles.
const clusterRenderer: Renderer = {
  render: ({ count, position }) => {
    const div = document.createElement('div');
    div.className =
      'flex items-center justify-center rounded-full bg-brand-cta text-brand-on-accent font-sans font-bold border-[3px] border-brand-bg shadow-[0_2px_6px_rgba(0,0,0,0.28)] ' +
      (count < 10 ? 'w-9 h-9 text-xs' : count < 50 ? 'w-10 h-10 text-sm' : 'w-11 h-11 text-sm');
    div.textContent = String(count);
    return new google.maps.marker.AdvancedMarkerElement({
      position,
      content: div,
      zIndex: 1_000_000 + count,
    });
  },
};

interface ClusteredPinsProps {
  restaurants: Restaurant[];
  onRestaurantClick: (restaurant: Restaurant) => void;
  selectedRestaurantId: string | null;
  deepLinkedId: string | null;
}

export function ClusteredPins({ restaurants, onRestaurantClick, selectedRestaurantId, deepLinkedId }: ClusteredPinsProps) {
  const map = useMap();
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());

  // Marker ref callbacks only fire on mount/unmount, so this counter changes
  // exactly when the marker set changes — it gates the re-sync effect below.
  const markersVersionRef = useRef(0);
  const syncedVersionRef = useRef(-1);

  // Initialize clusterer once the map is ready
  useEffect(() => {
    if (!map) return;
    clustererRef.current = new MarkerClusterer({ map, renderer: clusterRenderer });
    syncedVersionRef.current = -1; // fresh clusterer needs a full sync
    return () => {
      clustererRef.current?.clearMarkers();
      clustererRef.current = null;
    };
  }, [map]);

  // Re-sync clusterer whenever the markers map changes. Deliberately no dep
  // array (marker refs land after render), but the version guard makes it a
  // no-op unless markers were actually added/removed — otherwise every
  // unrelated App render would re-cluster all ~250 markers.
  useEffect(() => {
    if (!clustererRef.current) return;
    if (markersVersionRef.current === syncedVersionRef.current) return;
    syncedVersionRef.current = markersVersionRef.current;
    clustererRef.current.clearMarkers();
    clustererRef.current.addMarkers(Array.from(markersRef.current.values()));
  });

  const setMarkerRef = useCallback(
    (marker: google.maps.marker.AdvancedMarkerElement | null, id: string) => {
      markersVersionRef.current++;
      if (marker) {
        markersRef.current.set(id, marker);
      } else {
        markersRef.current.delete(id);
      }
    },
    [],
  );

  return (
    <>
      {restaurants.map((r) => {
        const color = TIER_COLORS[r.tier];
        const isSelected = r.id === selectedRestaurantId;
        const isDeepLinked = r.id === deepLinkedId && isSelected;
        return (
          <AdvancedMarker
            key={r.id}
            position={{ lat: r.lat, lng: r.lng }}
            ref={(marker) => setMarkerRef(marker, r.id)}
            onClick={() => onRestaurantClick(r)}
            zIndex={isSelected ? 1 : 0}
            anchorPoint={isDeepLinked ? undefined : AdvancedMarkerAnchorPoint.CENTER}
          >
            {isDeepLinked ? (
              <div style={{ position: 'relative', width: 40, height: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
                {/* Pulsing ring behind the pin */}
                <div
                  className="deep-link-ping"
                  style={{ position: 'absolute', top: 4, width: 32, height: 32, borderRadius: '50%', backgroundColor: color }}
                />
                {/* Custom teardrop pin */}
                <svg width="40" height="50" viewBox="0 0 40 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M20 0C9 0 0 9 0 20c0 15 20 30 20 30s20-15 20-30C40 9 31 0 20 0z"
                    fill={color}
                    stroke="#FFFFFF"
                    strokeWidth="3"
                  />
                  <circle cx="20" cy="19" r="7" fill="#FFFFFF" />
                </svg>
              </div>
            ) : (
              <TierDot color={color} selected={isSelected} />
            )}
          </AdvancedMarker>
        );
      })}
    </>
  );
}
