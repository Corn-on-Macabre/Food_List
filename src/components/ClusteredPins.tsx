import { useEffect, useRef, useCallback } from 'react';
import { AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { TIER_COLORS } from '../constants/tierColors';
import type { Restaurant } from '../types';

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

  // Initialize clusterer once the map is ready
  useEffect(() => {
    if (!map) return;
    clustererRef.current = new MarkerClusterer({ map });
    return () => {
      clustererRef.current?.clearMarkers();
      clustererRef.current = null;
    };
  }, [map]);

  // Re-sync clusterer whenever the markers map changes
  useEffect(() => {
    if (!clustererRef.current) return;
    clustererRef.current.clearMarkers();
    clustererRef.current.addMarkers(Array.from(markersRef.current.values()));
  });

  const setMarkerRef = useCallback(
    (marker: google.maps.marker.AdvancedMarkerElement | null, id: string) => {
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
              <Pin
                background={color}
                glyphColor="#FFFFFF"
                borderColor={isSelected ? '#FFFFFF' : color}
                scale={isSelected ? 1.35 : 1}
              />
            )}
          </AdvancedMarker>
        );
      })}
    </>
  );
}
