import type {openingHours} from '@/server/db/schema';

export type OpeningSlot = {
  weekday: number;
  opensAt: string;
  closesAt: string;
};

/** Times in the DB are `HH:MM:SS` strings in the restaurant's timezone. */
function minutesOf(time: string): number {
  const [h = '0', m = '0'] = time.split(':');
  return Number(h) * 60 + Number(m);
}

/**
 * Wall-clock `{weekday, minutes}` for `instant` in `timezone` — derived with
 * Intl only, so no tz database dependency is needed at runtime.
 */
export function wallClock(instant: Date, timezone: string): {weekday: number; minutes: number} {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(instant);
  const weekdays: Record<string, number> = {Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6};
  const weekday = weekdays[parts.find((p) => p.type === 'weekday')?.value ?? ''] ?? -1;
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0') % 24;
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  return {weekday, minutes: hour * 60 + minute};
}

/**
 * Whether the restaurant serves at `instant`, given its weekly schedule in
 * its own timezone. A restaurant with no schedule is always considered open —
 * "no hours set" must not lock customers out (the restaurant can still
 * decline over WhatsApp).
 */
export function isOpenAt(
  slots: OpeningSlot[],
  instant: Date,
  timezone: string
): boolean {
  if (slots.length === 0) return true;
  const {weekday, minutes} = wallClock(instant, timezone);
  return slots.some(
    (slot) =>
      slot.weekday === weekday &&
      minutes >= minutesOf(slot.opensAt) &&
      minutes < minutesOf(slot.closesAt)
  );
}

export type OpeningHoursRow = Pick<
  typeof openingHours.$inferSelect,
  'weekday' | 'opensAt' | 'closesAt'
>;
