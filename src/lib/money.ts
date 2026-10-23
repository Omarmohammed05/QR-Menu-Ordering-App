import type { AppLocale } from "@/i18n/routing";

export type { AppLocale };

/**
 * All money is stored and passed as integer piastres (1 EGP = 100 piastres).
 * Never floats — spec section 3.3.
 */
export type Piastres = number;

export function assertPiastres(value: number): Piastres {
  if (!Number.isInteger(value)) {
    throw new Error(`Money must be integer piastres, received: ${value}`);
  }
  return value;
}

export type FormatMoneyOptions = {
  /** ar-EG formats with Arabic-Indic digits by default; set false for Western digits. */
  arabicIndicDigits?: boolean;
};

export function formatMoney(
  piastres: Piastres,
  locale: AppLocale,
  options: FormatMoneyOptions = {},
): string {
  assertPiastres(piastres);

  const localeTag =
    locale === "ar" ? (options.arabicIndicDigits === false ? "ar-EG-u-nu-latn" : "ar-EG") : "en-EG";

  return new Intl.NumberFormat(localeTag, {
    style: "currency",
    currency: "EGP",
  }).format(piastres / 100);
}

const POUNDS_INPUT_PATTERN = /^\d+(\.\d{1,2})?$/;

/**
 * Parses customer price input in whole pounds ("120", "120.5", "120.50")
 * into piastres. Throws on anything else — callers surface a validation error.
 */
export function parsePiastres(input: string): Piastres {
  const trimmed = input.trim();
  if (!POUNDS_INPUT_PATTERN.test(trimmed)) {
    throw new Error(`Invalid amount: ${input}`);
  }
  const [pounds, cents = "0"] = trimmed.split(".");
  return Number(pounds) * 100 + Number(cents.padEnd(2, "0"));
}
