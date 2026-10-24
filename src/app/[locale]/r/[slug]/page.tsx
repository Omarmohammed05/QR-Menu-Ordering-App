import {notFound} from 'next/navigation';
import {getTranslations} from 'next-intl/server';
import {loadPublicMenu} from '@/server/public-menu';
import {MenuView} from '@/components/public/menu-view';
import {StoreIcon, TableIcon} from '@/components/icons';

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

  const tMenu = await getTranslations({locale, namespace: 'publicMenu'});

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-32 pt-8 sm:pt-12">
      <header className="flex flex-col gap-5 pb-7">
        <span className="grid size-12 place-items-center rounded-xl bg-foreground text-background">
          <StoreIcon className="size-6" />
        </span>
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
