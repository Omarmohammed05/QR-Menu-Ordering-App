/**
 * User-authored content (menu, restaurant profile) is bilingual:
 * Arabic is always present, English is optional and falls back to Arabic.
 */
export type LocalizedText = {
  ar: string;
  en?: string;
};

/** Picks the best available variant for the active locale. */
export function pickLocalized(text: LocalizedText | null | undefined, locale: "ar" | "en"): string {
  if (!text) return "";
  return locale === "en" && text.en ? text.en : text.ar;
}
