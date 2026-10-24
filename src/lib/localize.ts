// `string` on purpose: server pages pass a validated route param while
// `useLocale()` on the client is unvalidated.
type Locale = string;

type LocalizedNames = {nameAr: string; nameEn?: string | null};
type LocalizedDescriptions = {descriptionAr?: string | null; descriptionEn?: string | null};

/**
 * Pick the right bilingual field for the locale. Arabic is the source of
 * truth; English falls back to the Arabic value when no translation exists.
 */
export function localizedName(locale: Locale, value: LocalizedNames): string {
  return locale === 'en' && value.nameEn ? value.nameEn : value.nameAr;
}

/** Localized description — empty string when neither language has one. */
export function localizedDescription(locale: Locale, value: LocalizedDescriptions): string {
  const text = locale === 'en' && value.descriptionEn ? value.descriptionEn : value.descriptionAr;
  return text ?? '';
}
