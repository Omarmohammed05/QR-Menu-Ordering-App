import {describe, expect, it} from 'vitest';
import {slugCandidate, slugify} from './slug';

describe('slugify', () => {
  it('normalizes a latin name', () => {
    expect(slugify('Koshary & Kebab!')).toBe('koshary-kebab');
  });

  it('collapses separators and trims the edges', () => {
    expect(slugify('--foul   &  ta3meya--')).toBe('foul-ta3meya');
  });

  it('caps length without a trailing dash', () => {
    const long = slugify('a'.repeat(40));
    expect(long.length).toBeLessThanOrEqual(24);
    expect(long.endsWith('-')).toBe(false);
  });

  it('returns empty for non-latin (Arabic) input', () => {
    expect(slugify('مطعم الكبدة')).toBe('');
  });
});

describe('slugCandidate', () => {
  it('appends a random hex suffix to the slugified base', () => {
    expect(slugCandidate('Koshary House')).toMatch(/^koshary-house-[0-9a-f]{6}$/);
  });

  it('falls back to the generic base when nothing survives slugification', () => {
    expect(slugCandidate('مطعم')).toMatch(/^menu-[0-9a-f]{6}$/);
  });

  it('never returns the same candidate twice in a row', () => {
    expect(slugCandidate('Koshary House')).not.toBe(slugCandidate('Koshary House'));
  });
});
