import {getTranslations} from 'next-intl/server';
import {env} from '@/server/env';
import {buildPublicMenuUrl} from '@/lib/public-url';
import {qrSvg} from '@/lib/qr';
import {DEMO_TABLES} from '@/components/dashboard-demo/demo-data';
import {DemoButton} from '@/components/dashboard-demo/demo-button';
import {CopyLinkButton} from '@/components/dashboard/copy-link-button';
import {formatNumber} from '@/lib/format';
import {DownloadIcon, QrCodeIcon} from '@/components/icons';

type Props = {params: Promise<{locale: string}>};

/** SVG → data URL for the "download QR" anchors (server-side base64). */
function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

/**
 * Demo of tables & QR: the master QR plus one card per showcase table, on a
 * static showcase slug — the real page renders the tenant's own URL.
 */
export default async function DashboardDemoTablesPage({params}: Props) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'dashboard.tables'});
  const tMock = await getTranslations({locale, namespace: 'dashboardDemo'});

  const slug = tMock('mock.slug');
  const publicUrl = buildPublicMenuUrl(env.NEXT_PUBLIC_APP_URL, slug, 'ar');
  const masterQr = await qrSvg(publicUrl);
  const cards = await Promise.all(
    DEMO_TABLES.map(async (table) => ({
      ...table,
      url: buildPublicMenuUrl(env.NEXT_PUBLIC_APP_URL, slug, 'ar', table.token),
      qr: await qrSvg(buildPublicMenuUrl(env.NEXT_PUBLIC_APP_URL, slug, 'ar', table.token))
    }))
  );
  const activeCount = cards.filter((card) => card.isActive).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('tagline')}</p>
      </div>

      {/* Operational overview */}
      <div className="grid grid-cols-2 gap-3">
        <div className="animate-float-up [animation-fill-mode:backwards] flex items-center justify-between rounded-xl border border-hairline bg-surface p-4">
          <span className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">{t('stats.total')}</span>
            <span className="text-lg font-semibold">{formatNumber(cards.length, locale)}</span>
          </span>
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted">
            <QrCodeIcon className="size-4" />
          </span>
        </div>
        <div
          style={{animationDelay: '60ms'}}
          className="animate-float-up [animation-fill-mode:backwards] flex items-center justify-between rounded-xl border border-hairline bg-surface p-4"
        >
          <span className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">{t('stats.active')}</span>
            <span className="flex items-center gap-1.5 text-lg font-semibold">
              <span className="inline-block size-2 rounded-full bg-foreground motion-safe:animate-pulse" />
              {formatNumber(activeCount, locale)}
            </span>
          </span>
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted">
            <span className="inline-block size-2 rounded-full bg-foreground" />
          </span>
        </div>
      </div>

      {/* Master QR banner */}
      <section
        style={{animationDelay: '120ms'}}
        className="animate-float-up [animation-fill-mode:backwards] flex flex-col gap-6 rounded-xl border border-hairline bg-surface p-6 lg:flex-row lg:items-center"
      >
        <div
          className="grid size-36 shrink-0 place-items-center self-center overflow-hidden rounded-lg border border-hairline bg-surface p-2 [&>svg]:size-full"
          dangerouslySetInnerHTML={{__html: masterQr}}
        />
        <div className="flex min-w-0 flex-col gap-2">
          <span className="flex w-fit items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium">
            <span className="inline-block size-1.5 rounded-full bg-foreground" />
            {t('masterQr.badge')}
          </span>
          <h2 className="text-lg font-semibold">{t('masterQr.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('masterQr.description')}</p>
          <span dir="ltr" className="truncate font-mono text-xs text-muted-foreground">
            {publicUrl}
          </span>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <a
              href={svgDataUrl(masterQr)}
              download={`${slug}-qr.svg`}
              className="flex h-10 items-center gap-2 rounded-full bg-foreground px-4 text-sm font-medium text-background transition-[transform] duration-100 active:scale-[0.98]"
            >
              <DownloadIcon className="size-4" />
              {t('masterQr.download')}
            </a>
            <CopyLinkButton url={publicUrl} />
          </div>
        </div>
      </section>

      {/* New table */}
      <div
        style={{animationDelay: '180ms'}}
        className="animate-float-up [animation-fill-mode:backwards] rounded-xl border border-hairline bg-surface p-5"
      >
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder={t('labelPlaceholder')}
            className="min-w-0 flex-1 rounded-base border border-hairline bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
          />
          <DemoButton className="rounded-base bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-[transform] duration-100 active:scale-[0.98]">
            {t('create')}
          </DemoButton>
        </div>
      </div>

      {/* Tables & their QRs */}
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card, index) => (
          <li
            key={card.id}
            style={{animationDelay: `${(index + 2) * 70}ms`}}
            className="animate-float-up [animation-fill-mode:backwards] flex flex-col gap-3 rounded-xl border border-hairline bg-surface p-4 transition-[transform,border-color,box-shadow] duration-100 hover:border-hairline-strong hover:shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">{tMock(card.labelKey)}</span>
              {card.isActive ? (
                <span className="rounded-full bg-foreground px-2.5 py-0.5 text-[11px] font-medium text-background">
                  {t('active')}
                </span>
              ) : (
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {t('archived')}
                </span>
              )}
            </div>
            <div
              className={`grid place-items-center self-center overflow-hidden rounded-lg border border-hairline p-2 [&>svg]:size-32 ${
                card.isActive ? '' : 'opacity-40'
              }`}
              dangerouslySetInnerHTML={{__html: card.qr}}
            />
            <span dir="ltr" className="truncate text-center font-mono text-[11px] text-muted-foreground">
              {card.url}
            </span>
            <div className="flex items-center gap-2">
              <a
                href={svgDataUrl(card.qr)}
                download={`qr-${card.token.slice(0, 8)}.svg`}
                className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-hairline text-xs font-medium transition-colors hover:border-foreground"
              >
                <DownloadIcon className="size-3.5" />
                {t('downloadSvg')}
              </a>
              <DemoButton className="h-9 flex-1 rounded-full bg-foreground text-xs font-medium text-background transition-[transform] duration-100 active:scale-[0.98]">
                {card.isActive ? t('archive') : t('restore')}
              </DemoButton>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
