import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { RestaurantPin } from './RestaurantPin';
import { TIER_COLORS } from '../constants/tierColors';
import type { Restaurant } from '../types';

// Mock @vis.gl/react-google-maps to avoid needing a real Maps API in tests
vi.mock('@vis.gl/react-google-maps', () => ({
  AdvancedMarker: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="advanced-marker">{children}</div>
  ),
  Pin: ({
    background,
    glyphColor,
    borderColor,
  }: {
    background?: string;
    glyphColor?: string;
    borderColor?: string;
  }) => (
    <div
      data-testid="pin"
      data-background={background}
      data-glyph-color={glyphColor}
      data-border-color={borderColor}
    />
  ),
}));

const makeRestaurant = (tier: Restaurant['tier']): Restaurant => ({
  id: `test-${tier}`,
  name: `Test Restaurant (${tier})`,
  tier,
  cuisine: 'Test',
  lat: 33.4484,
  lng: -112.074,
  googleMapsUrl: 'https://maps.google.com/?q=test',
  dateAdded: '2026-01-01',
});

describe('RestaurantPin', () => {
  it('renders without crashing for loved tier', () => {
    const restaurant = makeRestaurant('loved');
    const { getByTestId } = render(<RestaurantPin restaurant={restaurant} />);
    expect(getByTestId('advanced-marker')).toBeInTheDocument();
    expect(getByTestId('pin')).toBeInTheDocument();
  });

  it('renders without crashing for recommended tier', () => {
    const restaurant = makeRestaurant('recommended');
    const { getByTestId } = render(<RestaurantPin restaurant={restaurant} />);
    expect(getByTestId('advanced-marker')).toBeInTheDocument();
    expect(getByTestId('pin')).toBeInTheDocument();
  });

  it('renders without crashing for on_my_radar tier', () => {
    const restaurant = makeRestaurant('on_my_radar');
    const { getByTestId } = render(<RestaurantPin restaurant={restaurant} />);
    expect(getByTestId('advanced-marker')).toBeInTheDocument();
    expect(getByTestId('pin')).toBeInTheDocument();
  });

  it('passes correct background and border color for loved', () => {
    const restaurant = makeRestaurant('loved');
    const { getByTestId } = render(<RestaurantPin restaurant={restaurant} />);
    const pin = getByTestId('pin');
    expect(pin.getAttribute('data-background')).toBe(TIER_COLORS.loved);
    expect(pin.getAttribute('data-background')).toBe('#F59E0B');
    expect(pin.getAttribute('data-border-color')).toBe(TIER_COLORS.loved);
  });

  it('passes correct background and border color for recommended', () => {
    const restaurant = makeRestaurant('recommended');
    const { getByTestId } = render(<RestaurantPin restaurant={restaurant} />);
    const pin = getByTestId('pin');
    expect(pin.getAttribute('data-background')).toBe(TIER_COLORS.recommended);
    expect(pin.getAttribute('data-background')).toBe('#3B82F6');
    expect(pin.getAttribute('data-border-color')).toBe(TIER_COLORS.recommended);
  });

  it('passes correct background and border color for on_my_radar', () => {
    const restaurant = makeRestaurant('on_my_radar');
    const { getByTestId } = render(<RestaurantPin restaurant={restaurant} />);
    const pin = getByTestId('pin');
    expect(pin.getAttribute('data-background')).toBe(TIER_COLORS.on_my_radar);
    expect(pin.getAttribute('data-background')).toBe('#10B981');
    expect(pin.getAttribute('data-border-color')).toBe(TIER_COLORS.on_my_radar);
  });
});
