import { describe, it, expect } from 'vitest';
import { visitsByMonth, cuisineBreakdown, topRestaurants, staleLoved, formatDollars, formatMonth } from './visitStats';
import type { Restaurant, Visit } from '../types/restaurant';

function visit(overrides: Partial<Visit>): Visit {
  return {
    id: 'v1',
    restaurant_id: 'r1',
    restaurant_name: 'Resto One',
    visited_on: '2026-07-01',
    note: null,
    dishes: null,
    spend_cents: null,
    party_size: null,
    created_at: '2026-07-01T00:00:00Z',
    ...overrides,
  };
}

function restaurant(overrides: Partial<Restaurant>): Restaurant {
  return {
    id: 'r1',
    name: 'Resto One',
    tier: 'loved',
    cuisine: 'Mexican',
    city: 'phoenix',
    lat: 33.4,
    lng: -112.0,
    googleMapsUrl: 'https://maps.google.com/?q=x',
    dateAdded: '2024-01-01',
    ...overrides,
  };
}

describe('visitsByMonth', () => {
  it('returns empty for no visits', () => {
    expect(visitsByMonth([])).toEqual([]);
  });

  it('buckets by month across a year boundary, ascending', () => {
    const result = visitsByMonth([
      visit({ visited_on: '2026-01-05' }),
      visit({ visited_on: '2025-12-28', spend_cents: 5000 }),
      visit({ visited_on: '2026-01-20', spend_cents: 2500 }),
    ]);
    expect(result).toEqual([
      { month: '2025-12', count: 1, spendCents: 5000 },
      { month: '2026-01', count: 2, spendCents: 2500 },
    ]);
  });

  it('treats null spend as $0 while still counting the visit', () => {
    const [m] = visitsByMonth([visit({ spend_cents: null }), visit({ spend_cents: 1000 })]);
    expect(m.count).toBe(2);
    expect(m.spendCents).toBe(1000);
  });
});

describe('cuisineBreakdown', () => {
  it('joins cuisine via restaurant_id and sorts by count desc', () => {
    const restaurants = [
      restaurant({ id: 'r1', cuisine: 'Mexican' }),
      restaurant({ id: 'r2', cuisine: 'Thai' }),
    ];
    const result = cuisineBreakdown(
      [
        visit({ restaurant_id: 'r2' }),
        visit({ restaurant_id: 'r2', visited_on: '2026-07-02' }),
        visit({ restaurant_id: 'r1' }),
      ],
      restaurants,
    );
    expect(result.map((c) => c.cuisine)).toEqual(['Thai', 'Mexican']);
  });

  it("maps orphaned restaurant_ids to 'Unknown'", () => {
    const result = cuisineBreakdown([visit({ restaurant_id: 'deleted-place' })], []);
    expect(result).toEqual([{ cuisine: 'Unknown', count: 1, spendCents: 0 }]);
  });
});

describe('topRestaurants', () => {
  it('counts per restaurant, tracks latest visit, respects n', () => {
    const visits = [
      visit({ restaurant_id: 'r1', visited_on: '2026-01-01' }),
      visit({ restaurant_id: 'r1', visited_on: '2026-06-15', spend_cents: 3000 }),
      visit({ restaurant_id: 'r2', visited_on: '2026-03-01' }),
    ];
    const result = topRestaurants(visits, [restaurant({ id: 'r1', name: 'Top Spot' })], 1);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      restaurantId: 'r1',
      name: 'Top Spot',
      count: 2,
      lastVisit: '2026-06-15',
      spendCents: 3000,
    });
  });

  it('falls back to the snapshot name for orphaned rows', () => {
    const result = topRestaurants([visit({ restaurant_id: 'gone', restaurant_name: 'Closed Cafe' })], []);
    expect(result[0].name).toBe('Closed Cafe');
  });
});

describe('staleLoved', () => {
  const now = new Date('2026-07-20T12:00:00Z');

  it('includes loved restaurants never visited', () => {
    const result = staleLoved([], [restaurant({ id: 'r1', tier: 'loved' })], 6, now);
    expect(result).toHaveLength(1);
    expect(result[0].lastVisit).toBeNull();
  });

  it('excludes loved restaurants visited within the window', () => {
    const result = staleLoved(
      [visit({ restaurant_id: 'r1', visited_on: '2026-06-01' })],
      [restaurant({ id: 'r1', tier: 'loved' })],
      6,
      now,
    );
    expect(result).toEqual([]);
  });

  it('includes loved restaurants last visited before the cutoff, oldest first', () => {
    const result = staleLoved(
      [
        visit({ restaurant_id: 'r1', visited_on: '2025-11-01' }),
        visit({ restaurant_id: 'r2', visited_on: '2025-08-01' }),
      ],
      [restaurant({ id: 'r1' }), restaurant({ id: 'r2', name: 'Older' })],
      6,
      now,
    );
    expect(result.map((e) => e.restaurant.id)).toEqual(['r2', 'r1']);
  });

  it('ignores non-loved tiers entirely', () => {
    const result = staleLoved([], [restaurant({ tier: 'recommended' })], 6, now);
    expect(result).toEqual([]);
  });

  it('falls back to lastVisited when no structured visits exist', () => {
    const result = staleLoved([], [restaurant({ lastVisited: '2026-07-01' })], 6, now);
    expect(result).toEqual([]);
  });
});

describe('formatters', () => {
  it('formatDollars renders cents as USD', () => {
    expect(formatDollars(845000)).toBe('$8,450.00');
  });

  it('formatMonth renders YYYY-MM as short month + year', () => {
    expect(formatMonth('2026-07')).toBe('Jul 2026');
  });
});
