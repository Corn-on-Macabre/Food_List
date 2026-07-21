import { describe, it, expect } from 'vitest';
import { filtersToSearchParams, filtersFromSearchParams } from './filterParams';
import type { FilterState } from '../types/restaurant';

const base: FilterState = {
  city: 'phoenix',
  cuisine: null,
  tier: null,
  maxDistance: null,
  searchTerm: null,
  openNow: false,
  tags: [],
  recognized: false,
};

describe('filtersToSearchParams', () => {
  it('returns empty string for default filters', () => {
    expect(filtersToSearchParams(base)).toBe('');
  });

  it('serializes each active field', () => {
    expect(filtersToSearchParams({ ...base, cuisine: 'Mexican' })).toBe('?cuisine=Mexican');
    expect(filtersToSearchParams({ ...base, tier: 'loved' })).toBe('?tier=loved');
    expect(filtersToSearchParams({ ...base, searchTerm: 'pho' })).toBe('?q=pho');
    expect(filtersToSearchParams({ ...base, openNow: true })).toBe('?open=1');
    expect(filtersToSearchParams({ ...base, recognized: true })).toBe('?rec=1');
    expect(filtersToSearchParams({ ...base, tags: ['patio'] })).toBe('?tags=patio');
  });

  it('never serializes maxDistance (geo-conditional, would no-op for recipients)', () => {
    expect(filtersToSearchParams({ ...base, maxDistance: 10 })).toBe('');
  });

  it('never serializes city (carried by the path)', () => {
    expect(filtersToSearchParams({ ...base, city: 'dallas' })).toBe('');
  });

  it('comma-joins multiple tags', () => {
    const s = filtersToSearchParams({ ...base, tags: ['date night', 'patio'] });
    expect(new URLSearchParams(s).get('tags')).toBe('date night,patio');
  });
});

describe('filtersFromSearchParams', () => {
  it('returns base unchanged for an empty query string', () => {
    expect(filtersFromSearchParams('', base)).toEqual(base);
  });

  it('preserves base city and maxDistance', () => {
    const parsed = filtersFromSearchParams('?tier=loved', { ...base, city: 'dallas' });
    expect(parsed.city).toBe('dallas');
    expect(parsed.maxDistance).toBeNull();
  });

  it('parses all fields', () => {
    const parsed = filtersFromSearchParams(
      '?cuisine=Mexican&tier=on_my_radar&q=taco&open=1&rec=1&tags=patio',
      base,
    );
    expect(parsed).toEqual({
      ...base,
      cuisine: 'Mexican',
      tier: 'on_my_radar',
      searchTerm: 'taco',
      openNow: true,
      recognized: true,
      tags: ['patio'],
    });
  });

  it('drops an invalid tier', () => {
    expect(filtersFromSearchParams('?tier=amazing', base).tier).toBeNull();
  });

  it('drops unknown tags, keeps valid ones', () => {
    const parsed = filtersFromSearchParams('?tags=patio,not-a-tag,date%20night', base);
    expect(parsed.tags).toEqual(['patio', 'date night']);
  });

  it('round-trips tags with spaces', () => {
    const filters = { ...base, tags: ['date night', 'kid friendly'] };
    const parsed = filtersFromSearchParams(filtersToSearchParams(filters), base);
    expect(parsed.tags).toEqual(['date night', 'kid friendly']);
  });

  it('round-trips a fully loaded filter state', () => {
    const filters: FilterState = {
      ...base,
      cuisine: 'Vietnamese',
      tier: 'recommended',
      searchTerm: 'pho & more',
      openNow: true,
      recognized: true,
      tags: ['must-try', 'late night'],
    };
    expect(filtersFromSearchParams(filtersToSearchParams(filters), base)).toEqual(filters);
  });
});
