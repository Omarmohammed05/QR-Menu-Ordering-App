import type {Metadata} from 'next';
import {notFound, permanentRedirect} from 'next/navigation';
import {getTranslations} from 'next-intl/server';
import {env} from '@/server/env';
import {routing} from '@/i18n/routing';
import {loadPublicMenu} from '@/server/public-menu';
import {createRestaurantRepos, restaurantsRepo} from '@/server/db/repos';
import {buildPublicMenuUrl} from '@/lib/public-url';
import {localizedName} from '@/lib/localize';
import {MenuView} from '@/components/public/menu-view';
import {StoreIcon, TableIcon} from '@/components/icons';

type Props = {
  params: Promise<{locale: string; slug: string}>;
  searchParams: Promise<{t?: string | string[]}>;
};

function isLocale(value: string): value is (typeof routing.locales)[number] {
  return (routing.locales as readonly string[]).includes(value);
}

/**
 * The customer-facing menu (`/{slug}` in Arabic, `/en/{slug}` in English) —
 * the QR landing. Tenant resolved from the public slug, table from the `?t=`
 * QR token. No session — everything here is public and read-only except the
 * explicit `placeOrderAction` write path.
 */
export default async function PublicMenuPage({params, searchParams}: Props) {
  const {locale, slug} = await params;
  const currentLocale = isLocale(locale) ? locale : routing.defaultLocale;
  const {t} = await searchParams;
  const token = Array.isArray(t) ? t[0] : t;

  // A retired slug (restaurant renamed its handle): old printed QR codes
  // 308-redirect to the current URL forever.
  const restaurant = await restaurantsRepo.findBySlug(slug);
  if (restaurant && restaurant.slug !== slug) {
    permanentRedirect(buildPublicMenuUrl(env.NEXT_PUBLIC_APP_URL, restaurant.slug, isLocale(locale) ? locale : undefined, token));
  }

  const menu = await loadPublicMenu(slug, token);
  if (!menu) notFound();

  // QR telemetry: one menu view per load, attributed to the scanned table
  // when the URL carried a QR token. Dish impressions beacon separately.
  if (restaurant) {
    await createRestaurantRepos(restaurant.id).analytics.recordMenuView({
      tableId: menu.table?.id ?? null,
      locale: currentLocale
    });
  }

  const tMenu = await getTranslations({locale, namespace: 'publicMenu'});

  // The page shows the current locale's name as the h1; the other language's
  // name becomes the small secondary line.
  const alternateName =
    currentLocale === 'en' ? menu.restaurant.nameAr : menu.restaurant.nameEn;

  return (
    <main className="relative min-h-dvh bg-warm-canvas text-warm-ink">
      {/* Header glow — warm image wash fading into the cream canvas */}
      <div aria-hidden className="sunrise-glow" />
      <div className="relative z-10 mx-auto w-full max-w-2xl px-4 pb-32 pt-6 sm:pt-10">
        <header className="animate-rise pb-8">
          {/* Sunrise gradient hero — the visual anchor the QR scan lands on */}
          <div className="sunrise-gradient shadow-warm-strong relative overflow-hidden rounded-[24px] p-6 sm:p-7">
            <span
              aria-hidden
              className="pointer-events-none absolute -end-16 -top-20 size-52 rounded-full bg-white/15 blur-2xl"
            />
            <div className="relative flex flex-col gap-5">
              <div className="flex items-center gap-4">
                {menu.restaurant.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- imgbb-hosted remote images, no loader config for them
                  <img
                    src={menu.restaurant.logoUrl}
                    alt={localizedName(currentLocale, menu.restaurant)}
                    className="size-14 rounded-2xl border-2 border-white/40 object-cover shadow-lg"
                  />
                ) : (
                  <span className="grid size-14 shrink-0 place-items-center rounded-2xl border-2 border-white/40 bg-white/15 text-white backdrop-blur-sm">
                    <StoreIcon className="size-7" />
                  </span>
                )}
                <div className="flex min-w-0 flex-col gap-0.5">
                  <h1 className="truncate text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    {localizedName(currentLocale, menu.restaurant)}
                  </h1>
                  {alternateName ? (
                    <p
                      dir={currentLocale === 'en' ? 'rtl' : 'ltr'}
                      className="truncate text-start text-sm font-medium text-white/85"
                    >
                      {alternateName}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold backdrop-blur-sm ${
                    menu.isOpen
                      ? 'bg-white/90 text-warm-ink'
                      : 'border border-white/50 bg-white/15 text-white'
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${
                      menu.isOpen ? 'animate-soft-pulse bg-brand' : 'bg-white/70'
                    }`}
                  />
                  {tMenu(menu.isOpen ? 'openNow' : 'closedNow')}
                </span>
                {menu.table ? (
                  <span className="flex items-center gap-1.5 rounded-full border border-white/40 bg-white/15 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                    <TableIcon className="size-3.5 text-white/80" />
                    {menu.table.label}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </header>
        <MenuView menu={menu} tableToken={token ?? null} />
      </div>
    </main>
  );
}

type GenerateMetadataProps = {
  params: Promise<{locale: string; slug: string}>;
};

/** Canonical/hreflang/Open Graph always from NEXT_PUBLIC_APP_URL — never the request host. */
export async function generateMetadata({params}: GenerateMetadataProps): Promise<Metadata> {
  const {locale, slug} = await params;
  const currentLocale = isLocale(locale) ? locale : routing.defaultLocale;
  const restaurant = await restaurantsRepo.findBySlug(slug);
  if (!restaurant || !restaurant.isActive) return {};

  const canonical = buildPublicMenuUrl(env.NEXT_PUBLIC_APP_URL, restaurant.slug, currentLocale);
  return {
    title: localizedName(currentLocale, restaurant),
    description: restaurant.nameEn ?? restaurant.nameAr,
    alternates: {
      canonical,
      languages: {
        ar: buildPublicMenuUrl(env.NEXT_PUBLIC_APP_URL, restaurant.slug, 'ar'),
        en: buildPublicMenuUrl(env.NEXT_PUBLIC_APP_URL, restaurant.slug, 'en')
      }
    },
    openGraph: {
      title: localizedName(currentLocale, restaurant),
      description: restaurant.nameEn ?? restaurant.nameAr,
      url: canonical,
      siteName: restaurant.nameAr,
      images: restaurant.logoUrl ? [{url: restaurant.logoUrl}] : undefined,
      locale: currentLocale,
      type: 'website'
    }
  };
}
