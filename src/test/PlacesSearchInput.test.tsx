import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock the usePlacesAutocomplete hook before importing the component
vi.mock('../hooks/usePlacesAutocomplete', () => ({
  usePlacesAutocomplete: vi.fn(),
}));

import { PlacesSearchInput } from '../components/PlacesSearchInput';
import { usePlacesAutocomplete } from '../hooks/usePlacesAutocomplete';

const MOCK_PREDICTIONS = [
  {
    place_id: 'abc123',
    description: 'Pho 43, Phoenix, AZ',
    structured_formatting: {
      main_text: 'Pho 43',
      secondary_text: 'Phoenix, AZ',
    },
  },
  {
    place_id: 'def456',
    description: "J&G Steakhouse, Scottsdale, AZ",
    structured_formatting: {
      main_text: "J&G Steakhouse",
      secondary_text: 'Scottsdale, AZ',
    },
  },
];

const mockUsePlacesAutocomplete = vi.mocked(usePlacesAutocomplete);

describe('PlacesSearchInput', () => {
  beforeEach(() => {
    mockUsePlacesAutocomplete.mockReturnValue({
      predictions: [],
      loading: false,
      error: null,
    });
  });

  it('renders search input with correct placeholder', () => {
    render(<PlacesSearchInput onPlaceSelect={vi.fn()} onManualAdd={vi.fn()} />);
    const input = screen.getByPlaceholderText(/search restaurant name/i);
    expect(input).toBeInTheDocument();
  });

  it('renders predictions dropdown when predictions exist', () => {
    mockUsePlacesAutocomplete.mockReturnValue({
      predictions: MOCK_PREDICTIONS as google.maps.places.AutocompletePrediction[],
      loading: false,
      error: null,
    });

    render(<PlacesSearchInput onPlaceSelect={vi.fn()} onManualAdd={vi.fn()} />);
    // Need some input to trigger showing the dropdown
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Pho' } });

    expect(screen.getByText('Pho 43')).toBeInTheDocument();
    expect(screen.getByText("J&G Steakhouse")).toBeInTheDocument();
  });

  it('calls onPlaceSelect with placeId when prediction is clicked', () => {
    mockUsePlacesAutocomplete.mockReturnValue({
      predictions: MOCK_PREDICTIONS as google.maps.places.AutocompletePrediction[],
      loading: false,
      error: null,
    });

    const onPlaceSelect = vi.fn();
    render(<PlacesSearchInput onPlaceSelect={onPlaceSelect} onManualAdd={vi.fn()} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Pho' } });

    fireEvent.click(screen.getByText('Pho 43'));
    expect(onPlaceSelect).toHaveBeenCalledWith('abc123');
  });

  it('calls onManualAdd when "Add Manually" is clicked', () => {
    mockUsePlacesAutocomplete.mockReturnValue({
      predictions: [],
      loading: false,
      error: 'Places API unavailable',
    });

    const onManualAdd = vi.fn();
    render(<PlacesSearchInput onPlaceSelect={vi.fn()} onManualAdd={onManualAdd} />);

    fireEvent.click(screen.getByRole('button', { name: /add manually/i }));
    expect(onManualAdd).toHaveBeenCalledTimes(1);
  });

  it('closes dropdown on Escape key', () => {
    mockUsePlacesAutocomplete.mockReturnValue({
      predictions: MOCK_PREDICTIONS as google.maps.places.AutocompletePrediction[],
      loading: false,
      error: null,
    });

    render(<PlacesSearchInput onPlaceSelect={vi.fn()} onManualAdd={vi.fn()} />);
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'Pho' } });
    expect(screen.getByText('Pho 43')).toBeInTheDocument();

    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByText('Pho 43')).not.toBeInTheDocument();
  });

  it('shows loading indicator when loading is true', () => {
    mockUsePlacesAutocomplete.mockReturnValue({
      predictions: [],
      loading: true,
      error: null,
    });

    render(<PlacesSearchInput onPlaceSelect={vi.fn()} onManualAdd={vi.fn()} />);
    // Loading indicator should be present
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows "Add Manually" immediately when Places API is unavailable', () => {
    mockUsePlacesAutocomplete.mockReturnValue({
      predictions: [],
      loading: false,
      error: 'Places API unavailable',
    });

    render(<PlacesSearchInput onPlaceSelect={vi.fn()} onManualAdd={vi.fn()} />);
    expect(screen.getByRole('button', { name: /add manually/i })).toBeInTheDocument();
  });
});
