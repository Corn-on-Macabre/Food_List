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
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurant}
        onTierChange={vi.fn()}
        onNotesChange={vi.fn()}
        onSourceChange={vi.fn()}
        onTagsChange={vi.fn()}
        onFeaturedChange={vi.fn()}
      />
    );
    expect(screen.getByTestId('session-restaurant-card')).toBeInTheDocument();
    expect(screen.getByText('Test Bistro')).toBeInTheDocument();
    expect(screen.getByText('French')).toBeInTheDocument();
    expect(screen.getByTestId('tier-badge')).toBeInTheDocument();
    expect(screen.getByTestId('tier-badge')).toHaveTextContent('Recommended');
  });

  it('clicking "Edit Tier" shows the select with three tier options', () => {
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurant}
        onTierChange={vi.fn()}
        onNotesChange={vi.fn()}
        onSourceChange={vi.fn()}
        onTagsChange={vi.fn()}
        onFeaturedChange={vi.fn()}
      />
    );
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
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurant}
        onTierChange={vi.fn()}
        onNotesChange={vi.fn()}
        onSourceChange={vi.fn()}
        onTagsChange={vi.fn()}
        onFeaturedChange={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /edit tier/i }));
    const select = screen.getByRole('combobox', { name: /select tier/i }) as HTMLSelectElement;
    expect(select.value).toBe('recommended');
  });

  it('selecting a new tier and clicking Apply calls onTierChange with correct args', () => {
    const onTierChange = vi.fn();
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurant}
        onTierChange={onTierChange}
        onNotesChange={vi.fn()}
        onSourceChange={vi.fn()}
        onTagsChange={vi.fn()}
        onFeaturedChange={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /edit tier/i }));
    const select = screen.getByRole('combobox', { name: /select tier/i });
    fireEvent.change(select, { target: { value: 'loved' } });
    fireEvent.click(screen.getByRole('button', { name: /apply tier change/i }));
    expect(onTierChange).toHaveBeenCalledOnce();
    expect(onTierChange).toHaveBeenCalledWith('test-resto', 'loved');
  });

  it('clicking Cancel collapses back to display state without calling onTierChange', () => {
    const onTierChange = vi.fn();
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurant}
        onTierChange={onTierChange}
        onNotesChange={vi.fn()}
        onSourceChange={vi.fn()}
        onTagsChange={vi.fn()}
        onFeaturedChange={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /edit tier/i }));
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /cancel tier change/i }));
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(onTierChange).not.toHaveBeenCalled();
  });

  it('applying the same tier calls onTierChange idempotently', () => {
    const onTierChange = vi.fn();
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurant}
        onTierChange={onTierChange}
        onNotesChange={vi.fn()}
        onSourceChange={vi.fn()}
        onTagsChange={vi.fn()}
        onFeaturedChange={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /edit tier/i }));
    // Do not change the select — keep same tier
    fireEvent.click(screen.getByRole('button', { name: /apply tier change/i }));
    expect(onTierChange).toHaveBeenCalledOnce();
    expect(onTierChange).toHaveBeenCalledWith('test-resto', 'recommended');
  });

  it('collapses back to display state after applying', () => {
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurant}
        onTierChange={vi.fn()}
        onNotesChange={vi.fn()}
        onSourceChange={vi.fn()}
        onTagsChange={vi.fn()}
        onFeaturedChange={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /edit tier/i }));
    fireEvent.click(screen.getByRole('button', { name: /apply tier change/i }));
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('Edit Tier button has minimum 44px touch target height (AC 10)', () => {
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurant}
        onTierChange={vi.fn()}
        onNotesChange={vi.fn()}
        onSourceChange={vi.fn()}
        onTagsChange={vi.fn()}
        onFeaturedChange={vi.fn()}
      />
    );
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
        onSourceChange={vi.fn()}
        onTagsChange={vi.fn()}
        onFeaturedChange={vi.fn()}
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
        onSourceChange={vi.fn()}
        onTagsChange={vi.fn()}
        onFeaturedChange={vi.fn()}
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
        onSourceChange={vi.fn()}
        onTagsChange={vi.fn()}
        onFeaturedChange={vi.fn()}
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
        onSourceChange={vi.fn()}
        onTagsChange={vi.fn()}
        onFeaturedChange={vi.fn()}
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
        onSourceChange={vi.fn()}
        onTagsChange={vi.fn()}
        onFeaturedChange={vi.fn()}
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
        onSourceChange={vi.fn()}
        onTagsChange={vi.fn()}
        onFeaturedChange={vi.fn()}
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
        onSourceChange={vi.fn()}
        onTagsChange={vi.fn()}
        onFeaturedChange={vi.fn()}
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
        onSourceChange={vi.fn()}
        onTagsChange={vi.fn()}
        onFeaturedChange={vi.fn()}
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
        onSourceChange={vi.fn()}
        onTagsChange={vi.fn()}
        onFeaturedChange={vi.fn()}
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
        onSourceChange={vi.fn()}
        onTagsChange={vi.fn()}
        onFeaturedChange={vi.fn()}
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
        onSourceChange={vi.fn()}
        onTagsChange={vi.fn()}
        onFeaturedChange={vi.fn()}
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
        onSourceChange={vi.fn()}
        onTagsChange={vi.fn()}
        onFeaturedChange={vi.fn()}
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
        onSourceChange={vi.fn()}
        onTagsChange={vi.fn()}
        onFeaturedChange={vi.fn()}
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

// ─── Source Attribution Tests (Story 4.5) ────────────────────────────────────

const mockRestaurantNoSource: Restaurant = {
  id: 'test-resto',
  name: 'Test Bistro',
  cuisine: 'French',
  tier: 'recommended',
  lat: 33.4484,
  lng: -112.074,
  googleMapsUrl: 'https://maps.google.com/?cid=1',
  dateAdded: '2026-04-04',
};

const mockRestaurantWithSource: Restaurant = {
  ...mockRestaurantNoSource,
  source: 'TikTok @phxfoodie',
};

describe('SessionRestaurantCard — source display (AC 3, 4)', () => {
  it('renders "Add Source" button and no source text when source is undefined', () => {
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurantNoSource}
        onTierChange={vi.fn()}
        onNotesChange={vi.fn()}
        onSourceChange={vi.fn()}
        onTagsChange={vi.fn()}
        onFeaturedChange={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /add source for test bistro/i })).toBeInTheDocument();
    expect(screen.queryByText(/TikTok/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /edit source for test bistro/i })).not.toBeInTheDocument();
  });

  it('renders source text and "Edit Source" button (not "Add Source") when source exists', () => {
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurantWithSource}
        onTierChange={vi.fn()}
        onNotesChange={vi.fn()}
        onSourceChange={vi.fn()}
        onTagsChange={vi.fn()}
        onFeaturedChange={vi.fn()}
      />
    );
    expect(screen.getByText('TikTok @phxfoodie')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit source for test bistro/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /add source for test bistro/i })).not.toBeInTheDocument();
  });
});

describe('SessionRestaurantCard — Add Source flow (AC 5, 6, 7, 16)', () => {
  it('clicking "Add Source" opens source input (empty) and disabled "Save" button', async () => {
    const user = userEvent.setup();
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurantNoSource}
        onTierChange={vi.fn()}
        onNotesChange={vi.fn()}
        onSourceChange={vi.fn()}
        onTagsChange={vi.fn()}
        onFeaturedChange={vi.fn()}
      />
    );
    await user.click(screen.getByRole('button', { name: /add source for test bistro/i }));
    const input = screen.getByTestId('source-input');
    expect(input).toBeInTheDocument();
    expect((input as HTMLInputElement).value).toBe('');
    expect(screen.getByTestId('save-source-btn')).toBeDisabled();
  });

  it('typing in source input enables "Save" button', async () => {
    const user = userEvent.setup();
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurantNoSource}
        onTierChange={vi.fn()}
        onNotesChange={vi.fn()}
        onSourceChange={vi.fn()}
        onTagsChange={vi.fn()}
        onFeaturedChange={vi.fn()}
      />
    );
    await user.click(screen.getByRole('button', { name: /add source for test bistro/i }));
    await user.type(screen.getByTestId('source-input'), 'TikTok @phxfoodie');
    expect(screen.getByTestId('save-source-btn')).not.toBeDisabled();
  });

  it('clicking "Save" calls onSourceChange with trimmed text and collapses editor', async () => {
    const user = userEvent.setup();
    const mockOnSourceChange = vi.fn();
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurantNoSource}
        onTierChange={vi.fn()}
        onNotesChange={vi.fn()}
        onSourceChange={mockOnSourceChange}
        onTagsChange={vi.fn()}
        onFeaturedChange={vi.fn()}
      />
    );
    await user.click(screen.getByRole('button', { name: /add source for test bistro/i }));
    await user.type(screen.getByTestId('source-input'), '  TikTok @phxfoodie  ');
    await user.click(screen.getByTestId('save-source-btn'));
    expect(mockOnSourceChange).toHaveBeenCalledWith('test-resto', 'TikTok @phxfoodie');
    expect(screen.queryByTestId('source-input')).not.toBeInTheDocument();
  });

  it('clicking "Cancel" collapses editor without calling onSourceChange', async () => {
    const user = userEvent.setup();
    const mockOnSourceChange = vi.fn();
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurantNoSource}
        onTierChange={vi.fn()}
        onNotesChange={vi.fn()}
        onSourceChange={mockOnSourceChange}
        onTagsChange={vi.fn()}
        onFeaturedChange={vi.fn()}
      />
    );
    await user.click(screen.getByRole('button', { name: /add source for test bistro/i }));
    await user.type(screen.getByTestId('source-input'), 'some draft text');
    await user.click(screen.getByTestId('cancel-source-btn'));
    expect(mockOnSourceChange).not.toHaveBeenCalled();
    expect(screen.queryByTestId('source-input')).not.toBeInTheDocument();
  });

  it('"Remove Source" button is NOT rendered when source is undefined (Add Source path)', async () => {
    const user = userEvent.setup();
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurantNoSource}
        onTierChange={vi.fn()}
        onNotesChange={vi.fn()}
        onSourceChange={vi.fn()}
        onTagsChange={vi.fn()}
        onFeaturedChange={vi.fn()}
      />
    );
    await user.click(screen.getByRole('button', { name: /add source for test bistro/i }));
    expect(screen.queryByTestId('remove-source-btn')).not.toBeInTheDocument();
  });

  it('source-input is present when source editor is open', async () => {
    const user = userEvent.setup();
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurantNoSource}
        onTierChange={vi.fn()}
        onNotesChange={vi.fn()}
        onSourceChange={vi.fn()}
        onTagsChange={vi.fn()}
        onFeaturedChange={vi.fn()}
      />
    );
    await user.click(screen.getByRole('button', { name: /add source for test bistro/i }));
    expect(screen.getByTestId('source-input')).toBeInTheDocument();
  });

  it('"Save" and "Cancel" source buttons have min-h-[44px] class (AC 16)', async () => {
    const user = userEvent.setup();
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurantNoSource}
        onTierChange={vi.fn()}
        onNotesChange={vi.fn()}
        onSourceChange={vi.fn()}
        onTagsChange={vi.fn()}
        onFeaturedChange={vi.fn()}
      />
    );
    await user.click(screen.getByRole('button', { name: /add source for test bistro/i }));
    expect(screen.getByTestId('save-source-btn').className).toContain('min-h-[44px]');
    expect(screen.getByTestId('cancel-source-btn').className).toContain('min-h-[44px]');
  });

  it('"Remove Source" button has min-h-[44px] class (AC 16, F7)', async () => {
    const user = userEvent.setup();
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurantWithSource}
        onTierChange={vi.fn()}
        onNotesChange={vi.fn()}
        onSourceChange={vi.fn()}
        onTagsChange={vi.fn()}
        onFeaturedChange={vi.fn()}
      />
    );
    await user.click(screen.getByRole('button', { name: /edit source for test bistro/i }));
    expect(screen.getByTestId('remove-source-btn').className).toContain('min-h-[44px]');
  });
});

describe('SessionRestaurantCard — Edit Source flow (AC 5, 6, 7)', () => {
  it('clicking "Edit Source" opens input pre-populated with existing source and shows "Remove Source"', async () => {
    const user = userEvent.setup();
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurantWithSource}
        onTierChange={vi.fn()}
        onNotesChange={vi.fn()}
        onSourceChange={vi.fn()}
        onTagsChange={vi.fn()}
        onFeaturedChange={vi.fn()}
      />
    );
    await user.click(screen.getByRole('button', { name: /edit source for test bistro/i }));
    const input = screen.getByTestId('source-input') as HTMLInputElement;
    expect(input.value).toBe('TikTok @phxfoodie');
    expect(screen.getByTestId('remove-source-btn')).toBeInTheDocument();
    expect(screen.getByTestId('save-source-btn')).not.toBeDisabled();
  });

  it('clicking "Remove Source" calls onSourceChange with empty string and collapses editor', async () => {
    const user = userEvent.setup();
    const mockOnSourceChange = vi.fn();
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurantWithSource}
        onTierChange={vi.fn()}
        onNotesChange={vi.fn()}
        onSourceChange={mockOnSourceChange}
        onTagsChange={vi.fn()}
        onFeaturedChange={vi.fn()}
      />
    );
    await user.click(screen.getByRole('button', { name: /edit source for test bistro/i }));
    await user.click(screen.getByTestId('remove-source-btn'));
    expect(mockOnSourceChange).toHaveBeenCalledWith('test-resto', '');
    expect(screen.queryByTestId('source-input')).not.toBeInTheDocument();
  });
});

describe('SessionRestaurantCard — source mutual exclusion (AC 17)', () => {
  it('opening source editor while tier editor is open closes tier editor', async () => {
    const user = userEvent.setup();
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurantNoSource}
        onTierChange={vi.fn()}
        onNotesChange={vi.fn()}
        onSourceChange={vi.fn()}
        onTagsChange={vi.fn()}
        onFeaturedChange={vi.fn()}
      />
    );
    await user.click(screen.getByRole('button', { name: /edit tier/i }));
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /add source for test bistro/i }));
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.getByTestId('source-input')).toBeInTheDocument();
  });

  it('opening source editor while notes editor is open closes notes editor', async () => {
    const user = userEvent.setup();
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurantNoSource}
        onTierChange={vi.fn()}
        onNotesChange={vi.fn()}
        onSourceChange={vi.fn()}
        onTagsChange={vi.fn()}
        onFeaturedChange={vi.fn()}
      />
    );
    await user.click(screen.getByRole('button', { name: /add note for test bistro/i }));
    expect(screen.getByTestId('note-textarea')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /add source for test bistro/i }));
    expect(screen.queryByTestId('note-textarea')).not.toBeInTheDocument();
    expect(screen.getByTestId('source-input')).toBeInTheDocument();
  });

  it('opening tier editor while source editor is open closes source editor', async () => {
    const user = userEvent.setup();
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurantNoSource}
        onTierChange={vi.fn()}
        onNotesChange={vi.fn()}
        onSourceChange={vi.fn()}
        onTagsChange={vi.fn()}
        onFeaturedChange={vi.fn()}
      />
    );
    await user.click(screen.getByRole('button', { name: /add source for test bistro/i }));
    expect(screen.getByTestId('source-input')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /edit tier/i }));
    expect(screen.queryByTestId('source-input')).not.toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('opening note editor while source editor is open closes source editor (F1)', async () => {
    const user = userEvent.setup();
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurantNoSource}
        onTierChange={vi.fn()}
        onNotesChange={vi.fn()}
        onSourceChange={vi.fn()}
        onTagsChange={vi.fn()}
        onFeaturedChange={vi.fn()}
      />
    );
    await user.click(screen.getByRole('button', { name: /add source for test bistro/i }));
    expect(screen.getByTestId('source-input')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /add note for test bistro/i }));
    expect(screen.queryByTestId('source-input')).not.toBeInTheDocument();
    expect(screen.getByTestId('note-textarea')).toBeInTheDocument();
  });
});

// ─── Tags Tests (Story 4.5) ──────────────────────────────────────────────────

const mockRestaurantNoTags: Restaurant = {
  id: 'test-resto',
  name: 'Test Bistro',
  cuisine: 'French',
  tier: 'recommended',
  lat: 33.4484,
  lng: -112.074,
  googleMapsUrl: 'https://maps.google.com/?cid=1',
  dateAdded: '2026-04-04',
};

const mockRestaurantWithTags: Restaurant = {
  ...mockRestaurantNoTags,
  tags: ['patio'],
};

describe('SessionRestaurantCard — tags display (AC 8, 9)', () => {
  it('renders all four suggested tags as inactive chips when restaurant.tags is undefined', () => {
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurantNoTags}
        onTierChange={vi.fn()}
        onNotesChange={vi.fn()}
        onSourceChange={vi.fn()}
        onTagsChange={vi.fn()}
        onFeaturedChange={vi.fn()}
      />
    );
    expect(screen.getByTestId('tag-chip-date-night')).toBeInTheDocument();
    expect(screen.getByTestId('tag-chip-quick-lunch')).toBeInTheDocument();
    expect(screen.getByTestId('tag-chip-patio')).toBeInTheDocument();
    expect(screen.getByTestId('tag-chip-kid-friendly')).toBeInTheDocument();
    // All should be inactive (aria-pressed=false)
    expect(screen.getByTestId('tag-chip-date-night')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('tag-chip-patio')).toHaveAttribute('aria-pressed', 'false');
  });

  it('renders active tag chip for tags in restaurant.tags', () => {
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurantWithTags}
        onTierChange={vi.fn()}
        onNotesChange={vi.fn()}
        onSourceChange={vi.fn()}
        onTagsChange={vi.fn()}
        onFeaturedChange={vi.fn()}
      />
    );
    expect(screen.getByTestId('tag-chip-patio')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('tag-chip-date-night')).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('SessionRestaurantCard — tag toggle (AC 10, 11)', () => {
  it('clicking an inactive suggested tag chip calls onTagsChange with updated array including that tag', async () => {
    const user = userEvent.setup();
    const mockOnTagsChange = vi.fn();
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurantNoTags}
        onTierChange={vi.fn()}
        onNotesChange={vi.fn()}
        onSourceChange={vi.fn()}
        onTagsChange={mockOnTagsChange}
      />
    );
    await user.click(screen.getByTestId('tag-chip-patio'));
    expect(mockOnTagsChange).toHaveBeenCalledWith('test-resto', ['patio']);
  });

  it('clicking an active suggested tag chip calls onTagsChange with updated array excluding that tag', async () => {
    const user = userEvent.setup();
    const mockOnTagsChange = vi.fn();
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurantWithTags}
        onTierChange={vi.fn()}
        onNotesChange={vi.fn()}
        onSourceChange={vi.fn()}
        onTagsChange={mockOnTagsChange}
      />
    );
    await user.click(screen.getByTestId('tag-chip-patio'));
    expect(mockOnTagsChange).toHaveBeenCalledWith('test-resto', []);
  });

  it('active tag chip returns to inactive after toggle', async () => {
    const user = userEvent.setup();
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurantWithTags}
        onTierChange={vi.fn()}
        onNotesChange={vi.fn()}
        onSourceChange={vi.fn()}
        onTagsChange={vi.fn()}
        onFeaturedChange={vi.fn()}
      />
    );
    expect(screen.getByTestId('tag-chip-patio')).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByTestId('tag-chip-patio'));
    expect(screen.getByTestId('tag-chip-patio')).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('SessionRestaurantCard — custom tag (AC 12)', () => {
  it('typing custom tag and clicking "Add" calls onTagsChange with custom tag included', async () => {
    const user = userEvent.setup();
    const mockOnTagsChange = vi.fn();
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurantNoTags}
        onTierChange={vi.fn()}
        onNotesChange={vi.fn()}
        onSourceChange={vi.fn()}
        onTagsChange={mockOnTagsChange}
      />
    );
    await user.type(screen.getByTestId('session-custom-tag-input'), 'brunch spot');
    await user.click(screen.getByTestId('session-add-custom-tag-btn'));
    expect(mockOnTagsChange).toHaveBeenCalledWith('test-resto', ['brunch spot']);
  });

  it('pressing Enter in custom tag input adds the custom tag', async () => {
    const user = userEvent.setup();
    const mockOnTagsChange = vi.fn();
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurantNoTags}
        onTierChange={vi.fn()}
        onNotesChange={vi.fn()}
        onSourceChange={vi.fn()}
        onTagsChange={mockOnTagsChange}
      />
    );
    await user.type(screen.getByTestId('session-custom-tag-input'), 'brunch spot{Enter}');
    expect(mockOnTagsChange).toHaveBeenCalledWith('test-resto', ['brunch spot']);
  });

  it('custom tag input clears after adding', async () => {
    const user = userEvent.setup();
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurantNoTags}
        onTierChange={vi.fn()}
        onNotesChange={vi.fn()}
        onSourceChange={vi.fn()}
        onTagsChange={vi.fn()}
        onFeaturedChange={vi.fn()}
      />
    );
    const input = screen.getByTestId('session-custom-tag-input') as HTMLInputElement;
    await user.type(input, 'brunch spot');
    await user.click(screen.getByTestId('session-add-custom-tag-btn'));
    expect(input.value).toBe('');
  });

  it('custom tag appears as active chip after adding', async () => {
    const user = userEvent.setup();
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurantNoTags}
        onTierChange={vi.fn()}
        onNotesChange={vi.fn()}
        onSourceChange={vi.fn()}
        onTagsChange={vi.fn()}
        onFeaturedChange={vi.fn()}
      />
    );
    await user.type(screen.getByTestId('session-custom-tag-input'), 'brunch spot');
    await user.click(screen.getByTestId('session-add-custom-tag-btn'));
    expect(screen.getByTestId('tag-chip-custom-brunch-spot')).toBeInTheDocument();
    expect(screen.getByTestId('tag-chip-custom-brunch-spot')).toHaveAttribute('aria-pressed', 'true');
  });

  it('session-custom-tag-input is always present', () => {
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurantNoTags}
        onTierChange={vi.fn()}
        onNotesChange={vi.fn()}
        onSourceChange={vi.fn()}
        onTagsChange={vi.fn()}
        onFeaturedChange={vi.fn()}
      />
    );
    expect(screen.getByTestId('session-custom-tag-input')).toBeInTheDocument();
  });

  it('tag-chip-date-night is always present', () => {
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurantNoTags}
        onTierChange={vi.fn()}
        onNotesChange={vi.fn()}
        onSourceChange={vi.fn()}
        onTagsChange={vi.fn()}
        onFeaturedChange={vi.fn()}
      />
    );
    expect(screen.getByTestId('tag-chip-date-night')).toBeInTheDocument();
  });
});

// ─── Bobby's Pick toggle (Story 4.6) ─────────────────────────────────────────

describe("SessionRestaurantCard — Bobby's Pick toggle", () => {
  const mockFeaturedRestaurant: Restaurant = {
    ...mockRestaurant,
    featured: true,
  };

  it("renders toggle button with data-testid='bobby-pick-toggle'", () => {
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurant}
        onTierChange={vi.fn()}
        onNotesChange={vi.fn()}
        onSourceChange={vi.fn()}
        onTagsChange={vi.fn()}
        onFeaturedChange={vi.fn()}
      />
    );
    expect(screen.getByTestId('bobby-pick-toggle')).toBeInTheDocument();
  });

  it("toggle has aria-pressed='false' when featured is undefined", () => {
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurant}
        onTierChange={vi.fn()}
        onNotesChange={vi.fn()}
        onSourceChange={vi.fn()}
        onTagsChange={vi.fn()}
        onFeaturedChange={vi.fn()}
      />
    );
    expect(screen.getByTestId('bobby-pick-toggle')).toHaveAttribute('aria-pressed', 'false');
  });

  it("toggle has aria-pressed='true' when featured is true", () => {
    render(
      <SessionRestaurantCard
        restaurant={mockFeaturedRestaurant}
        onTierChange={vi.fn()}
        onNotesChange={vi.fn()}
        onSourceChange={vi.fn()}
        onTagsChange={vi.fn()}
        onFeaturedChange={vi.fn()}
      />
    );
    expect(screen.getByTestId('bobby-pick-toggle')).toHaveAttribute('aria-pressed', 'true');
  });

  it("clicking toggle when inactive calls onFeaturedChange with (id, true)", () => {
    const onFeaturedChange = vi.fn();
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurant}
        onTierChange={vi.fn()}
        onNotesChange={vi.fn()}
        onSourceChange={vi.fn()}
        onTagsChange={vi.fn()}
        onFeaturedChange={onFeaturedChange}
      />
    );
    fireEvent.click(screen.getByTestId('bobby-pick-toggle'));
    expect(onFeaturedChange).toHaveBeenCalledWith('test-resto', true);
  });

  it("clicking toggle when active calls onFeaturedChange with (id, false)", () => {
    const onFeaturedChange = vi.fn();
    render(
      <SessionRestaurantCard
        restaurant={mockFeaturedRestaurant}
        onTierChange={vi.fn()}
        onNotesChange={vi.fn()}
        onSourceChange={vi.fn()}
        onTagsChange={vi.fn()}
        onFeaturedChange={onFeaturedChange}
      />
    );
    fireEvent.click(screen.getByTestId('bobby-pick-toggle'));
    expect(onFeaturedChange).toHaveBeenCalledWith('test-resto', false);
  });

  it("BobbyPickBadge is NOT rendered when featured is undefined", () => {
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurant}
        onTierChange={vi.fn()}
        onNotesChange={vi.fn()}
        onSourceChange={vi.fn()}
        onTagsChange={vi.fn()}
        onFeaturedChange={vi.fn()}
      />
    );
    expect(screen.queryByTestId('bobby-pick-badge')).toBeNull();
  });

  it("BobbyPickBadge IS rendered when featured is true", () => {
    render(
      <SessionRestaurantCard
        restaurant={mockFeaturedRestaurant}
        onTierChange={vi.fn()}
        onNotesChange={vi.fn()}
        onSourceChange={vi.fn()}
        onTagsChange={vi.fn()}
        onFeaturedChange={vi.fn()}
      />
    );
    expect(screen.getByTestId('bobby-pick-badge')).toBeInTheDocument();
  });

  it("toggle button has min-h-[44px] class for mobile touch target", () => {
    render(
      <SessionRestaurantCard
        restaurant={mockRestaurant}
        onTierChange={vi.fn()}
        onNotesChange={vi.fn()}
        onSourceChange={vi.fn()}
        onTagsChange={vi.fn()}
        onFeaturedChange={vi.fn()}
      />
    );
    expect(screen.getByTestId('bobby-pick-toggle')).toHaveClass('min-h-[44px]');
  });
});
