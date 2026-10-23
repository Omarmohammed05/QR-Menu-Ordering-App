/** Restaurant slugs: public URL path segment /r/{slug}. Lowercase, digits, hyphens. */
export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$/;

/** Reserved words a restaurant may not take as its slug. */
export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  "admin",
  "api",
  "auth",
  "dashboard",
  "settings",
  "security",
  "sign-in",
  "sign-out",
  "login",
  "logout",
  "reset-password",
  "accept-invite",
  "r",
  "docs",
  "static",
  "public",
  "app",
  "www",
  "demo",
  "help",
  "support",
  "new",
]);

export type SlugValidation =
  { ok: true; slug: string } | { ok: false; reason: "format" | "reserved" };

export function validateSlug(raw: string): SlugValidation {
  const slug = raw.trim().toLowerCase();
  if (!SLUG_PATTERN.test(slug)) {
    return { ok: false, reason: "format" };
  }
  if (RESERVED_SLUGS.has(slug)) {
    return { ok: false, reason: "reserved" };
  }
  return { ok: true, slug };
}

/** Normalizes a latin-ish owner-provided name into a slug suggestion. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
}
