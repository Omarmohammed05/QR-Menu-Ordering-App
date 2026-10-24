import type {MetadataRoute} from 'next';
import {env} from '@/server/env';

// Rendered per request so the sitemap origin always comes from the validated
// runtime env — a build without NEXT_PUBLIC_APP_URL must fail loudly at
// request time, never bake `undefined/sitemap.xml` into the output.
export const dynamic = 'force-dynamic';

/** Public menus are crawlable; the dashboard and auth stays out. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/login', '/signup', '/onboarding', '/api']
      }
    ],
    sitemap: `${env.NEXT_PUBLIC_APP_URL}/sitemap.xml`
  };
}
