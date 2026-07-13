import { AdvancedMarker, AdvancedMarkerAnchorPoint } from '@vis.gl/react-google-maps';
import { TIER_COLORS } from '../constants/tierColors';
import type { Restaurant } from '../types';

interface TierDotProps {
  color: string;
  selected: boolean;
}

// DESIGN.md map-pin spec: tier-colored dot, white ring, soft shadow, hover
// scale, selected state grows and gains an ambient ring in the tier color.
export function TierDot({ color, selected }: TierDotProps) {
  return (
    <div
      data-testid="tier-dot"
      className={`rounded-full border-white transition-all duration-150 ease-out hover:scale-[1.2] motion-reduce:transition-none ${
        selected ? 'w-[18px] h-[18px] border-[3px]' : 'w-3.5 h-3.5 border-[2.5px]'
      }`}
      style={{
        backgroundColor: color,
        boxShadow: selected
          ? `0 2px 6px rgba(0,0,0,0.28), 0 0 0 3px ${color}4D`
          : '0 2px 6px rgba(0,0,0,0.28)',
      }}
    />
  );
}

interface RestaurantPinProps {
  restaurant: Restaurant;
}

export function RestaurantPin({ restaurant }: RestaurantPinProps) {
  return (
    <AdvancedMarker
      position={{ lat: restaurant.lat, lng: restaurant.lng }}
      anchorPoint={AdvancedMarkerAnchorPoint.CENTER}
    >
      <TierDot color={TIER_COLORS[restaurant.tier]} selected={false} />
    </AdvancedMarker>
  );
}
