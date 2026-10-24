/**
 * The order status machine (spec §6): the ONLY legal walk of the lifecycle.
 * `cancelled` is reachable from every live state; terminal states never move.
 * Enforced server-side in the repo (`orders.setStatus`) and unit-tested as
 * an exhaustive matrix — the dashboard UI consumes `NEXT_ORDER_STATUS` so the
 * board's primary action can never propose an illegal transition.
 */
export type OrderLifecycleStatus = 'pending' | 'accepted' | 'ready' | 'completed' | 'cancelled';

const TRANSITIONS: Record<OrderLifecycleStatus, readonly OrderLifecycleStatus[]> = {
  pending: ['accepted', 'cancelled'],
  accepted: ['ready', 'cancelled'],
  ready: ['completed', 'cancelled'],
  completed: [],
  cancelled: []
};

/** The board's primary action: the single next step in the happy path. */
export const NEXT_ORDER_STATUS: Partial<Record<OrderLifecycleStatus, OrderLifecycleStatus>> = {
  pending: 'accepted',
  accepted: 'ready',
  ready: 'completed'
};

/** Statuses the customer page stops polling on. */
export const TERMINAL_ORDER_STATUSES: readonly OrderLifecycleStatus[] = ['completed', 'cancelled'];

export function canTransition(from: OrderLifecycleStatus, to: OrderLifecycleStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function isTerminal(status: OrderLifecycleStatus): boolean {
  return TERMINAL_ORDER_STATUSES.includes(status);
}
