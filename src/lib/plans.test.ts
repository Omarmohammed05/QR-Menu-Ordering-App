import {describe, expect, it} from 'vitest';
import {limitsForPlan, PLAN_IDS, PLAN_LIMITS} from './plans';

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
