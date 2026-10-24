import type {MetadataRoute} from 'next';
import {env} from '@/server/env';

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
