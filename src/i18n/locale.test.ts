import {describe, expect, it} from 'vitest';
import {directionFor, toggleLocale} from './locale';
import {routing} from './routing';

describe('i18n helpers', () => {
  it('maps ar to rtl and en to ltr', () => {
    expect(directionFor('ar')).toBe('rtl');
    expect(directionFor('en')).toBe('ltr');
  });

  it('toggles between the two supported locales', () => {
    expect(toggleLocale('ar')).toBe('en');
    expect(toggleLocale('en')).toBe('ar');
  });

  it('defaults to Arabic (RTL-first product)', () => {
    expect(routing.defaultLocale).toBe('ar');
    expect(routing.locales).toEqual(['ar', 'en']);
  });
});
