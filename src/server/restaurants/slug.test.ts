import {describe, expect, it} from 'vitest';
import {
  SLUG_MAX_LENGTH,
  isReservedSlug,
  isValidSlugShape,
  slugSuggestions,
  slugify
} from './slug';

describe('slugify', () => {
  it('normalizes a latin name', () => {
    expect(slugify('Koshary & Kebab!')).toBe('koshary-kebab');
  });

  it('collapses separators and trims the edges', () => {
    expect(slugify('--foul   &  ta3meya--')).toBe('foul-ta3meya');
  });

  it('caps length at 40 without a trailing dash', () => {
    const long = slugify('a'.repeat(60));
    expect(long.length).toBeLessThanOrEqual(SLUG_MAX_LENGTH);
    expect(long.endsWith('-')).toBe(false);
  });

  it('transliterates Arabic names to a clean latin slug', () => {
    expect(slugify('بيت الشام')).toBe('byt-alsham');
    expect(slugify('مطعم الكبدة')).toBe('mtm-alkbd');
  });

  it('strips tashkeel before transliterating', () => {
    expect(slugify('مَطْعِم')).toBe('mtm');
  });

  it('falls back to empty for untransliterable input', () => {
    expect(slugify('日本')).toBe('');
  });
});

describe('reserved slugs', () => {
  it('reserves routing and static-file names', () => {
    for (const slug of [
      'admin',
      'api',
      'dashboard',
      'sign-in',
      'accept-invite',
      'en',
      'ar',
      'r',
      'order',
      'demo-internal',
      '_next',
      'favicon.ico',
      'robots.txt',
      'sitemap.xml'
    ]) {
      expect(isReservedSlug(slug)).toBe(true);
    }
    expect(isReservedSlug('bait-el-sham')).toBe(false);
  });
});

describe('isValidSlugShape', () => {
  it('accepts lowercase/digit/dash handles within 40 chars', () => {
    expect(isValidSlugShape('bait-el-sham')).toBe(true);
    expect(isValidSlugShape('a1')).toBe(true);
    expect(isValidSlugShape('a')).toBe(true);
  });

  it('rejects uppercase, separators, unicode and overlong handles', () => {
    expect(isValidSlugShape('Bait-El-Sham')).toBe(false);
    expect(isValidSlugShape('bait el sham')).toBe(false);
    expect(isValidSlugShape('بيت')).toBe(false);
    expect(isValidSlugShape('-bait')).toBe(false);
    expect(isValidSlugShape('bait-')).toBe(false);
    expect(isValidSlugShape('a'.repeat(41))).toBe(false);
  });
});

describe('slugSuggestions', () => {
  it('returns the clean base when it is free — never a random hash', async () => {
    expect(await slugSuggestions('Bait El Sham', async () => false)).toBe('bait-el-sham');
  });

  it('walks -2, -3, … when the base is taken', async () => {
    const taken = new Set(['bait-el-sham', 'bait-el-sham-2']);
    const slug = await slugSuggestions('Bait El Sham', (candidate) =>
      Promise.resolve(taken.has(candidate))
    );
    expect(slug).toBe('bait-el-sham-3');
  });

  it('skips reserved candidates while walking', async () => {
    const slug = await slugSuggestions('menu', async () => false);
    // 'menu' itself is free and not reserved → returned as-is
    expect(slug).toBe('menu');
    const reservedOnly = await slugSuggestions('r', async (candidate) =>
      Promise.resolve(candidate !== 'r-2')
    );
    expect(reservedOnly).toBe('r-2');
  });

  it('gives up after the attempt budget instead of inventing hashes', async () => {
    expect(await slugSuggestions('bait', async () => true, 5)).toBeNull();
  });
});
