import { describe, it, expect } from 'vitest';
import { generateSlugId, generateUniqueSlugId } from '../utils/generateSlugId';

describe('generateSlugId', () => {
  it('converts name to lowercase slug', () => {
    expect(generateSlugId('Pho')).toBe('pho');
  });

  it('replaces spaces with dashes', () => {
    expect(generateSlugId('Pho 43')).toBe('pho-43');
  });

  it('removes accented characters (é → e)', () => {
    expect(generateSlugId('Tacos El Patrón')).toBe('tacos-el-patron');
  });

  it('collapses multiple dashes', () => {
    expect(generateSlugId('a  b')).toBe('a-b');
  });

  it('truncates at 60 characters', () => {
    const longName = 'A'.repeat(70);
    expect(generateSlugId(longName)).toHaveLength(60);
  });

  it('handles special characters (& / \' . etc.)', () => {
    expect(generateSlugId("J&G Steakhouse")).toBe('jg-steakhouse');
    expect(generateSlugId("Mario's Pizza")).toBe('marios-pizza');
    expect(generateSlugId("Eat.Drink.Live")).toBe('eatdrinklive');
  });

  it('strips leading and trailing dashes', () => {
    expect(generateSlugId('  Hello  ')).toBe('hello');
  });
});

describe('generateUniqueSlugId', () => {
  it('returns base slug when not in existing list', () => {
    expect(generateUniqueSlugId('Pho 43', [])).toBe('pho-43');
  });

  it('appends -2 when base slug already exists', () => {
    expect(generateUniqueSlugId('Pho 43', ['pho-43'])).toBe('pho-43-2');
  });

  it('appends -3 when -2 also exists', () => {
    expect(generateUniqueSlugId('Pho 43', ['pho-43', 'pho-43-2'])).toBe('pho-43-3');
  });
});
