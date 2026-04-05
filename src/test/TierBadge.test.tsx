import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TierBadge } from '../components/TierBadge';
import { TIER_COLORS } from '../constants/tierColors';

describe('TierBadge', () => {
  it('renders "Loved" label for loved tier', () => {
    render(<TierBadge tier="loved" />);
    expect(screen.getByTestId('tier-badge')).toHaveTextContent('Loved');
  });

  it('renders "Recommended" label for recommended tier', () => {
    render(<TierBadge tier="recommended" />);
    expect(screen.getByTestId('tier-badge')).toHaveTextContent('Recommended');
  });

  it('renders "On My Radar" label for on_my_radar tier', () => {
    render(<TierBadge tier="on_my_radar" />);
    expect(screen.getByTestId('tier-badge')).toHaveTextContent('On My Radar');
  });

  it('applies gold background color for loved tier', () => {
    render(<TierBadge tier="loved" />);
    const badge = screen.getByTestId('tier-badge');
    expect(badge).toHaveStyle({ backgroundColor: TIER_COLORS.loved });
  });

  it('applies blue background color for recommended tier', () => {
    render(<TierBadge tier="recommended" />);
    const badge = screen.getByTestId('tier-badge');
    expect(badge).toHaveStyle({ backgroundColor: TIER_COLORS.recommended });
  });

  it('applies green background color for on_my_radar tier', () => {
    render(<TierBadge tier="on_my_radar" />);
    const badge = screen.getByTestId('tier-badge');
    expect(badge).toHaveStyle({ backgroundColor: TIER_COLORS.on_my_radar });
  });

  it('has data-testid="tier-badge" attribute', () => {
    render(<TierBadge tier="loved" />);
    expect(screen.getByTestId('tier-badge')).toBeInTheDocument();
  });
});
