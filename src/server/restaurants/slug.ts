/**
 * Public menu slugs: `https://{domain}/{slug}` — lowercase latin, digits and
 * dashes, max 40 chars, derived from the restaurant name (Arabic names are
 * transliterated). Never random: uniqueness comes from the caller walking
 * `-2`, `-3`, … suggestions against the DB.
 */

/** Slugs that must never resolve to a restaurant page. */
const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'dashboard',
  'sign-in',
  'accept-invite',
  'en',
  'ar',
  'r',
  'order',
  'demo-internal',
  '_next',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml'
]);

export const SLUG_MAX_LENGTH = 40;

/** Arabic → latin transliteration (lossy by design; only used to build a readable base). */
const ARABIC_MAP: Record<string, string> = {
  ا: 'a', أ: 'a', إ: 'i', آ: 'a', ب: 'b', ت: 't', ث: 'th', ج: 'j', ح: 'h',
  خ: 'kh', د: 'd', ذ: 'dh', ر: 'r', ز: 'z', س: 's', ش: 'sh', ص: 's', ض: 'd',
  ط: 't', ظ: 'z', ع: 'a', غ: 'gh', ف: 'f', ق: 'q', ك: 'k', ل: 'l', م: 'm',
  ن: 'n', ه: 'h', و: 'w', ي: 'y', ى: 'a', ة: 'h', ء: '', ئ: 'y', ؤ: 'w'
};

/** Arabic diacritics (fatha, damma, kasra, shadda, sukun, tanween…) — stripped. */
const TASHKEEL = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;

/**
 * Canonical slug text: Arabic transliterated, everything else non-latin
 * dropped, runs of separators collapsed to one dash. Purely the readable
 * part — no uniqueness is applied here. Empty result means "no usable base".
 */
export function slugify(input: string): string {
  const transliterated = input
    .replace(TASHKEEL, '')
    .replace(/[\u0600-\u06FF]/g, (letter) => ARABIC_MAP[letter] ?? '');
  return transliterated
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/-+$/g, '');
}

/** Valid, unreserved shape check for an owner-typed slug. */
export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug);
}

/** `bait-el-sham` ✓ · `Bait El_Sham` ✗ · `-abc-` ✗ · >40 chars ✗ */
export function isValidSlugShape(slug: string): boolean {
  return new RegExp(`^[a-z0-9](?:[a-z0-9-]{0,${SLUG_MAX_LENGTH - 2}}[a-z0-9])?$`).test(slug);
}

/**
 * Walks `base`, `base-2`, `base-3`, … until `isTaken` says the candidate is
 * free. Returns null after the given attempts — callers then surface a
 * taken-slug error instead of inventing random hashes.
 */
export async function slugSuggestions(
  base: string,
  isTaken: (candidate: string) => Promise<boolean>,
  attempts = 5
): Promise<string | null> {
  const root = slugify(base) || 'menu';
  for (let attempt = 0; attempt < attempts; attempt++) {
    const candidate = attempt === 0 ? root : `${root}-${attempt + 1}`;
    if (!isReservedSlug(candidate) && !(await isTaken(candidate))) return candidate;
  }
  return null;
}
