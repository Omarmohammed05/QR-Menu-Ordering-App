import {notFound} from 'next/navigation';
import {getTranslations} from 'next-intl/server';
import {loadPublicMenu} from '@/server/public-menu';
import {MenuView} from '@/components/public/menu-view';

type Props = {
  params: Promise<{locale: string; slug: string}>;
  searchParams: Promise<{t?: string | string[]}>;
};

/**
 * The customer-facing menu (QR landing): tenant resolved from the public
 * slug, table from the `?t=` QR token. No session — everything here is public
 * and read-only except the explicit `placeOrderAction` write path.
 */
export default async function PublicMenuPage({params, searchParams}: Props) {
  const {locale, slug} = await params;
  const {t} = await searchParams;
  const token = Array.isArray(t) ? t[0] : t;
  const menu = await loadPublicMenu(slug, token);
  if (!menu) notFound();

  const tDashboard = await getTranslations({locale, namespace: 'publicMenu'});

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-32 pt-10">
      <header className="flex flex-col gap-3 border-b border-hairline pb-6">
        <h1 className="text-3xl font-semibold tracking-tight">
          {menu.restaurant.nameAr}
          {menu.restaurant.nameEn ? (
            <span className="mt-1 block text-base font-normal text-muted-foreground" dir="ltr">
              {menu.restaurant.nameEn}
            </span>
          ) : null}
        </h1>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span
            className={`rounded-full border px-3 py-1 ${
              menu.isOpen
                ? 'border-hairline text-foreground'
                : 'border-hairline text-muted-foreground'
            }`}
          >
            {tDashboard(menu.isOpen ? 'openNow' : 'closedNow')}
          </span>
          {menu.table ? (
            <span className="rounded-full bg-muted px-3 py-1">{menu.table.label}</span>
          ) : null}
        </div>
      </header>
      <MenuView locale={locale} menu={menu} tableToken={token ?? null} />
    </main>
  );
}
