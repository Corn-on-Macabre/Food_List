import { useEffect, useRef, useCallback } from 'react';
import { AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { TIER_COLORS } from '../constants/tierColors';
import type { Restaurant } from '../types';

interface ClusteredPinsProps {
  restaurants: Restaurant[];
  onRestaurantClick: (restaurant: Restaurant) => void;
  selectedRestaurantId: string | null;
}

export function ClusteredPins({ restaurants, onRestaurantClick, selectedRestaurantId }: ClusteredPinsProps) {
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
        return (
          <AdvancedMarker
            key={r.id}
            position={{ lat: r.lat, lng: r.lng }}
            ref={(marker) => setMarkerRef(marker, r.id)}
            onClick={() => onRestaurantClick(r)}
            zIndex={isSelected ? 1 : 0}
          >
            <Pin
              background={color}
              glyphColor="#FFFFFF"
              borderColor={isSelected ? '#FFFFFF' : color}
              scale={isSelected ? 1.35 : 1}
            />
          </AdvancedMarker>
        );
      })}
    </>
  );
}
