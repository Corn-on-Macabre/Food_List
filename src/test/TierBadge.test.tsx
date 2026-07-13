import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TierBadge } from '../components/TierBadge';
import { TIER_BADGE_CLASSES } from '../components/styles';

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

  it('applies gold tint classes for loved tier', () => {
    render(<TierBadge tier="loved" />);
    const badge = screen.getByTestId('tier-badge');
    expect(badge.className).toContain(TIER_BADGE_CLASSES.loved);
  });

  it('applies blue tint classes for recommended tier', () => {
    render(<TierBadge tier="recommended" />);
    const badge = screen.getByTestId('tier-badge');
    expect(badge.className).toContain(TIER_BADGE_CLASSES.recommended);
  });

  it('applies green tint classes for on_my_radar tier', () => {
    render(<TierBadge tier="on_my_radar" />);
    const badge = screen.getByTestId('tier-badge');
    expect(badge.className).toContain(TIER_BADGE_CLASSES.on_my_radar);
  });

  it('has data-testid="tier-badge" attribute', () => {
    render(<TierBadge tier="loved" />);
    expect(screen.getByTestId('tier-badge')).toBeInTheDocument();
  });
});
