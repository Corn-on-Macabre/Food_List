import { describe, it, expect } from 'vitest';
import { isOpenNow, todayHours, metroTimezone } from './openNow';
import type { OpeningHours } from '../types/restaurant';

const t = (day: number, hour: number, minute = 0) => day * 1440 + hour * 60 + minute;

const normal: OpeningHours = {
  periods: [{ open: { day: 1, hour: 11, minute: 0 }, close: { day: 1, hour: 21, minute: 0 } }],
  weekdayDescriptions: [],
};
const overnight: OpeningHours = {
  // Friday 6pm – Saturday 2am
  periods: [{ open: { day: 5, hour: 18, minute: 0 }, close: { day: 6, hour: 2, minute: 0 } }],
  weekdayDescriptions: [],
};
const satWrap: OpeningHours = {
  // Saturday 8pm – Sunday 2am (wraps the week boundary)
  periods: [{ open: { day: 6, hour: 20, minute: 0 }, close: { day: 0, hour: 2, minute: 0 } }],
  weekdayDescriptions: [],
};
const always: OpeningHours = {
  periods: [{ open: { day: 0, hour: 0, minute: 0 } }],
  weekdayDescriptions: [],
};

describe('isOpenNow', () => {
  it('is open during a normal window', () => {
    expect(isOpenNow(normal, t(1, 12))).toBe(true);
  });
  it('is closed outside a normal window', () => {
    expect(isOpenNow(normal, t(1, 22))).toBe(false);
    expect(isOpenNow(normal, t(2, 12))).toBe(false);
  });
  it('handles overnight spans', () => {
    expect(isOpenNow(overnight, t(6, 1))).toBe(true);
    expect(isOpenNow(overnight, t(6, 3))).toBe(false);
  });
  it('handles the Saturday→Sunday week wrap', () => {
    expect(isOpenNow(satWrap, t(0, 1))).toBe(true);
    expect(isOpenNow(satWrap, t(0, 3))).toBe(false);
    expect(isOpenNow(satWrap, t(6, 21))).toBe(true);
  });
  it('treats a close-less period as open 24/7', () => {
    expect(isOpenNow(always, t(3, 4))).toBe(true);
  });
  it('is closed when hours are unknown', () => {
    expect(isOpenNow(undefined, t(3, 4))).toBe(false);
    expect(isOpenNow({ periods: [], weekdayDescriptions: [] }, t(3, 4))).toBe(false);
  });
});

describe('todayHours', () => {
  const week: OpeningHours = {
    periods: [],
    weekdayDescriptions: [
      'Monday: 11 AM–9 PM',
      'Tuesday: 11 AM–9 PM',
      'Wednesday: 11 AM–9 PM',
      'Thursday: 11 AM–9 PM',
      'Friday: 11 AM–10 PM',
      'Saturday: 12–10 PM',
      'Sunday: Closed',
    ],
  };
  it('maps a Sunday-indexed weekday to Monday-first descriptions', () => {
    // 2026-07-17 was a Friday; use a fixed UTC noon so every US timezone agrees on the weekday
    const friday = new Date('2026-07-17T19:00:00Z');
    expect(todayHours(week, 'America/Phoenix', friday)).toBe('Friday: 11 AM–10 PM');
  });
  it('returns null without descriptions', () => {
    expect(todayHours(undefined, 'America/Phoenix')).toBeNull();
  });
});

describe('metroTimezone', () => {
  it('resolves known metros and falls back to Phoenix', () => {
    expect(metroTimezone('dallas')).toBe('America/Chicago');
    expect(metroTimezone('paris')).toBe('Europe/Paris');
    expect(metroTimezone(undefined)).toBe('America/Phoenix');
    expect(metroTimezone('unknown-city')).toBe('America/Phoenix');
  });
});
