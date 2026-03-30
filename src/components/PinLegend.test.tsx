import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PinLegend } from './PinLegend';
import { TIER_COLORS } from '../constants/tierColors';

describe('PinLegend', () => {
  it('renders without crashing', () => {
    render(<PinLegend />);
    expect(screen.getByRole('region', { name: 'Map Legend' })).toBeInTheDocument();
  });

  it('displays all three tier labels', () => {
    render(<PinLegend />);
    expect(screen.getByText('Loved')).toBeInTheDocument();
    expect(screen.getByText('Recommended')).toBeInTheDocument();
    expect(screen.getByText('On My Radar')).toBeInTheDocument();
  });

  it('renders exactly three color swatches', () => {
    const { container } = render(<PinLegend />);
    const swatches = container.querySelectorAll('[data-testid^="tier-swatch-"]');
    expect(swatches).toHaveLength(3);
  });

  it('renders loved swatch with correct gold color', () => {
    const { container } = render(<PinLegend />);
    const swatch = container.querySelector('[data-testid="tier-swatch-loved"]');
    expect(swatch).toHaveStyle({ backgroundColor: TIER_COLORS.loved });
  });

  it('renders recommended swatch with correct blue color', () => {
    const { container } = render(<PinLegend />);
    const swatch = container.querySelector('[data-testid="tier-swatch-recommended"]');
    expect(swatch).toHaveStyle({ backgroundColor: TIER_COLORS.recommended });
  });

  it('renders on_my_radar swatch with correct green color', () => {
    const { container } = render(<PinLegend />);
    const swatch = container.querySelector('[data-testid="tier-swatch-on_my_radar"]');
    expect(swatch).toHaveStyle({ backgroundColor: TIER_COLORS.on_my_radar });
  });
});
