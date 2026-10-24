/**
 * Wall-clock day equality in the restaurant's own IANA timezone — "today's
 * orders" boundaries follow the venue's local day, not UTC's (money/time
 * convention in AGENTS.md: UTC timestamptz stored, IANA-aware logic).
 */
export function isSameLocalDay(date: Date, now: Date, timeZone: string): boolean {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return fmt.format(date) === fmt.format(now);
}
