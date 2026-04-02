import { describe, it, expect } from 'vitest';
import { haversineDistance, DISTANCE_OPTIONS } from './distance';

describe('haversineDistance', () => {
  it('same point returns 0 miles', () => {
    expect(haversineDistance(33.4484, -112.0740, 33.4484, -112.0740)).toBe(0);
  });

  it('Phoenix to Scottsdale is approximately 9.1 miles (great-circle)', () => {
    const distance = haversineDistance(33.4484, -112.0740, 33.4942, -111.9261);
    expect(distance).toBeGreaterThan(9.0);
    expect(distance).toBeLessThan(9.2);
  });

  it('Phoenix to Tempe is approximately 7.9 miles (great-circle)', () => {
    const distance = haversineDistance(33.4484, -112.0740, 33.4255, -111.9400);
    expect(distance).toBeGreaterThan(7.8);
    expect(distance).toBeLessThan(8.0);
  });

  it('returns positive for distinct non-antipodal points', () => {
    const distance = haversineDistance(33.4484, -112.0740, 33.4942, -111.9261);
    expect(distance).toBeGreaterThan(0);
  });
});

describe('DISTANCE_OPTIONS', () => {
  it('has exactly 4 entries with values [5, 10, 20, 30]', () => {
    expect(DISTANCE_OPTIONS).toHaveLength(4);
    expect(DISTANCE_OPTIONS.map((o) => o.miles)).toEqual([5, 10, 20, 30]);
  });
});
