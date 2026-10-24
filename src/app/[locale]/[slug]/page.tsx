import type {Metadata} from 'next';
import {notFound, permanentRedirect} from 'next/navigation';
import {getTranslations} from 'next-intl/server';
import {env} from '@/server/env';
import {routing} from '@/i18n/routing';
import {loadPublicMenu} from '@/server/public-menu';
import {createRestaurantRepos, restaurantsRepo} from '@/server/db/repos';
import {buildPublicMenuUrl} from '@/lib/public-url';
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
      locale: isLocale(locale) ? locale : routing.defaultLocale
    });
  }

  const tMenu = await getTranslations({locale, namespace: 'publicMenu'});

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-32 pt-8 sm:pt-12">
      <header className="flex flex-col gap-5 pb-7">
        {menu.restaurant.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- imgbb-hosted remote images, no loader config for them
          <img
            src={menu.restaurant.logoUrl}
            alt={menu.restaurant.nameAr}
            className="size-12 rounded-xl object-cover"
          />
        ) : (
          <span className="grid size-12 place-items-center rounded-xl bg-foreground text-background">
            <StoreIcon className="size-6" />
          </span>
        )}
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {menu.restaurant.nameAr}
          </h1>
          {menu.restaurant.nameEn ? (
            <p dir="ltr" className="text-end text-sm text-muted-foreground">
              {menu.restaurant.nameEn}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium ${
              menu.isOpen ? 'bg-muted' : 'border border-hairline text-muted-foreground'
            }`}
          >
            <span
              className={`size-1.5 rounded-full ${
                menu.isOpen ? 'bg-foreground' : 'bg-muted-foreground'
              }`}
            />
            {tMenu(menu.isOpen ? 'openNow' : 'closedNow')}
          </span>
          {menu.table ? (
            <span className="flex items-center gap-1.5 rounded-full border border-hairline px-3.5 py-1.5 text-xs font-medium">
              <TableIcon className="size-3.5 text-muted-foreground" />
              {menu.table.label}
            </span>
          ) : null}
        </div>
      </header>
      <MenuView menu={menu} tableToken={token ?? null} />
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
    title: restaurant.nameAr,
    description: restaurant.nameEn ?? restaurant.nameAr,
    alternates: {
      canonical,
      languages: {
        ar: buildPublicMenuUrl(env.NEXT_PUBLIC_APP_URL, restaurant.slug, 'ar'),
        en: buildPublicMenuUrl(env.NEXT_PUBLIC_APP_URL, restaurant.slug, 'en')
      }
    },
    openGraph: {
      title: restaurant.nameAr,
      description: restaurant.nameEn ?? restaurant.nameAr,
      url: canonical,
      siteName: restaurant.nameAr,
      images: restaurant.logoUrl ? [{url: restaurant.logoUrl}] : undefined,
      locale: currentLocale,
      type: 'website'
    }
  };
}
