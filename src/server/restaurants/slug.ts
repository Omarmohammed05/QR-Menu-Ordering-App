import {randomBytes} from 'node:crypto';

/** Max chars of the readable part of a restaurant slug. */
const BASE_MAX_LENGTH = 24;

/**
 * ASCII slug from a name — anything non-latin (e.g. Arabic) is dropped, so the
 * result can be empty. Purely the readable part; uniqueness comes from the
 * random suffix appended by {@link slugCandidate}.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, BASE_MAX_LENGTH)
    .replace(/-+$/g, '');
}

/**
 * Full public-menu slug: `<readable base>-<random hex>` (e.g.
 * `koshary-house-9f3ab1`). The 6-hex-char suffix makes collisions negligible;
 * the caller retries with a fresh candidate on a unique-violation race.
 * Falls back to `menu` when the name has no latin part.
 */
export function slugCandidate(base: string): string {
  const root = slugify(base) || 'menu';
  return `${root}-${randomBytes(3).toString('hex')}`;
}
