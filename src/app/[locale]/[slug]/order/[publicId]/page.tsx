import {notFound} from 'next/navigation';
import {getTranslations} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import {routing} from '@/i18n/routing';
import {restaurantsRepo, createRestaurantRepos} from '@/server/db/repos';
import {publicMenuPath} from '@/lib/public-url';
import {localizedName} from '@/lib/localize';
import {formatNumber, formatPrice} from '@/lib/format';
import {OrderStatusLive} from '@/components/public/order-status-live';
import {StoreIcon, ChevronDownIcon} from '@/components/icons';

type Props = {
  params: Promise<{locale: string; slug: string; publicId: string}>;
};

function isLocale(value: string): value is (typeof routing.locales)[number] {
  return (routing.locales as readonly string[]).includes(value);
}

/**
 * The customer's order-status page (`/{slug}/order/{publicId}` — spec §1
 * step 6): reachable from the WhatsApp message and after submitting. Loads
 * server-side with the order's snapshot (history never changes), then the
 * live section polls until the order completes. No session — the unguessable
 * `publicId` inside the tenant is the only key.
 */
export default async function OrderStatusPage({params}: Props) {
  const {locale, slug, publicId} = await params;
  const routeLocale = isLocale(locale) ? locale : routing.defaultLocale;

  const restaurant = await restaurantsRepo.findBySlug(slug);
  if (!restaurant || restaurant.slug !== slug) notFound();

  const order = await createRestaurantRepos(restaurant.id).orders.findWithItemsByPublicId(publicId);
  if (!order) notFound();

  const t = await getTranslations({locale: routeLocale, namespace: 'publicMenu.order'});
  const tMenu = await getTranslations({locale: routeLocale, namespace: 'publicMenu'});
  const cancelledWithReason =
    order.order.status === 'cancelled' && order.order.cancelReason
      ? t('cancelReason', {reason: order.order.cancelReason})
      : null;

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 pb-16 pt-8 sm:pt-12">
      <header className="flex flex-col gap-4">
        <Link
          href={publicMenuPath(restaurant.slug, routeLocale)}
          className="flex items-center gap-1.5 self-start rounded-full border border-hairline px-3.5 py-1.5 text-xs font-medium transition-colors hover:border-foreground"
        >
          <ChevronDownIcon className="size-3.5 rotate-90 rtl:-rotate-90" />
          {t('backToMenu')}
        </Link>
        <div className="flex items-center gap-3">
          {restaurant.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- imgbb-hosted remote image
            <img src={restaurant.logoUrl} alt={localizedName(routeLocale, restaurant)} className="size-10 rounded-xl object-cover" />
          ) : (
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-foreground text-background">
              <StoreIcon className="size-5" />
            </span>
          )}
          <div className="flex min-w-0 flex-col">
            <h1 className="truncate text-xl font-semibold tracking-tight">
              {localizedName(routeLocale, restaurant)}
            </h1>
            <p className="text-xs text-muted-foreground">
              {t('orderNumber', {number: formatNumber(order.order.number, routeLocale)})}
            </p>
          </div>
        </div>
      </header>

      <OrderStatusLive slug={restaurant.slug} publicId={order.order.publicId} initialStatus={order.order.status} />

      {cancelledWithReason ? (
        <p className="rounded-xl border border-hairline bg-surface px-4 py-3 text-sm text-muted-foreground">
          {cancelledWithReason}
        </p>
      ) : null}

      {/* The receipt: snapshotted lines — immune to later menu edits */}
      <section className="flex flex-col gap-3 rounded-xl border border-hairline bg-surface p-5">
        <h2 className="text-sm font-semibold">{t('items')}</h2>
        <ul className="flex flex-col divide-y divide-hairline text-sm">
          {order.items.map((line) => (
            <li key={line.id} className="flex items-center justify-between gap-3 py-2.5">
              <span className="flex min-w-0 items-center gap-2">
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums">
                  ×{formatNumber(line.quantity, routeLocale)}
                </span>
                <span className="truncate">{line.nameSnapshotAr}</span>
              </span>
              <span className="shrink-0 tabular-nums">
                {formatPrice(line.lineTotalPiastres, routeLocale, restaurant.currency)}
              </span>
            </li>
          ))}
        </ul>
        <p className="flex items-center justify-between gap-3 pt-1 font-semibold">
          <span>{tMenu('total')}</span>
          <span className="tabular-nums">
            {formatPrice(order.order.totalPiastres, routeLocale, restaurant.currency)}
          </span>
        </p>
      </section>

      {/* The audit trail the dashboard wrote — times in the restaurant's zone */}
      <section className="flex flex-col gap-3 rounded-xl border border-hairline bg-surface p-5">
        <h2 className="text-sm font-semibold">{t('timeline')}</h2>
        <ul className="flex flex-col gap-2.5">
          {order.events.map((event) => (
            <li key={event.id} className="flex items-center gap-2.5 text-sm">
              <span
                className={`size-1.5 shrink-0 rounded-full ${
                  event.toStatus === 'cancelled' ? 'bg-muted-foreground' : 'bg-foreground'
                }`}
              />
              <span className="font-medium">{t(`steps.${event.toStatus}`)}</span>
              {event.fromStatus ? (
                <span className="text-xs text-muted-foreground">
                  {t('from', {from: t(`steps.${event.fromStatus}`)})}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
