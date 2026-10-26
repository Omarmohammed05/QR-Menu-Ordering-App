/**
 * Subscription plans (the landing pricing tiers) and the concrete limits
 * each one enforces in the dashboard. The platform owner picks the plan when
 * creating the restaurant; the server actions and dashboard pages gate on
 * these limits — never on ad-hoc checks.
 *
 * `null` means unlimited. Existing rows default to `pro` (see migration
 * 0008) so nothing regresses when plans land.
 */
export type PlanId = 'basic' | 'pro' | 'chain';

export const PLAN_IDS: readonly PlanId[] = ['basic', 'pro', 'chain'];

export type PlanLimits = {
  /** Max dishes; null = unlimited. */
  maxItems: number | null;
  /** Max active QR'd tables; null = unlimited. */
  maxTables: number | null;
  /** Sizes, modifiers & add-ons on dishes. */
  canUseOptions: boolean;
  /** The analytics dashboard page. */
  canUseAnalytics: boolean;
};

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  basic: {maxItems: 30, maxTables: 1, canUseOptions: false, canUseAnalytics: false},
  pro: {maxItems: null, maxTables: null, canUseOptions: true, canUseAnalytics: true},
  chain: {maxItems: null, maxTables: null, canUseOptions: true, canUseAnalytics: true}
};

/** Limits for a stored `plan` value; anything unknown behaves as `pro`. */
export function limitsForPlan(plan: string | null | undefined): PlanLimits {
  return plan && (PLAN_IDS as readonly string[]).includes(plan)
    ? PLAN_LIMITS[plan as PlanId]
    : PLAN_LIMITS.pro;
}

/**
 * Monthly price per tier in piastres — the landing pricing cards and the
 * admin duration preview are computed from these (money never floats).
 */
export const PLAN_PRICES: Record<PlanId, number> = {basic: 29900, pro: 59900, chain: 119900};

/** Feature lines rendered per plan card on the landing page (i18n order). */
export const PLAN_FEATURE_COUNTS: Record<PlanId, number> = {basic: 4, pro: 5, chain: 4};

/** Subscription billing length in months + its discount on the total price. */
export type DurationPreset = {months: number; discountPercent: number};

export const MAX_DURATION_MONTHS = 60;
export const MAX_DISCOUNT_PERCENT = 90;

/** Seeded by migration 0009; the owner can add custom ones from the admin page. */
export const DEFAULT_DURATIONS: readonly DurationPreset[] = [
  {months: 1, discountPercent: 0},
  {months: 3, discountPercent: 5},
  {months: 6, discountPercent: 10},
  {months: 12, discountPercent: 20}
];

/** Total price of a plan over a duration, discount applied (piastres). */
export function durationTotalPiastres(monthlyPiastres: number, duration: DurationPreset): number {
  return Math.round((monthlyPiastres * duration.months * (100 - duration.discountPercent)) / 100);
}

/** Effective per-month price after the duration's discount (piastres). */
export function durationMonthlyPiastres(monthlyPiastres: number, duration: DurationPreset): number {
  return Math.round(durationTotalPiastres(monthlyPiastres, duration) / duration.months);
}

/**
 * Which plural message renders a duration label: whole years collapse into
 * `durations.years`, everything else is `durations.months` (ICU plurals in
 * the messages files supply the exact wording per locale).
 */
export function durationLabelParts(
  months: number
): {key: 'durations.months' | 'durations.years'; count: number} {
  return months % 12 === 0
    ? {key: 'durations.years', count: months / 12}
    : {key: 'durations.months', count: months};
}
