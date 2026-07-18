import type { OpeningHours } from '../types/restaurant';
import { METRO_REGIONS, DEFAULT_METRO_ID } from '../constants/metros';

const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const WEEK_MINUTES = 7 * 1440;

export function metroTimezone(cityId: string | undefined): string {
  const metro = METRO_REGIONS.find((m) => m.id === (cityId ?? DEFAULT_METRO_ID));
  return metro?.timezone ?? 'America/Phoenix';
}

/** Minutes since Sunday 00:00 in the given IANA timezone. */
export function localNowMinutes(timeZone: string, date: Date = new Date()): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  return WEEKDAYS[parts.weekday] * 1440 + (parseInt(parts.hour, 10) % 24) * 60 + parseInt(parts.minute, 10);
}

/**
 * Whether the place is open at `nowMinutes` (week-relative local minutes).
 * Google Places periods: day 0 = Sunday; a single close-less period = open 24/7.
 * Handles overnight spans, including the Saturday→Sunday week wrap.
 */
export function isOpenNow(hours: OpeningHours | undefined, nowMinutes: number): boolean {
  const periods = hours?.periods;
  if (!periods?.length) return false;
  for (const p of periods) {
    if (!p.open) continue;
    if (!p.close) return true;
    const start = p.open.day * 1440 + (p.open.hour ?? 0) * 60 + (p.open.minute ?? 0);
    let end = p.close.day * 1440 + (p.close.hour ?? 0) * 60 + (p.close.minute ?? 0);
    if (end <= start) end += WEEK_MINUTES;
    if ((nowMinutes >= start && nowMinutes < end) || (nowMinutes + WEEK_MINUTES >= start && nowMinutes + WEEK_MINUTES < end)) {
      return true;
    }
  }
  return false;
}

/** Today's hours line from weekdayDescriptions (Google orders them Monday-first). */
export function todayHours(hours: OpeningHours | undefined, timeZone: string, date: Date = new Date()): string | null {
  const descriptions = hours?.weekdayDescriptions;
  if (!descriptions || descriptions.length !== 7) return null;
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(date);
  const sundayFirst = WEEKDAYS[weekday]; // 0 = Sunday
  const mondayFirst = (sundayFirst + 6) % 7;
  return descriptions[mondayFirst] ?? null;
}
