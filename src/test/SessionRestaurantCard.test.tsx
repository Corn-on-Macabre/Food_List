import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

// ─── Notes Management Tests (Story 4.4) ───────────────────────────────────────

const mockRestaurantNoNotes: Restaurant = {
  id: 'test-resto',
  name: 'Test Bistro',
  cuisine: 'French',
  tier: 'recommended',
  lat: 33.4484,
  lng: -112.074,
  googleMapsUrl: 'https://maps.google.com/?cid=1',
  dateAdded: '2026-04-04',
};

const mockRestaurantWithNotes: Restaurant = {
  ...mockRestaurantNoNotes,
  notes: 'cash only',
};

describe('SessionRestaurantCard — notes display (AC 1, 4)', () => {
  it('renders "Add Note" button and no note text when notes is undefined', () => {
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurantNoNotes}
        onTierChange={vi.fn()}
        onNotesChange={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /add note for test bistro/i })).toBeInTheDocument();
    expect(screen.queryByText('cash only')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /edit note for test bistro/i })).not.toBeInTheDocument();
  });

  it('renders note text and "Edit Note" button (not "Add Note") when notes exist', () => {
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurantWithNotes}
        onTierChange={vi.fn()}
        onNotesChange={vi.fn()}
      />
    );
    expect(screen.getByText('cash only')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit note for test bistro/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /add note for test bistro/i })).not.toBeInTheDocument();
  });
});

describe('SessionRestaurantCard — Add Note flow (AC 2, 3, 8, 11)', () => {
  it('clicking "Add Note" opens textarea (empty) and disabled "Save Note" button', async () => {
    const user = userEvent.setup();
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurantNoNotes}
        onTierChange={vi.fn()}
        onNotesChange={vi.fn()}
      />
    );
    await user.click(screen.getByRole('button', { name: /add note for test bistro/i }));
    const textarea = screen.getByTestId('note-textarea');
    expect(textarea).toBeInTheDocument();
    expect((textarea as HTMLTextAreaElement).value).toBe('');
    const saveBtn = screen.getByTestId('save-note-btn');
    expect(saveBtn).toBeDisabled();
  });

  it('typing in textarea enables "Save Note" button', async () => {
    const user = userEvent.setup();
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurantNoNotes}
        onTierChange={vi.fn()}
        onNotesChange={vi.fn()}
      />
    );
    await user.click(screen.getByRole('button', { name: /add note for test bistro/i }));
    const textarea = screen.getByTestId('note-textarea');
    await user.type(textarea, 'try the bone marrow pho');
    expect(screen.getByTestId('save-note-btn')).not.toBeDisabled();
  });

  it('clicking "Save Note" calls onNotesChange with trimmed text and collapses editor', async () => {
    const user = userEvent.setup();
    const mockOnNotesChange = vi.fn();
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurantNoNotes}
        onTierChange={vi.fn()}
        onNotesChange={mockOnNotesChange}
      />
    );
    await user.click(screen.getByRole('button', { name: /add note for test bistro/i }));
    const textarea = screen.getByTestId('note-textarea');
    await user.type(textarea, '  try the bone marrow pho  ');
    await user.click(screen.getByTestId('save-note-btn'));
    expect(mockOnNotesChange).toHaveBeenCalledWith('test-resto', 'try the bone marrow pho');
    expect(screen.queryByTestId('note-textarea')).not.toBeInTheDocument();
  });

  it('clicking "Cancel" collapses editor without calling onNotesChange', async () => {
    const user = userEvent.setup();
    const mockOnNotesChange = vi.fn();
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurantNoNotes}
        onTierChange={vi.fn()}
        onNotesChange={mockOnNotesChange}
      />
    );
    await user.click(screen.getByRole('button', { name: /add note for test bistro/i }));
    await user.type(screen.getByTestId('note-textarea'), 'some draft text');
    await user.click(screen.getByTestId('cancel-note-btn'));
    expect(mockOnNotesChange).not.toHaveBeenCalled();
    expect(screen.queryByTestId('note-textarea')).not.toBeInTheDocument();
  });

  it('"Delete Note" button is NOT rendered when notes is undefined (Add Note path)', async () => {
    const user = userEvent.setup();
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurantNoNotes}
        onTierChange={vi.fn()}
        onNotesChange={vi.fn()}
      />
    );
    await user.click(screen.getByRole('button', { name: /add note for test bistro/i }));
    expect(screen.queryByTestId('delete-note-btn')).not.toBeInTheDocument();
  });

  it('note-textarea is present when editor is open', async () => {
    const user = userEvent.setup();
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurantNoNotes}
        onTierChange={vi.fn()}
        onNotesChange={vi.fn()}
      />
    );
    await user.click(screen.getByRole('button', { name: /add note for test bistro/i }));
    expect(screen.getByTestId('note-textarea')).toBeInTheDocument();
  });

  it('"Save Note" and "Cancel" buttons have min-h-[44px] class (AC 11)', async () => {
    const user = userEvent.setup();
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurantNoNotes}
        onTierChange={vi.fn()}
        onNotesChange={vi.fn()}
      />
    );
    await user.click(screen.getByRole('button', { name: /add note for test bistro/i }));
    expect(screen.getByTestId('save-note-btn').className).toContain('min-h-[44px]');
    expect(screen.getByTestId('cancel-note-btn').className).toContain('min-h-[44px]');
  });
});

describe('SessionRestaurantCard — Edit Note flow (AC 5, 6, 7)', () => {
  it('clicking "Edit Note" opens textarea pre-populated with existing note and shows "Delete Note"', async () => {
    const user = userEvent.setup();
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurantWithNotes}
        onTierChange={vi.fn()}
        onNotesChange={vi.fn()}
      />
    );
    await user.click(screen.getByRole('button', { name: /edit note for test bistro/i }));
    const textarea = screen.getByTestId('note-textarea') as HTMLTextAreaElement;
    expect(textarea.value).toBe('cash only');
    expect(screen.getByTestId('delete-note-btn')).toBeInTheDocument();
    expect(screen.getByTestId('save-note-btn')).not.toBeDisabled();
  });

  it('clicking "Delete Note" calls onNotesChange with empty string and collapses editor', async () => {
    const user = userEvent.setup();
    const mockOnNotesChange = vi.fn();
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurantWithNotes}
        onTierChange={vi.fn()}
        onNotesChange={mockOnNotesChange}
      />
    );
    await user.click(screen.getByRole('button', { name: /edit note for test bistro/i }));
    await user.click(screen.getByTestId('delete-note-btn'));
    expect(mockOnNotesChange).toHaveBeenCalledWith('test-resto', '');
    expect(screen.queryByTestId('note-textarea')).not.toBeInTheDocument();
  });
});

describe('SessionRestaurantCard — mutual exclusion (AC 2, 5)', () => {
  it('opening note editor while tier edit is open closes tier edit', async () => {
    const user = userEvent.setup();
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurantNoNotes}
        onTierChange={vi.fn()}
        onNotesChange={vi.fn()}
      />
    );
    // Open tier edit
    await user.click(screen.getByRole('button', { name: /edit tier/i }));
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    // Open note editor — tier edit should close
    await user.click(screen.getByRole('button', { name: /add note for test bistro/i }));
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.getByTestId('note-textarea')).toBeInTheDocument();
  });

  it('opening tier edit while note editor is open closes note editor', async () => {
    const user = userEvent.setup();
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurantNoNotes}
        onTierChange={vi.fn()}
        onNotesChange={vi.fn()}
      />
    );
    // Open note editor
    await user.click(screen.getByRole('button', { name: /add note for test bistro/i }));
    expect(screen.getByTestId('note-textarea')).toBeInTheDocument();
    // Open tier edit — note editor should close
    await user.click(screen.getByRole('button', { name: /edit tier/i }));
    expect(screen.queryByTestId('note-textarea')).not.toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });
});
