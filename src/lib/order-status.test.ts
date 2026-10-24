import {describe, expect, it} from 'vitest';
import {NEXT_ORDER_STATUS, canTransition, isTerminal} from './order-status';

const ALL = ['pending', 'accepted', 'ready', 'completed', 'cancelled'] as const;

/** Exhaustive matrix (spec §6): every legal transition passes, every other fails. */
describe('order status machine', () => {
  const legal = new Set([
    'pending→accepted',
    'pending→cancelled',
    'accepted→ready',
    'accepted→cancelled',
    'ready→completed',
    'ready→cancelled'
  ]);

  it.each(ALL.flatMap((from) => ALL.map((to) => [from, to] as const)))(
    '%s → %s',
    (from, to) => {
      expect(canTransition(from, to)).toBe(legal.has(`${from}→${to}`));
    }
  );

  it('never lets a terminal status move', () => {
    expect(ALL.filter((to) => canTransition('completed', to))).toEqual([]);
    expect(ALL.filter((to) => canTransition('cancelled', to))).toEqual([]);
  });

  it('walks the happy path in exactly three steps', () => {
    let status = 'pending' as (typeof ALL)[number];
    const walk: string[] = [];
    while (NEXT_ORDER_STATUS[status]) {
      status = NEXT_ORDER_STATUS[status]!;
      walk.push(status);
    }
    expect(walk).toEqual(['accepted', 'ready', 'completed']);
  });

  it('marks only completed and cancelled terminal', () => {
    expect(ALL.filter((status) => isTerminal(status)).sort()).toEqual(['cancelled', 'completed']);
  });
});
