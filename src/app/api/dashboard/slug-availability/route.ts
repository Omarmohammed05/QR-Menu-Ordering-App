import {NextRequest, NextResponse} from 'next/server';
import {routing} from '@/i18n/routing';
import {requireMember} from '@/server/dashboard';
import {restaurantsRepo} from '@/server/db/repos';
import {isReservedSlug, isValidSlugShape, slugSuggestions} from '@/server/restaurants/slug';

/**
 * Live slug availability for the settings form. Authenticated like the
 * dashboard (the member's own restaurant is excluded from the taken check),
 * read-only, so it can never be used to enumerate tenants — it answers only
 * about the candidate the owner typed.
 */
export async function GET(request: NextRequest) {
  const localeParam = request.nextUrl.searchParams.get('locale');
  const locale = (routing.locales as readonly string[]).includes(localeParam ?? '')
    ? (localeParam as (typeof routing.locales)[number])
    : routing.defaultLocale;

  // requireMember's auth path is request-scoped; this route never renders UI.
  const {membership} = await requireMember(locale);

  const raw = (request.nextUrl.searchParams.get('slug') ?? '').trim();
  const slug = raw.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
  if (!slug) return NextResponse.json({available: false, suggestion: null});
  if (isReservedSlug(slug) || !isValidSlugShape(raw)) {
    return NextResponse.json({available: false, suggestion: null});
  }
  if (slug === membership.restaurant.slug) {
    return NextResponse.json({available: true, suggestion: null});
  }
  if (await restaurantsRepo.slugTaken(slug, membership.restaurant.id)) {
    const suggestion = await slugSuggestions(slug, (candidate) =>
      restaurantsRepo.slugTaken(candidate, membership.restaurant.id)
    );
    return NextResponse.json({available: false, suggestion});
  }
  return NextResponse.json({available: true, suggestion: null});
}
