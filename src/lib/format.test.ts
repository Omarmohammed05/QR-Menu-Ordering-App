import {describe, expect, it} from 'vitest';
import {formatPrice} from './format';

// Intl puts a non-breaking space between "EGP" and the amount.
const EGP = `EGP\u00A0`;

describe('formatPrice', () => {
  it('formats whole-EGP prices without a fraction', () => {
    expect(formatPrice(8500, 'en')).toBe(`${EGP}85`);
    expect(formatPrice(0, 'en')).toBe(`${EGP}0`);
  });

  it('keeps two decimals for fractional prices', () => {
    expect(formatPrice(8550, 'en')).toBe(`${EGP}85.50`);
    expect(formatPrice(5, 'en')).toBe(`${EGP}0.05`);
  });
});
