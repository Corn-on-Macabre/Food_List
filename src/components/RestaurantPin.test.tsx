import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { RestaurantPin, TierDot } from './RestaurantPin';
import { TIER_COLORS } from '../constants/tierColors';
import type { Restaurant } from '../types';

// Mock @vis.gl/react-google-maps to avoid needing a real Maps API in tests
vi.mock('@vis.gl/react-google-maps', () => ({
  AdvancedMarker: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="advanced-marker">{children}</div>
  ),
  AdvancedMarkerAnchorPoint: { CENTER: ['50%', '50%'] },
}));

const makeRestaurant = (tier: Restaurant['tier']): Restaurant => ({
  id: `test-${tier}`,
  name: `Test Restaurant (${tier})`,
  tier,
  cuisine: 'Test',
  lat: 33.4484,
  lng: -112.074,
  googleMapsUrl: 'https://maps.google.com/?q=test',
  city: 'phoenix',
  dateAdded: '2026-01-01',
});

describe('RestaurantPin', () => {
  it.each(['loved', 'recommended', 'on_my_radar'] as const)(
    'renders without crashing for %s tier',
    (tier) => {
      const restaurant = makeRestaurant(tier);
      const { getByTestId } = render(<RestaurantPin restaurant={restaurant} />);
      expect(getByTestId('advanced-marker')).toBeInTheDocument();
      expect(getByTestId('tier-dot')).toBeInTheDocument();
    },
  );

  it.each(['loved', 'recommended', 'on_my_radar'] as const)(
    'dot uses the fixed tier color for %s',
    (tier) => {
      const restaurant = makeRestaurant(tier);
      const { getByTestId } = render(<RestaurantPin restaurant={restaurant} />);
      expect(getByTestId('tier-dot')).toHaveStyle({ backgroundColor: TIER_COLORS[tier] });
    },
  );
});

describe('TierDot', () => {
  it('grows and gains an ambient ring when selected', () => {
    const { getByTestId } = render(<TierDot color={TIER_COLORS.loved} selected />);
    const dot = getByTestId('tier-dot');
    expect(dot.className).toContain('w-[18px]');
    expect(dot.style.boxShadow).toContain('0 0 0 3px');
  });

  it('renders the small default dot when not selected', () => {
    const { getByTestId } = render(<TierDot color={TIER_COLORS.loved} selected={false} />);
    const dot = getByTestId('tier-dot');
    expect(dot.className).toContain('w-3.5');
    expect(dot.style.boxShadow).not.toContain('0 0 0 3px');
  });
});
