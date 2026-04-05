import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { FilterBar } from './FilterBar';

// Default props that satisfy all required FilterBar props.
// userCoords: null suppresses the distance row so cuisine-only tests stay clean.
const baseProps = {
  cuisines: [] as string[],
  activeCuisine: null as string | null,
  onCuisineChange: vi.fn(),
  userCoords: null as { lat: number; lng: number } | null,
  geoDenied: false,
  activeDistance: null as number | null,
  onDistanceChange: vi.fn(),
  hasActiveFilters: false,
  onClearFilters: vi.fn(),
};

describe('FilterBar', () => {
  describe('renders All chip when cuisines is empty (AC 7)', () => {
    it('renders the All chip even with an empty cuisines array', () => {
      render(<FilterBar {...baseProps} />);
      expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    });

    it('renders no cuisine-specific chips when cuisines is empty', () => {
      render(<FilterBar {...baseProps} />);
      // Only the "All" button should be present (distance row hidden because userCoords=null)
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(1);
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
      // All + 3 cuisine chips (distance row hidden — userCoords=null)
      expect(buttons).toHaveLength(4);
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
      fireEvent.click(screen.getByRole('button', { name: 'All' }));
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
      const allChip = screen.getByRole('button', { name: 'All' });
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
      const allChip = screen.getByRole('button', { name: 'All' });
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
});
