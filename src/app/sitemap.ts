import type {MetadataRoute} from 'next';
import {eq} from 'drizzle-orm';
import {db} from '@/server/db';
import {restaurants} from '@/server/db/schema';
import {env} from '@/server/env';
import {buildPublicMenuUrl} from '@/lib/public-url';

// Rendered per request, not at build: the build worker has no database (and
// no validated env), and the DB is the source of truth for active slugs.
export const dynamic = 'force-dynamic';

/**
 * One entry per active restaurant, with its English alternate — both built
 * from NEXT_PUBLIC_APP_URL, never the request host.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const active = await db
    .select({slug: restaurants.slug})
    .from(restaurants)
    .where(eq(restaurants.isActive, true));

  return active.flatMap(({slug}) => {
    const alternates = {
      languages: {
        ar: buildPublicMenuUrl(env.NEXT_PUBLIC_APP_URL, slug, 'ar'),
        en: buildPublicMenuUrl(env.NEXT_PUBLIC_APP_URL, slug, 'en')
      }
    };
    return [
      {url: alternates.languages.ar, changeFrequency: 'weekly', alternates},
      {url: alternates.languages.en, changeFrequency: 'weekly', alternates}
    ];
  });
}
