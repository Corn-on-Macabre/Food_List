import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BobbyPickBadge } from '../components/BobbyPickBadge';

describe('BobbyPickBadge', () => {
  it("renders with data-testid='bobby-pick-badge'", () => {
    render(<BobbyPickBadge />);
    expect(screen.getByTestId('bobby-pick-badge')).toBeInTheDocument();
  });

  it("displays \"Bobby's Pick\" text", () => {
    render(<BobbyPickBadge />);
    expect(screen.getByTestId('bobby-pick-badge')).toHaveTextContent("Bobby's Pick");
  });

  it('star icon has aria-hidden="true"', () => {
    render(<BobbyPickBadge />);
    const icon = screen.getByText('★');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });
});
