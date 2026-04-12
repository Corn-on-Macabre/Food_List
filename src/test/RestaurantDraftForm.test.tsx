import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RestaurantDraftForm } from '../components/RestaurantDraftForm';
import type { PlaceDraft } from '../hooks/usePlaceDetails';
import type { Restaurant } from '../types';

const MOCK_DRAFT: PlaceDraft = {
  name: 'Pho 43',
  address: '4300 N Central Ave, Phoenix, AZ 85012',
  lat: 33.48,
  lng: -112.07,
  priceLevel: 2,
  cuisine: 'Vietnamese',
  googleMapsUrl: 'https://maps.google.com/?cid=12345',
  placeId: 'ChIJabc123',
};

function renderForm(
  initialDraft: PlaceDraft | null = MOCK_DRAFT,
  onSave: (r: Restaurant) => void = vi.fn(),
  onCancel: () => void = vi.fn()
) {
  return render(
    <RestaurantDraftForm
      initialDraft={initialDraft}
      onSave={onSave}
      onCancel={onCancel}
    />
  );
}

describe('RestaurantDraftForm', () => {
  beforeEach(() => {
    // Use real timers; pin the date via mock
    vi.setSystemTime(new Date('2026-04-04'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders all fields including tier selector', () => {
    renderForm();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cuisine/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tier/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/google maps url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/source/i)).toBeInTheDocument();
  });

  it('Save button is disabled when tier is not selected', () => {
    renderForm();
    const saveBtn = screen.getByRole('button', { name: /save restaurant/i });
    expect(saveBtn).toBeDisabled();
  });

  it('Save button is enabled after tier is selected', () => {
    renderForm();
    const tierSelect = screen.getByLabelText(/tier/i);
    fireEvent.change(tierSelect, { target: { value: 'loved' } });
    const saveBtn = screen.getByRole('button', { name: /save restaurant/i });
    expect(saveBtn).not.toBeDisabled();
  });

  it('shows validation errors when required fields are empty on submit', () => {
    renderForm(null); // manual mode — all empty
    const saveBtn = screen.getByRole('button', { name: /save restaurant/i });
    // Select tier so the button is enabled
    fireEvent.change(screen.getByLabelText(/tier/i), { target: { value: 'loved' } });
    fireEvent.click(saveBtn);
    // Should show validation errors for required fields
    expect(screen.getAllByText(/required/i).length).toBeGreaterThan(0);
  });

  it('calls onSave with correct Restaurant shape on valid submit', () => {
    const onSave = vi.fn();
    renderForm(MOCK_DRAFT, onSave);

    // Select tier
    fireEvent.change(screen.getByLabelText(/tier/i), { target: { value: 'loved' } });
    fireEvent.click(screen.getByRole('button', { name: /save restaurant/i }));

    expect(onSave).toHaveBeenCalledTimes(1);
    const saved: Restaurant = onSave.mock.calls[0][0];
    expect(saved.name).toBe('Pho 43');
    expect(saved.tier).toBe('loved');
    expect(saved.cuisine).toBe('Vietnamese');
    expect(saved.googleMapsUrl).toBe('https://maps.google.com/?cid=12345');
    expect(saved.lat).toBe(33.48);
    expect(saved.lng).toBe(-112.07);
    expect(saved.dateAdded).toBe('2026-04-04');
    expect(typeof saved.id).toBe('string');
    expect(saved.id.length).toBeGreaterThan(0);
  });

  it('calls onCancel immediately when Cancel is clicked', () => {
    const onCancel = vi.fn();
    renderForm(MOCK_DRAFT, vi.fn(), onCancel);

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('pre-fills fields from initialDraft prop', () => {
    renderForm(MOCK_DRAFT);
    expect(screen.getByLabelText(/name/i)).toHaveValue('Pho 43');
    expect(screen.getByLabelText(/cuisine/i)).toHaveValue('Vietnamese');
    expect(screen.getByLabelText(/google maps url/i)).toHaveValue('https://maps.google.com/?cid=12345');
  });

  it('renders lat/lng as display text (non-editable) in auto-fill mode', () => {
    renderForm(MOCK_DRAFT);
    // In auto-fill mode, lat/lng should not be inputs
    const latInput = screen.queryByLabelText(/latitude/i);
    const lngInput = screen.queryByLabelText(/longitude/i);
    // They should be absent as inputs; coordinates appear as text
    expect(latInput).toBeNull();
    expect(lngInput).toBeNull();
    expect(screen.getByText('33.48')).toBeInTheDocument();
    expect(screen.getByText('-112.07')).toBeInTheDocument();
  });

  it('renders address autocomplete in manual mode (initialDraft null)', () => {
    renderForm(null);
    // Manual mode now shows AddressGeocodeInput with address autocomplete
    const addressInput = screen.getByRole('combobox', { name: /address/i });
    expect(addressInput).toBeInTheDocument();
    expect(addressInput).toHaveAttribute('placeholder', 'Type an address to auto-fill coordinates...');
    // Coordinate display shows "No address selected"
    expect(screen.getByText(/no address selected/i)).toBeInTheDocument();
    // "Edit coordinates manually" link is visible
    expect(screen.getByRole('button', { name: /edit coordinates manually/i })).toBeInTheDocument();
  });

  it('shows lat/lng number inputs when "Edit coordinates manually" is clicked', async () => {
    const user = userEvent.setup();
    renderForm(null);
    await user.click(screen.getByRole('button', { name: /edit coordinates manually/i }));
    const latInput = screen.getByLabelText(/latitude/i);
    const lngInput = screen.getByLabelText(/longitude/i);
    expect(latInput).toHaveAttribute('type', 'number');
    expect(lngInput).toHaveAttribute('type', 'number');
  });

  it('generates a slug id from the name', () => {
    const onSave = vi.fn();
    renderForm(MOCK_DRAFT, onSave);
    fireEvent.change(screen.getByLabelText(/tier/i), { target: { value: 'recommended' } });
    fireEvent.click(screen.getByRole('button', { name: /save restaurant/i }));

    const saved: Restaurant = onSave.mock.calls[0][0];
    expect(saved.id).toBe('pho-43');
  });
});

// ─── Tags at add-time (Story 4.5) ─────────────────────────────────────────────

describe('RestaurantDraftForm — tags field (AC 1, 2)', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date('2026-04-04'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders four suggested tag chips below Source field', () => {
    renderForm();
    expect(screen.getByTestId('draft-tag-chip-date-night')).toBeInTheDocument();
    expect(screen.getByTestId('draft-tag-chip-quick-lunch')).toBeInTheDocument();
    expect(screen.getByTestId('draft-tag-chip-patio')).toBeInTheDocument();
    expect(screen.getByTestId('draft-tag-chip-kid-friendly')).toBeInTheDocument();
  });

  it('clicking an inactive tag chip makes it active (aria-pressed true)', async () => {
    const user = userEvent.setup();
    renderForm();
    const chip = screen.getByTestId('draft-tag-chip-patio');
    expect(chip).toHaveAttribute('aria-pressed', 'false');
    await user.click(chip);
    expect(chip).toHaveAttribute('aria-pressed', 'true');
  });

  it('clicking an active tag chip makes it inactive (aria-pressed false)', async () => {
    const user = userEvent.setup();
    renderForm();
    const chip = screen.getByTestId('draft-tag-chip-patio');
    await user.click(chip); // activate
    expect(chip).toHaveAttribute('aria-pressed', 'true');
    await user.click(chip); // deactivate
    expect(chip).toHaveAttribute('aria-pressed', 'false');
  });

  it('typing into custom tag input and clicking "Add" adds the custom tag as an active chip', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByTestId('custom-tag-input'), 'brunch spot');
    await user.click(screen.getByTestId('add-custom-tag-btn'));
    // The custom tag doesn't get a suggested chip testid, but we can check via aria
    // It should appear as an active button in the tags section
    const chips = screen.getAllByRole('button', { name: /remove tag: brunch spot/i });
    expect(chips.length).toBeGreaterThan(0);
  });

  it('pressing Enter in custom tag input adds the custom tag', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByTestId('custom-tag-input'), 'brunch spot{Enter}');
    const chips = screen.getAllByRole('button', { name: /remove tag: brunch spot/i });
    expect(chips.length).toBeGreaterThan(0);
  });

  it('saved Restaurant includes tags array when tags are selected', () => {
    const onSave = vi.fn();
    renderForm(MOCK_DRAFT, onSave);
    fireEvent.click(screen.getByTestId('draft-tag-chip-patio'));
    fireEvent.change(screen.getByLabelText(/tier/i), { target: { value: 'loved' } });
    fireEvent.click(screen.getByRole('button', { name: /save restaurant/i }));
    const saved: Restaurant = onSave.mock.calls[0][0];
    expect(saved.tags).toEqual(['patio']);
  });

  it('saved Restaurant omits tags field when no tags selected', () => {
    const onSave = vi.fn();
    renderForm(MOCK_DRAFT, onSave);
    fireEvent.change(screen.getByLabelText(/tier/i), { target: { value: 'loved' } });
    fireEvent.click(screen.getByRole('button', { name: /save restaurant/i }));
    const saved: Restaurant = onSave.mock.calls[0][0];
    expect(saved.tags).toBeUndefined();
  });

  it('add-custom-tag-btn is disabled when custom tag input is empty (F4)', () => {
    renderForm();
    expect(screen.getByTestId('add-custom-tag-btn')).toBeDisabled();
  });

  it('adding the same custom tag twice does not create a duplicate chip (F3)', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByTestId('custom-tag-input'), 'brunch spot');
    await user.click(screen.getByTestId('add-custom-tag-btn'));
    // Try to add same tag again — input cleared after first add, so retype
    await user.type(screen.getByTestId('custom-tag-input'), 'brunch spot');
    await user.click(screen.getByTestId('add-custom-tag-btn'));
    const chips = screen.getAllByRole('button', { name: /remove tag: brunch spot/i });
    expect(chips).toHaveLength(1); // Only one chip, not two
  });

  it('source field still saves correctly (regression test)', () => {
    const onSave = vi.fn();
    renderForm(MOCK_DRAFT, onSave);
    fireEvent.change(screen.getByLabelText(/source/i), { target: { value: 'TikTok @phxfoodie' } });
    fireEvent.change(screen.getByLabelText(/tier/i), { target: { value: 'loved' } });
    fireEvent.click(screen.getByRole('button', { name: /save restaurant/i }));
    const saved: Restaurant = onSave.mock.calls[0][0];
    expect(saved.source).toBe('TikTok @phxfoodie');
  });
});
