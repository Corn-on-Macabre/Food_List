import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { FilterBar } from './FilterBar';

describe('FilterBar', () => {
  describe('renders All chip when cuisines is empty (AC 7)', () => {
    it('renders the All chip even with an empty cuisines array', () => {
      render(
        <FilterBar cuisines={[]} activeCuisine={null} onCuisineChange={() => {}} />,
      );
      expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    });

    it('renders no cuisine-specific chips when cuisines is empty', () => {
      render(
        <FilterBar cuisines={[]} activeCuisine={null} onCuisineChange={() => {}} />,
      );
      // Only the "All" button should be present
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(1);
    });
  });

  describe('renders one chip per cuisine plus All chip (AC 2)', () => {
    it('renders All chip plus one button per cuisine', () => {
      render(
        <FilterBar
          cuisines={['Vietnamese', 'Mexican', 'Japanese']}
          activeCuisine={null}
          onCuisineChange={() => {}}
        />,
      );
      const buttons = screen.getAllByRole('button');
      // All + 3 cuisine chips
      expect(buttons).toHaveLength(4);
    });

    it('renders each cuisine label as a button', () => {
      render(
        <FilterBar
          cuisines={['Vietnamese', 'Mexican']}
          activeCuisine={null}
          onCuisineChange={() => {}}
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
          cuisines={['Vietnamese', 'Mexican']}
          activeCuisine={null}
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
          cuisines={['Vietnamese']}
          activeCuisine="Vietnamese"
          onCuisineChange={() => {}}
        />,
      );
      const activeChip = screen.getByRole('button', { name: 'Vietnamese' });
      expect(activeChip.className).toContain('bg-amber-600');
    });

    it('inactive chip has white styling class', () => {
      render(
        <FilterBar
          cuisines={['Vietnamese', 'Mexican']}
          activeCuisine="Vietnamese"
          onCuisineChange={() => {}}
        />,
      );
      const inactiveChip = screen.getByRole('button', { name: 'Mexican' });
      expect(inactiveChip.className).toContain('bg-white');
    });

    it('All chip is active (amber) when activeCuisine is null', () => {
      render(
        <FilterBar cuisines={['Vietnamese']} activeCuisine={null} onCuisineChange={() => {}} />,
      );
      const allChip = screen.getByRole('button', { name: 'All' });
      expect(allChip.className).toContain('bg-amber-600');
    });

    it('All chip is inactive (white) when a cuisine is active', () => {
      render(
        <FilterBar
          cuisines={['Vietnamese']}
          activeCuisine="Vietnamese"
          onCuisineChange={() => {}}
        />,
      );
      const allChip = screen.getByRole('button', { name: 'All' });
      expect(allChip.className).toContain('bg-white');
    });

    it('active chip has aria-pressed="true"', () => {
      render(
        <FilterBar
          cuisines={['Vietnamese']}
          activeCuisine="Vietnamese"
          onCuisineChange={() => {}}
        />,
      );
      const activeChip = screen.getByRole('button', { name: 'Vietnamese' });
      expect(activeChip).toHaveAttribute('aria-pressed', 'true');
    });

    it('inactive chip has aria-pressed="false"', () => {
      render(
        <FilterBar
          cuisines={['Vietnamese', 'Mexican']}
          activeCuisine="Vietnamese"
          onCuisineChange={() => {}}
        />,
      );
      const inactiveChip = screen.getByRole('button', { name: 'Mexican' });
      expect(inactiveChip).toHaveAttribute('aria-pressed', 'false');
    });
  });
});
