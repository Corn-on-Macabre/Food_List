import type { Restaurant, Visit } from '../types/restaurant';

export interface MonthStat {
  month: string; // YYYY-MM
  count: number;
  spendCents: number;
}

export interface CuisineStat {
  cuisine: string;
  count: number;
  spendCents: number;
}

export interface RestaurantStat {
  restaurantId: string;
  name: string;
  count: number;
  lastVisit: string; // YYYY-MM-DD
  spendCents: number;
}

export interface StaleLovedEntry {
  restaurant: Restaurant;
  lastVisit: string | null; // null = never logged
}

/** Visits grouped by calendar month, ascending. Null spends count as $0. */
export function visitsByMonth(visits: Visit[]): MonthStat[] {
  const buckets = new Map<string, MonthStat>();
  for (const v of visits) {
    const month = v.visited_on.slice(0, 7);
    const b = buckets.get(month) ?? { month, count: 0, spendCents: 0 };
    b.count += 1;
    b.spendCents += v.spend_cents ?? 0;
    buckets.set(month, b);
  }
  return [...buckets.values()].sort((a, b) => a.month.localeCompare(b.month));
}

/** Visit counts per cuisine, joined via restaurant_id ('Unknown' for orphans). */
export function cuisineBreakdown(visits: Visit[], restaurants: Restaurant[]): CuisineStat[] {
  const cuisineById = new Map(restaurants.map((r) => [r.id, r.cuisine]));
  const buckets = new Map<string, CuisineStat>();
  for (const v of visits) {
    const cuisine = cuisineById.get(v.restaurant_id) ?? 'Unknown';
    const b = buckets.get(cuisine) ?? { cuisine, count: 0, spendCents: 0 };
    b.count += 1;
    b.spendCents += v.spend_cents ?? 0;
    buckets.set(cuisine, b);
  }
  return [...buckets.values()].sort((a, b) => b.count - a.count || a.cuisine.localeCompare(b.cuisine));
}

/** Most-visited restaurants, count desc then most recent first. */
export function topRestaurants(visits: Visit[], restaurants: Restaurant[], n = 10): RestaurantStat[] {
  const nameById = new Map(restaurants.map((r) => [r.id, r.name]));
  const buckets = new Map<string, RestaurantStat>();
  for (const v of visits) {
    const b = buckets.get(v.restaurant_id) ?? {
      restaurantId: v.restaurant_id,
      name: nameById.get(v.restaurant_id) ?? v.restaurant_name ?? v.restaurant_id,
      count: 0,
      lastVisit: v.visited_on,
      spendCents: 0,
    };
    b.count += 1;
    b.spendCents += v.spend_cents ?? 0;
    if (v.visited_on > b.lastVisit) b.lastVisit = v.visited_on;
    buckets.set(v.restaurant_id, b);
  }
  return [...buckets.values()]
    .sort((a, b) => b.count - a.count || b.lastVisit.localeCompare(a.lastVisit))
    .slice(0, n);
}

/** Loved restaurants not visited in the last `months` months (or ever), oldest first. */
export function staleLoved(
  visits: Visit[],
  restaurants: Restaurant[],
  months = 6,
  now: Date = new Date(),
): StaleLovedEntry[] {
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - months);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const lastById = new Map<string, string>();
  for (const v of visits) {
    const prev = lastById.get(v.restaurant_id);
    if (!prev || v.visited_on > prev) lastById.set(v.restaurant_id, v.visited_on);
  }

  return restaurants
    .filter((r) => r.tier === 'loved')
    .map((r) => ({ restaurant: r, lastVisit: lastById.get(r.id) ?? r.lastVisited ?? null }))
    .filter((e) => e.lastVisit === null || e.lastVisit < cutoffStr)
    .sort((a, b) => (a.lastVisit ?? '').localeCompare(b.lastVisit ?? ''));
}

export function formatDollars(cents: number): string {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

/** 'YYYY-MM' → 'Jul 2026' */
export function formatMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}
