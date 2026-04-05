import { useState } from 'react';
import type { PlaceDraft } from '../hooks/usePlaceDetails';
import type { Restaurant, Tier } from '../types';
import { generateSlugId } from '../utils/generateSlugId';

interface Props {
  initialDraft: PlaceDraft | null;
  onSave: (restaurant: Restaurant) => void;
  onCancel: () => void;
  existingIds?: string[];
}

interface FormFields {
  name: string;
  address: string;
  cuisine: string;
  tier: Tier | '';
  googleMapsUrl: string;
  notes: string;
  source: string;
  lat: string;
  lng: string;
}

interface FormErrors {
  name?: string;
  cuisine?: string;
  tier?: string;
  googleMapsUrl?: string;
  lat?: string;
  lng?: string;
}

const TIER_OPTIONS: { value: Tier; label: string }[] = [
  { value: 'loved', label: 'Loved' },
  { value: 'recommended', label: 'Recommended' },
  { value: 'on_my_radar', label: 'On My Radar' },
];

const LABEL_CLASS = 'block font-sans text-[11px] font-bold uppercase tracking-[0.1em] text-stone-400 mb-1';
const INPUT_CLASS =
  'w-full border border-[#E8E0D5] rounded-lg p-3 font-sans text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#FDE68A]';
const INPUT_ERROR_CLASS =
  'w-full border border-red-400 rounded-lg p-3 font-sans text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-red-300';
const ERROR_MSG_CLASS = 'text-red-600 text-xs font-sans mt-1';

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export function RestaurantDraftForm({ initialDraft, onSave, onCancel, existingIds = [] }: Props) {
  const isAutoFill = initialDraft !== null;

  const [fields, setFields] = useState<FormFields>({
    name: initialDraft?.name ?? '',
    address: initialDraft?.address ?? '',
    cuisine: initialDraft?.cuisine ?? '',
    tier: '',
    googleMapsUrl: initialDraft?.googleMapsUrl ?? '',
    notes: '',
    source: '',
    lat: initialDraft?.lat?.toString() ?? '',
    lng: initialDraft?.lng?.toString() ?? '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  function update(key: keyof FormFields, value: string) {
    setFields(prev => ({ ...prev, [key]: value }));
    // Clear error on edit
    if (key in errors) {
      setErrors(prev => ({ ...prev, [key]: undefined }));
    }
  }

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!fields.name.trim()) errs.name = 'Name is required';
    if (!fields.cuisine.trim()) errs.cuisine = 'Cuisine is required';
    if (!fields.tier) errs.tier = 'Tier is required';
    if (!fields.googleMapsUrl.trim()) errs.googleMapsUrl = 'Google Maps URL is required';
    if (!fields.lat || isNaN(Number(fields.lat))) errs.lat = 'Latitude is required';
    if (!fields.lng || isNaN(Number(fields.lng))) errs.lng = 'Longitude is required';
    return errs;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    // Generate unique slug
    let id = generateSlugId(fields.name);
    if (existingIds.includes(id)) {
      let counter = 2;
      while (existingIds.includes(`${id}-${counter}`)) counter++;
      id = `${id}-${counter}`;
    }

    const restaurant: Restaurant = {
      id,
      name: fields.name.trim(),
      tier: fields.tier as Tier,
      cuisine: fields.cuisine.trim(),
      lat: Number(fields.lat),
      lng: Number(fields.lng),
      googleMapsUrl: fields.googleMapsUrl.trim(),
      dateAdded: getToday(),
      ...(fields.notes.trim() ? { notes: fields.notes.trim() } : {}),
      ...(fields.source.trim() ? { source: fields.source.trim() } : {}),
    };

    onSave(restaurant);
  }

  const isTierSelected = fields.tier !== '';

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {/* Name */}
      <div>
        <label htmlFor="draft-name" className={LABEL_CLASS}>Name</label>
        <input
          id="draft-name"
          type="text"
          value={fields.name}
          onChange={e => update('name', e.target.value)}
          placeholder="Restaurant name"
          className={errors.name ? INPUT_ERROR_CLASS : INPUT_CLASS}
          aria-label="Name"
        />
        {errors.name && <p className={ERROR_MSG_CLASS}>{errors.name}</p>}
      </div>

      {/* Address (display context only) */}
      <div>
        <label htmlFor="draft-address" className={LABEL_CLASS}>Address</label>
        <input
          id="draft-address"
          type="text"
          value={fields.address}
          onChange={e => update('address', e.target.value)}
          placeholder="Street address"
          className={INPUT_CLASS}
          aria-label="Address"
        />
      </div>

      {/* Lat / Lng */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label htmlFor="draft-lat" className={LABEL_CLASS}>Latitude</label>
          {isAutoFill ? (
            <p
              className="font-sans text-sm text-stone-700 py-3 px-3 bg-stone-50 border border-[#E8E0D5] rounded-lg"
              data-testid="lat-display"
            >
              {initialDraft.lat}
            </p>
          ) : (
            <>
              <input
                id="draft-lat"
                type="number"
                step="any"
                value={fields.lat}
                onChange={e => update('lat', e.target.value)}
                placeholder="33.4484"
                className={errors.lat ? INPUT_ERROR_CLASS : INPUT_CLASS}
                aria-label="Latitude"
              />
              {errors.lat && <p className={ERROR_MSG_CLASS}>{errors.lat}</p>}
            </>
          )}
        </div>
        <div className="flex-1">
          <label htmlFor="draft-lng" className={LABEL_CLASS}>Longitude</label>
          {isAutoFill ? (
            <p
              className="font-sans text-sm text-stone-700 py-3 px-3 bg-stone-50 border border-[#E8E0D5] rounded-lg"
              data-testid="lng-display"
            >
              {initialDraft.lng}
            </p>
          ) : (
            <>
              <input
                id="draft-lng"
                type="number"
                step="any"
                value={fields.lng}
                onChange={e => update('lng', e.target.value)}
                placeholder="-112.0740"
                className={errors.lng ? INPUT_ERROR_CLASS : INPUT_CLASS}
                aria-label="Longitude"
              />
              {errors.lng && <p className={ERROR_MSG_CLASS}>{errors.lng}</p>}
            </>
          )}
        </div>
      </div>

      {/* Cuisine */}
      <div>
        <label htmlFor="draft-cuisine" className={LABEL_CLASS}>Cuisine</label>
        <input
          id="draft-cuisine"
          type="text"
          value={fields.cuisine}
          onChange={e => update('cuisine', e.target.value)}
          placeholder="e.g. Vietnamese, Mexican, Japanese"
          className={errors.cuisine ? INPUT_ERROR_CLASS : INPUT_CLASS}
          aria-label="Cuisine"
        />
        {errors.cuisine && <p className={ERROR_MSG_CLASS}>{errors.cuisine}</p>}
      </div>

      {/* Tier */}
      <div>
        <label htmlFor="draft-tier" className={LABEL_CLASS}>Tier</label>
        <select
          id="draft-tier"
          value={fields.tier}
          onChange={e => update('tier', e.target.value)}
          className={`${errors.tier ? INPUT_ERROR_CLASS : INPUT_CLASS} bg-white`}
          aria-label="Tier"
        >
          <option value="" disabled>— select tier —</option>
          {TIER_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {errors.tier && <p className={ERROR_MSG_CLASS}>{errors.tier}</p>}
      </div>

      {/* Google Maps URL */}
      <div>
        <label htmlFor="draft-maps-url" className={LABEL_CLASS}>Google Maps URL</label>
        <input
          id="draft-maps-url"
          type="url"
          value={fields.googleMapsUrl}
          onChange={e => update('googleMapsUrl', e.target.value)}
          placeholder="https://maps.google.com/..."
          className={errors.googleMapsUrl ? INPUT_ERROR_CLASS : INPUT_CLASS}
          aria-label="Google Maps URL"
        />
        {errors.googleMapsUrl && <p className={ERROR_MSG_CLASS}>{errors.googleMapsUrl}</p>}
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="draft-notes" className={LABEL_CLASS}>Notes</label>
        <textarea
          id="draft-notes"
          rows={3}
          value={fields.notes}
          onChange={e => update('notes', e.target.value)}
          placeholder="What makes this place special?"
          className={INPUT_CLASS}
          aria-label="Notes"
        />
      </div>

      {/* Source */}
      <div>
        <label htmlFor="draft-source" className={LABEL_CLASS}>Source</label>
        <input
          id="draft-source"
          type="text"
          value={fields.source}
          onChange={e => update('source', e.target.value)}
          placeholder="e.g. TikTok, friend Dave"
          className={INPUT_CLASS}
          aria-label="Source"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={!isTierSelected}
          className="flex-1 bg-[#D97706] hover:bg-[#B45309] text-white font-sans text-sm font-bold rounded-lg py-2.5 px-4 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Save Restaurant
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="border border-[#E8E0D5] rounded-lg px-3 py-1.5 font-sans text-sm font-bold text-stone-500 hover:bg-stone-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
