import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterBar } from './FilterBar';

import type { Tier } from '../types/restaurant';

// Mock UserMenu to avoid AuthContext dependency in unit tests
vi.mock('./UserMenu', () => ({
  UserMenu: () => null,
}));

// Mock useAdminAuth — FilterBar only reads isAuthenticated for the admin link
vi.mock('../hooks', () => ({
  useAdminAuth: () => ({ isAuthenticated: false }),
}));

// Default props that satisfy all required FilterBar props.
// userCoords: null suppresses the distance row so cuisine-only tests stay clean.
const baseProps = {
  cuisines: [] as string[],
  activeCuisine: null as string | null,
  onCuisineChange: vi.fn(),
  activeTier: null as Tier | null,
  onTierChange: vi.fn(),
  userCoords: null as { lat: number; lng: number } | null,
  geoDenied: false,
  activeDistance: null as number | null,
  onDistanceChange: vi.fn(),
  searchTerm: null as string | null,
  onSearchChange: vi.fn(),
  hasActiveFilters: false,
  onClearFilters: vi.fn(),
};

describe('FilterBar', () => {
  describe('renders All chip when cuisines is empty (AC 7)', () => {
    it('renders the All chip even with an empty cuisines array', () => {
      render(<FilterBar {...baseProps} />);
      // Both cuisine row and tier row have an "All" chip
      const allButtons = screen.getAllByRole('button', { name: 'All' });
      expect(allButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('renders no cuisine-specific chips when cuisines is empty', () => {
      render(<FilterBar {...baseProps} />);
      // 1 cuisine "All" + 4 tier chips (All, Loved It, Worth Recommending, Want to Go)
      // distance row hidden because userCoords=null
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(5);
    });
  });

  describe('renders one chip per cuisine plus All chip (AC 2)', () => {
    it('renders All chip plus one button per cuisine', () => {
      render(
        <FilterBar
          {...baseProps}
          cuisines={['Vietnamese', 'Mexican', 'Japanese']}
        />,
      );
      const buttons = screen.getAllByRole('button');
      // 1 cuisine All + 3 cuisine chips + 4 tier chips (distance row hidden — userCoords=null)
      expect(buttons).toHaveLength(8);
    });

    it('renders each cuisine label as a button', () => {
      render(
        <FilterBar
          {...baseProps}
          cuisines={['Vietnamese', 'Mexican']}
        />,
      );
      expect(screen.getByRole('button', { name: 'Vietnamese' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Mexican' })).toBeInTheDocument();
    });
  });

  describe('clicking a cuisine chip calls onCuisineChange with that cuisine (AC 3)', () => {
    it('calls onCuisineChange with the cuisine string when an inactive cuisine chip is clicked', () => {
      const onCuisineChange = vi.fn();
      render(
        <FilterBar
          {...baseProps}
          cuisines={['Vietnamese', 'Mexican']}
          onCuisineChange={onCuisineChange}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Vietnamese' }));
      expect(onCuisineChange).toHaveBeenCalledWith('Vietnamese');
      expect(onCuisineChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('clicking active cuisine chip calls onCuisineChange with null (AC 4)', () => {
    it('calls onCuisineChange with null when the currently active cuisine chip is clicked', () => {
      const onCuisineChange = vi.fn();
      render(
        <FilterBar
          {...baseProps}
          cuisines={['Vietnamese', 'Mexican']}
          activeCuisine="Vietnamese"
          onCuisineChange={onCuisineChange}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Vietnamese' }));
      expect(onCuisineChange).toHaveBeenCalledWith(null);
      expect(onCuisineChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('clicking All chip calls onCuisineChange with null (AC 5)', () => {
    it('calls onCuisineChange with null when All chip is clicked', () => {
      const onCuisineChange = vi.fn();
      render(
        <FilterBar
          {...baseProps}
          cuisines={['Vietnamese', 'Mexican']}
          activeCuisine="Vietnamese"
          onCuisineChange={onCuisineChange}
        />,
      );
      // The cuisine "All" is the first "All" button in the DOM
      fireEvent.click(screen.getAllByRole('button', { name: 'All' })[0]);
      expect(onCuisineChange).toHaveBeenCalledWith(null);
      expect(onCuisineChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('active/inactive chip styling (AC 3/5 visual)', () => {
    it('active chip has amber styling class', () => {
      render(
        <FilterBar
          {...baseProps}
          cuisines={['Vietnamese']}
          activeCuisine="Vietnamese"
        />,
      );
      const activeChip = screen.getByRole('button', { name: 'Vietnamese' });
      expect(activeChip.className).toContain('bg-amber-700');
    });

    it('inactive chip has white styling class', () => {
      render(
        <FilterBar
          {...baseProps}
          cuisines={['Vietnamese', 'Mexican']}
          activeCuisine="Vietnamese"
        />,
      );
      const inactiveChip = screen.getByRole('button', { name: 'Mexican' });
      expect(inactiveChip.className).toContain('bg-white');
    });

    it('All chip is active (amber) when activeCuisine is null', () => {
      render(<FilterBar {...baseProps} cuisines={['Vietnamese']} />);
      // First "All" button is the cuisine row chip
      const allChip = screen.getAllByRole('button', { name: 'All' })[0];
      expect(allChip.className).toContain('bg-amber-700');
    });

    it('All chip is inactive (white) when a cuisine is active', () => {
      render(
        <FilterBar
          {...baseProps}
          cuisines={['Vietnamese']}
          activeCuisine="Vietnamese"
        />,
      );
      // First "All" button is the cuisine row chip
      const allChip = screen.getAllByRole('button', { name: 'All' })[0];
      expect(allChip.className).toContain('bg-white');
    });

    it('active chip has aria-pressed="true"', () => {
      render(
        <FilterBar
          {...baseProps}
          cuisines={['Vietnamese']}
          activeCuisine="Vietnamese"
        />,
      );
      const activeChip = screen.getByRole('button', { name: 'Vietnamese' });
      expect(activeChip).toHaveAttribute('aria-pressed', 'true');
    });

    it('inactive chip has aria-pressed="false"', () => {
      render(
        <FilterBar
          {...baseProps}
          cuisines={['Vietnamese', 'Mexican']}
          activeCuisine="Vietnamese"
        />,
      );
      const inactiveChip = screen.getByRole('button', { name: 'Mexican' });
      expect(inactiveChip).toHaveAttribute('aria-pressed', 'false');
    });
  });

  // --- Distance row tests (Story 3.2) ---

  const coordsPhoenix = { lat: 33.4484, lng: -112.074 };

  describe('distance row visibility (AC 1, 5, 6)', () => {
    it('distance row is hidden when geoDenied is true (AC 5)', () => {
      render(
        <FilterBar
          {...baseProps}
          cuisines={['Vietnamese']}
          userCoords={coordsPhoenix}
          geoDenied={true}
        />,
      );
      expect(screen.queryByRole('button', { name: 'Any' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '5 mi' })).not.toBeInTheDocument();
    });

    it('distance row is hidden when userCoords is null (AC 6)', () => {
      render(
        <FilterBar
          {...baseProps}
          cuisines={['Vietnamese']}
          userCoords={null}
          geoDenied={false}
        />,
      );
      expect(screen.queryByRole('button', { name: 'Any' })).not.toBeInTheDocument();
    });

    it('distance row renders Any + 4 preset chips when coords are available (AC 1)', () => {
      render(
        <FilterBar
          {...baseProps}
          cuisines={[]}
          userCoords={coordsPhoenix}
          geoDenied={false}
        />,
      );
      expect(screen.getByRole('button', { name: 'Any' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '5 mi' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '10 mi' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '20 mi' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '30 mi' })).toBeInTheDocument();
    });
  });

  describe('distance chip interactions (AC 2, 3, 4)', () => {
    it('clicking a distance chip calls onDistanceChange with its miles value (AC 2)', () => {
      const onDistanceChange = vi.fn();
      render(
        <FilterBar
          {...baseProps}
          cuisines={[]}
          userCoords={coordsPhoenix}
          onDistanceChange={onDistanceChange}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: '10 mi' }));
      expect(onDistanceChange).toHaveBeenCalledWith(10);
      expect(onDistanceChange).toHaveBeenCalledTimes(1);
    });

    it('clicking the active distance chip calls onDistanceChange with null — toggle off (AC 3)', () => {
      const onDistanceChange = vi.fn();
      render(
        <FilterBar
          {...baseProps}
          cuisines={[]}
          userCoords={coordsPhoenix}
          activeDistance={10}
          onDistanceChange={onDistanceChange}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: '10 mi' }));
      expect(onDistanceChange).toHaveBeenCalledWith(null);
    });

    it('clicking Any chip calls onDistanceChange with null (AC 4)', () => {
      const onDistanceChange = vi.fn();
      render(
        <FilterBar
          {...baseProps}
          cuisines={[]}
          userCoords={coordsPhoenix}
          activeDistance={5}
          onDistanceChange={onDistanceChange}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Any' }));
      expect(onDistanceChange).toHaveBeenCalledWith(null);
    });

    it('Any chip is aria-pressed=true when activeDistance is null (AC 4)', () => {
      render(
        <FilterBar
          {...baseProps}
          cuisines={[]}
          userCoords={coordsPhoenix}
          activeDistance={null}
        />,
      );
      expect(screen.getByRole('button', { name: 'Any' })).toHaveAttribute('aria-pressed', 'true');
    });

    it('10 mi chip has aria-pressed=true when activeDistance is 10 (AC 2)', () => {
      render(
        <FilterBar
          {...baseProps}
          cuisines={[]}
          userCoords={coordsPhoenix}
          activeDistance={10}
        />,
      );
      expect(screen.getByRole('button', { name: '10 mi' })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: 'Any' })).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('Clear Filters button (AC 2, 3, 4)', () => {
    it('Clear Filters button is not visible when no filters active', () => {
      render(<FilterBar {...baseProps} hasActiveFilters={false} />);
      expect(screen.queryByRole('button', { name: 'Clear all filters' })).not.toBeInTheDocument();
    });

    it('Clear Filters button is visible when hasActiveFilters is true', () => {
      render(<FilterBar {...baseProps} hasActiveFilters={true} />);
      expect(screen.getByRole('button', { name: 'Clear all filters' })).toBeInTheDocument();
    });

    it('clicking Clear Filters calls onClearFilters once', () => {
      const onClearFilters = vi.fn();
      render(<FilterBar {...baseProps} hasActiveFilters={true} onClearFilters={onClearFilters} />);
      fireEvent.click(screen.getByRole('button', { name: 'Clear all filters' }));
      expect(onClearFilters).toHaveBeenCalledTimes(1);
    });

    it("Clear Filters button has aria-label='Clear all filters'", () => {
      render(<FilterBar {...baseProps} hasActiveFilters={true} />);
      const btn = screen.getByRole('button', { name: 'Clear all filters' });
      expect(btn).toHaveAttribute('aria-label', 'Clear all filters');
    });
  });

  // --- Tier row tests (Story 3.4) ---

  describe('tier row renders all 4 chips (AC 1, 2)', () => {
    it('renders All, Loved It, Worth Recommending, Want to Go chips', () => {
      render(<FilterBar {...baseProps} />);
      expect(screen.getByRole('button', { name: 'Loved It' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Worth Recommending' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Want to Go' })).toBeInTheDocument();
      // "All" appears in both cuisine row and tier row
      const allButtons = screen.getAllByRole('button', { name: 'All' });
      expect(allButtons).toHaveLength(2);
    });

    it('tier "All" chip has aria-pressed="true" when activeTier is null (AC 3)', () => {
      render(<FilterBar {...baseProps} activeTier={null} />);
      // Tier All is the second "All" button in DOM
      const tierAllChip = screen.getAllByRole('button', { name: 'All' })[1];
      expect(tierAllChip).toHaveAttribute('aria-pressed', 'true');
    });

    it('"Loved It" chip has aria-pressed="false" when activeTier is null', () => {
      render(<FilterBar {...baseProps} activeTier={null} />);
      expect(screen.getByRole('button', { name: 'Loved It' })).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('tier chip click interactions (AC 4)', () => {
    it('clicking "Loved It" calls onTierChange("loved")', () => {
      const onTierChange = vi.fn();
      render(<FilterBar {...baseProps} onTierChange={onTierChange} />);
      fireEvent.click(screen.getByRole('button', { name: 'Loved It' }));
      expect(onTierChange).toHaveBeenCalledWith('loved');
      expect(onTierChange).toHaveBeenCalledTimes(1);
    });

    it('clicking active "Loved It" chip calls onTierChange(null) — toggle-off (AC 4)', () => {
      const onTierChange = vi.fn();
      render(<FilterBar {...baseProps} activeTier="loved" onTierChange={onTierChange} />);
      fireEvent.click(screen.getByRole('button', { name: 'Loved It' }));
      expect(onTierChange).toHaveBeenCalledWith(null);
      expect(onTierChange).toHaveBeenCalledTimes(1);
    });

    it('"Loved It" chip has aria-pressed="true" when activeTier is "loved"', () => {
      render(<FilterBar {...baseProps} activeTier="loved" />);
      expect(screen.getByRole('button', { name: 'Loved It' })).toHaveAttribute('aria-pressed', 'true');
    });

    it('clicking tier "All" chip calls onTierChange(null)', () => {
      const onTierChange = vi.fn();
      render(<FilterBar {...baseProps} activeTier="loved" onTierChange={onTierChange} />);
      // Tier All is the second "All" button in DOM
      fireEvent.click(screen.getAllByRole('button', { name: 'All' })[1]);
      expect(onTierChange).toHaveBeenCalledWith(null);
      expect(onTierChange).toHaveBeenCalledTimes(1);
    });
  });
});
