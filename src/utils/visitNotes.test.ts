import { describe, it, expect } from 'vitest';
import { splitNotes, formatVisitDate } from './visitNotes';

describe('splitNotes', () => {
  it('returns the whole note when there are no visit lines', () => {
    expect(splitNotes('Great tacos. Cash only.')).toEqual({
      note: 'Great tacos. Cash only.',
      visits: [],
    });
  });

  it('separates dated visit lines from the base note', () => {
    const notes =
      'Great food, great people.\n[visited 2026-07-18] Had the zebra wings — amazing.\n[visited 2026-08-02] Taco pizza again.';
    expect(splitNotes(notes)).toEqual({
      note: 'Great food, great people.',
      visits: [
        { date: '2026-07-18', text: 'Had the zebra wings — amazing.' },
        { date: '2026-08-02', text: 'Taco pizza again.' },
      ],
    });
  });

  it('handles visit-only notes and empty input', () => {
    expect(splitNotes('[visited 2026-07-18] First trip.')).toEqual({
      note: '',
      visits: [{ date: '2026-07-18', text: 'First trip.' }],
    });
    expect(splitNotes(undefined)).toEqual({ note: '', visits: [] });
  });
});

describe('formatVisitDate', () => {
  it('formats without timezone drift', () => {
    expect(formatVisitDate('2026-07-18')).toBe('Jul 18, 2026');
    expect(formatVisitDate('2026-01-01')).toBe('Jan 1, 2026');
  });
});
