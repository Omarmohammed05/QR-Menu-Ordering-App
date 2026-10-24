import createMiddleware from 'next-intl/middleware';
import {NextRequest, NextResponse} from 'next/server';
import {routing} from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

/**
 * Legacy public-menu URLs (`/ar/r/{slug}`, `/en/r/{slug}`) predate the
 * locale-as-needed routing. Printed QR codes live for years, so they get a
 * permanent 301 to the current shape, query (the table token) included.
 */
const LEGACY_MENU_PATTERN = /^\/(ar|en)\/r\/([^/]+)$/;

function legacyMenuRedirect(url: URL): NextResponse | null {
  const match = LEGACY_MENU_PATTERN.exec(url.pathname);
  if (!match) return null;
  const [, locale, slug] = match;
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
  return NextResponse.redirect(new URL(`${prefix}/${slug}${url.search}`), 301);
}

export default function middleware(request: NextRequest) {
  const redirect = legacyMenuRedirect(new URL(request.url));
  return redirect ?? intlMiddleware(request);
}

export const config = {
  // Match all pathnames except /api, /trpc, /_next, /_vercel and files with a dot
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)'
};
