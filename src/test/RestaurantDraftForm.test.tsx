import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

  it('renders lat/lng as number inputs in manual mode (initialDraft null)', () => {
    renderForm(null);
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
