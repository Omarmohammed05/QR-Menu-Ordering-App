/**
 * Branch-level options shared by the settings form, its server validation,
 * and price display: the timezone drives opening-hours evaluation and the
 * currency drives `formatPrice`. Fixed lists — the DB accepts only these.
 */
export const BRANCH_CURRENCIES = [
  'EGP',
  'USD',
  'EUR',
  'GBP',
  'SAR',
  'AED',
  'KWD',
  'QAR',
  'OMR',
  'BHD',
  'JOD'
] as const;

export function isBranchCurrency(value: string): boolean {
  return (BRANCH_CURRENCIES as readonly string[]).includes(value);
}

/** Every IANA zone the runtime knows — Node 22 and modern browsers agree. */
export const BRANCH_TIMEZONES: readonly string[] = Intl.supportedValuesOf('timeZone');

export function isBranchTimezone(value: string): boolean {
  return BRANCH_TIMEZONES.includes(value);
}
