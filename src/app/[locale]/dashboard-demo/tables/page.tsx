import {notFound} from 'next/navigation';
import {getTranslations} from 'next-intl/server';
import {restaurantsRepo, createRestaurantRepos} from '@/server/db/repos';
import {env} from '@/server/env';
import {buildPublicMenuUrl} from '@/lib/public-url';
import {qrSvg} from '@/lib/qr';
import {formatNumber} from '@/lib/format';
import {DemoHeader} from '@/components/dashboard-demo/demo-header';
import {DemoStats} from '@/components/dashboard-demo/demo-stats';
import {DemoCard} from '@/components/dashboard-demo/demo-card';
import {DownloadIcon, QrCodeIcon} from '@/components/icons';

export const dynamic = 'force-dynamic';

/** SVG → data URL for the "download QR" anchors (server-side base64). */
function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

/** Demo of the tables & QR surface — cards only, nothing to create or toggle. */
export default async function DemoTablesPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const t = await getTranslations('dashboard.tables');

  const restaurant = await restaurantsRepo.findBySlug('demo');
  if (!restaurant) notFound();
  const repos = createRestaurantRepos(restaurant.id);
  const tables = await repos.tables.list();

  const publicUrl = buildPublicMenuUrl(env.NEXT_PUBLIC_APP_URL, restaurant.slug, 'ar');
  const masterQr = await qrSvg(publicUrl);
  const cards = await Promise.all(
    tables.map(async (table) => ({
      ...table,
      url: buildPublicMenuUrl(env.NEXT_PUBLIC_APP_URL, restaurant.slug, 'ar', table.token),
      qr: await qrSvg(buildPublicMenuUrl(env.NEXT_PUBLIC_APP_URL, restaurant.slug, 'ar', table.token))
    }))
  );
  const activeCount = cards.filter((card) => card.isActive).length;

  const stats = [
    {label: t('stats.total'), value: formatNumber(tables.length, locale), icon: <QrCodeIcon className="size-[18px]" />},
    {
      label: t('stats.active'),
      value: formatNumber(activeCount, locale),
      icon: <span className="size-2 animate-pulse rounded-full bg-success" />
    }
  ];

  return (
    <>
      <DemoHeader title={t('title')} tagline={t('tagline')} />
      <DemoStats stats={stats} gridClassName="sm:grid-cols-2" />

      {/* Master QR banner */}
      <DemoCard className="flex flex-col gap-6 lg:flex-row lg:items-center" delay={160}>
        <div
          className="grid size-36 shrink-0 place-items-center self-center overflow-hidden rounded-2xl border border-warm-hairline bg-surface p-2 [&>svg]:size-full"
          dangerouslySetInnerHTML={{__html: masterQr}}
        />
        <div className="flex min-w-0 flex-col gap-2">
          <span className="flex w-fit items-center gap-1.5 rounded-full bg-warm-chip px-2.5 py-0.5 text-[11px] font-medium text-brand-strong">
            <span className="inline-block size-1.5 rounded-full bg-brand" />
            {t('masterQr.badge')}
          </span>
          <h2 className="text-lg font-semibold">{t('masterQr.title')}</h2>
          <p className="text-sm text-warm-muted">{t('masterQr.description')}</p>
          <span dir="ltr" className="truncate font-mono text-xs text-warm-muted">
            {publicUrl}
          </span>
          <div className="mt-2">
            <a
              href={svgDataUrl(masterQr)}
              download={`${restaurant.slug}-qr.svg`}
              className="sunrise-gradient flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(230,74,25,0.3)] transition-[box-shadow,filter] duration-150 hover:brightness-[1.07] active:brightness-[0.95]"
            >
              <DownloadIcon className="size-4" />
              {t('masterQr.download')}
            </a>
          </div>
        </div>
      </DemoCard>

      {/* One printable card per physical table */}
      {cards.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-warm-hairline bg-surface px-4 py-8 text-center text-sm text-warm-muted shadow-warm">
          {t('empty')}
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card, index) => (
            <li
              key={card.id}
              style={{animationDelay: `${240 + index * 70}ms`}}
              className="animate-rise flex flex-col gap-3 rounded-[20px] bg-surface p-4 shadow-warm"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{card.label}</span>
                {card.isActive ? (
                  <span className="rounded-full bg-warm-chip px-2.5 py-0.5 text-[11px] font-medium text-brand-strong">
                    {t('active')}
                  </span>
                ) : (
                  <span className="rounded-full bg-warm-pill px-2.5 py-0.5 text-[11px] font-medium text-warm-muted">
                    {t('archived')}
                  </span>
                )}
              </div>
              <div
                className={`grid place-items-center self-center overflow-hidden rounded-2xl border border-warm-hairline p-2 [&>svg]:size-32 ${
                  card.isActive ? '' : 'opacity-40'
                }`}
                dangerouslySetInnerHTML={{__html: card.qr}}
              />
              <span dir="ltr" className="truncate text-center font-mono text-[11px] text-warm-muted">
                {card.url}
              </span>
              <a
                href={svgDataUrl(card.qr)}
                download={`qr-${card.token.slice(0, 8)}.svg`}
                className="flex h-9 items-center justify-center gap-1.5 rounded-full border border-warm-hairline bg-surface text-xs font-medium transition-[border-color,box-shadow] duration-150 hover:border-[#ff7043] hover:shadow-[0_4px_12px_rgba(255,87,34,0.16)]"
              >
                <DownloadIcon className="size-3.5" />
                {t('downloadSvg')}
              </a>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
