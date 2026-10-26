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
