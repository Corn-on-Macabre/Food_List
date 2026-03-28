import { AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { TIER_COLORS } from '../constants/tierColors';
import type { Restaurant } from '../types';

interface RestaurantPinProps {
  restaurant: Restaurant;
}

export function RestaurantPin({ restaurant }: RestaurantPinProps) {
  const color = TIER_COLORS[restaurant.tier];
  return (
    <AdvancedMarker position={{ lat: restaurant.lat, lng: restaurant.lng }}>
      <Pin background={color} glyphColor="#FFFFFF" borderColor={color} />
    </AdvancedMarker>
  );
}
