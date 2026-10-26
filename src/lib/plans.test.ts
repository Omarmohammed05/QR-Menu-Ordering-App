import {describe, expect, it} from 'vitest';
import {
  durationLabelParts,
  durationMonthlyPiastres,
  durationTotalPiastres,
  limitsForPlan,
  PLAN_IDS,
  PLAN_LIMITS
} from './plans';

describe('limitsForPlan', () => {
  it('returns the concrete limits of every plan id', () => {
    expect(limitsForPlan('basic')).toBe(PLAN_LIMITS.basic);
    expect(limitsForPlan('pro')).toBe(PLAN_LIMITS.pro);
    expect(limitsForPlan('chain')).toBe(PLAN_LIMITS.chain);
  });

  it('matches the plan ids it advertises', () => {
    for (const id of PLAN_IDS) {
      expect(limitsForPlan(id)).toBeDefined();
    }
  });

  it('falls back to pro for unknown or missing plan values', () => {
    expect(limitsForPlan('enterprise')).toBe(PLAN_LIMITS.pro);
    expect(limitsForPlan(null)).toBe(PLAN_LIMITS.pro);
    expect(limitsForPlan(undefined)).toBe(PLAN_LIMITS.pro);
  });

  it('gives basic strictly fewer features than pro', () => {
    const basic = PLAN_LIMITS.basic;
    expect(basic.maxItems).not.toBeNull();
    expect(basic.maxTables).toBe(1);
    expect(basic.canUseOptions).toBe(false);
    expect(basic.canUseAnalytics).toBe(false);
  });

  it('never caps the paid-up pro and chain tiers', () => {
    for (const id of ['pro', 'chain'] as const) {
      expect(PLAN_LIMITS[id].maxItems).toBeNull();
      expect(PLAN_LIMITS[id].maxTables).toBeNull();
      expect(PLAN_LIMITS[id].canUseOptions).toBe(true);
      expect(PLAN_LIMITS[id].canUseAnalytics).toBe(true);
    }
  });
});

describe('duration pricing', () => {
  it('keeps a zero-discount month equal to the plan price', () => {
    expect(durationTotalPiastres(29900, {months: 1, discountPercent: 0})).toBe(29900);
  });

  it('applies the discount to the whole duration, rounding to piastres', () => {
    // 3 months of basic at 5% off: 29900 × 3 × 0.95 = 85215.
    expect(durationTotalPiastres(29900, {months: 3, discountPercent: 5})).toBe(85215);
    // A non-integer product rounds to the nearest piastre.
    expect(durationTotalPiastres(10001, {months: 2, discountPercent: 10})).toBe(18002);
  });

  it('derives the effective per-month price from the discounted total', () => {
    // 85215 over 3 months → 28405 per month.
    expect(durationMonthlyPiastres(29900, {months: 3, discountPercent: 5})).toBe(28405);
  });

  it('collapses whole years into the years label and everything else into months', () => {
    expect(durationLabelParts(12)).toEqual({key: 'durations.years', count: 1});
    expect(durationLabelParts(24)).toEqual({key: 'durations.years', count: 2});
    expect(durationLabelParts(3)).toEqual({key: 'durations.months', count: 3});
    expect(durationLabelParts(7)).toEqual({key: 'durations.months', count: 7});
  });
});
