import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SessionRestaurantCard } from '../components/SessionRestaurantCard';
import type { Restaurant } from '../types';

const mockRestaurant: Restaurant = {
  id: 'test-resto',
  name: 'Test Bistro',
  cuisine: 'French',
  tier: 'recommended',
  lat: 33.4484,
  lng: -112.074,
  googleMapsUrl: 'https://maps.google.com/?cid=1',
  dateAdded: '2026-04-04',
};

describe('SessionRestaurantCard', () => {
  it('renders restaurant name, cuisine, and tier badge in display state', () => {
    render(<SessionRestaurantCard restaurant={mockRestaurant} onTierChange={vi.fn()} />);
    expect(screen.getByTestId('session-restaurant-card')).toBeInTheDocument();
    expect(screen.getByText('Test Bistro')).toBeInTheDocument();
    expect(screen.getByText('French')).toBeInTheDocument();
    expect(screen.getByTestId('tier-badge')).toBeInTheDocument();
    expect(screen.getByTestId('tier-badge')).toHaveTextContent('Recommended');
  });

  it('clicking "Edit Tier" shows the select with three tier options', () => {
    render(<SessionRestaurantCard restaurant={mockRestaurant} onTierChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /edit tier/i }));
    const select = screen.getByRole('combobox', { name: /select tier/i });
    expect(select).toBeInTheDocument();
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent('Loved');
    expect(options[1]).toHaveTextContent('Recommended');
    expect(options[2]).toHaveTextContent('On My Radar');
  });

  it('pre-selects the current tier in the select', () => {
    render(<SessionRestaurantCard restaurant={mockRestaurant} onTierChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /edit tier/i }));
    const select = screen.getByRole('combobox', { name: /select tier/i }) as HTMLSelectElement;
    expect(select.value).toBe('recommended');
  });

  it('selecting a new tier and clicking Apply calls onTierChange with correct args', () => {
    const onTierChange = vi.fn();
    render(<SessionRestaurantCard restaurant={mockRestaurant} onTierChange={onTierChange} />);
    fireEvent.click(screen.getByRole('button', { name: /edit tier/i }));
    const select = screen.getByRole('combobox', { name: /select tier/i });
    fireEvent.change(select, { target: { value: 'loved' } });
    fireEvent.click(screen.getByRole('button', { name: /apply tier change/i }));
    expect(onTierChange).toHaveBeenCalledOnce();
    expect(onTierChange).toHaveBeenCalledWith('test-resto', 'loved');
  });

  it('clicking Cancel collapses back to display state without calling onTierChange', () => {
    const onTierChange = vi.fn();
    render(<SessionRestaurantCard restaurant={mockRestaurant} onTierChange={onTierChange} />);
    fireEvent.click(screen.getByRole('button', { name: /edit tier/i }));
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /cancel tier change/i }));
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(onTierChange).not.toHaveBeenCalled();
  });

  it('applying the same tier calls onTierChange idempotently', () => {
    const onTierChange = vi.fn();
    render(<SessionRestaurantCard restaurant={mockRestaurant} onTierChange={onTierChange} />);
    fireEvent.click(screen.getByRole('button', { name: /edit tier/i }));
    // Do not change the select — keep same tier
    fireEvent.click(screen.getByRole('button', { name: /apply tier change/i }));
    expect(onTierChange).toHaveBeenCalledOnce();
    expect(onTierChange).toHaveBeenCalledWith('test-resto', 'recommended');
  });

  it('collapses back to display state after applying', () => {
    render(<SessionRestaurantCard restaurant={mockRestaurant} onTierChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /edit tier/i }));
    fireEvent.click(screen.getByRole('button', { name: /apply tier change/i }));
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('Edit Tier button has minimum 44px touch target height (AC 10)', () => {
    render(<SessionRestaurantCard restaurant={mockRestaurant} onTierChange={vi.fn()} />);
    const editBtn = screen.getByRole('button', { name: /edit tier/i });
    // Verify the min-h-[44px] Tailwind class is present (enforces 44px minimum height per AC 10)
    expect(editBtn.className).toContain('min-h-[44px]');
  });
});
