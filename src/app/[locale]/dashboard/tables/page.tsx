import {headers} from 'next/headers';
import {getTranslations} from 'next-intl/server';
import {requireMember} from '@/server/dashboard';
import {createRestaurantRepos} from '@/server/db/repos';
import {qrSvg} from '@/lib/qr';
import {setTableActiveAction} from '@/server/actions/tables';
import {CreateTableForm} from '@/components/dashboard/create-table-form';
import {CopyLinkButton} from '@/components/dashboard/copy-link-button';
import {PrintButton} from '@/components/dashboard/print-button';
import {DownloadIcon, QrCodeIcon} from '@/components/icons';

type Props = {params: Promise<{locale: string}>};

/** Request origin → the URL encoded into the master and per-table QRs. */
async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

/** SVG → data URL for the "download QR" anchors (server-side base64). */
function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

/**
 * Tables & QR (Stitch "qr_tables_qr" screen): the branch's master QR plus one
 * printable card per physical table.
 */
export default async function TablesPage({params}: Props) {
  const {locale} = await params;
  const {membership} = await requireMember(locale);
  const repos = createRestaurantRepos(membership.restaurant.id);
  const t = await getTranslations('dashboard.tables');

  const [tables, origin] = await Promise.all([repos.tables.list(), requestOrigin()]);
  const publicUrl = `${origin}/${locale}/r/${membership.restaurant.slug}`;
  const masterQr = await qrSvg(publicUrl);
  const cards = await Promise.all(
    tables.map(async (table) => ({
      ...table,
      url: `${publicUrl}?t=${table.token}`,
      qr: await qrSvg(`${publicUrl}?t=${table.token}`)
    }))
  );
  const activeCount = cards.filter((card) => card.isActive).length;

  return (
    <div className="flex flex-col gap-6 print:gap-4">
      <div className="flex flex-col gap-1 print:hidden">
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('tagline')}</p>
      </div>

      {/* Operational overview */}
      <div className="grid grid-cols-2 gap-3 print:hidden">
        <div
          style={{animationDelay: '0ms'}}
          className="animate-float-up [animation-fill-mode:backwards] flex items-center justify-between rounded-xl border border-hairline bg-surface p-4"
        >
          <span className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">{t('stats.total')}</span>
            <span className="text-lg font-semibold">{tables.length}</span>
          </span>
          <span className="grid size-9 place-items-center rounded-full bg-muted">
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
              {activeCount}
            </span>
          </span>
          <span className="grid size-9 place-items-center rounded-full bg-muted">
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
              download={`${membership.restaurant.slug}-qr.svg`}
              className="flex h-10 items-center gap-2 rounded-full bg-foreground px-4 text-sm font-medium text-background transition-[transform] duration-100 active:scale-[0.98] print:hidden"
            >
              <DownloadIcon className="size-4" />
              {t('masterQr.download')}
            </a>
            <CopyLinkButton url={publicUrl} />
          </div>
        </div>
      </section>

      {/* Tables & their QRs */}
      <div
        style={{animationDelay: '180ms'}}
        className="animate-float-up [animation-fill-mode:backwards] rounded-xl border border-hairline bg-surface p-5 print:hidden"
      >
        <CreateTableForm locale={locale} />
      </div>
      {cards.length === 0 ? (
        <p className="animate-fade-in rounded-xl border border-dashed border-hairline px-3 py-6 text-center text-sm text-muted-foreground print:hidden">
          {t('empty')}
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 print:grid-cols-2 print:gap-2">
          {cards.map((card, index) => (
            <li
              key={card.id}
              style={{animationDelay: `${(index + 2) * 70}ms`}}
              className="animate-float-up [animation-fill-mode:backwards] flex flex-col gap-3 rounded-xl border border-hairline bg-surface p-4 transition-[transform,border-color,box-shadow] duration-100 hover:border-hairline-strong hover:shadow-[0_2px_8px_rgba(0,0,0,0.05)] print:break-inside-avoid print:hover:shadow-none"
            >
              <div className="flex items-center justify-between gap-2 print:hidden">
                <span className="font-semibold">{card.label}</span>
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
              <span dir="ltr" className="truncate text-center font-mono text-[11px] text-muted-foreground print:hidden">
                {card.url}
              </span>
              <div className="flex items-center gap-2 print:hidden">
                <a
                  href={svgDataUrl(card.qr)}
                  download={`qr-${card.token.slice(0, 8)}.svg`}
                  className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-hairline text-xs font-medium transition-colors hover:border-foreground"
                >
                  <DownloadIcon className="size-3.5" />
                  {t('downloadSvg')}
                </a>
                <form action={setTableActiveAction} className="flex-1">
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="tableId" value={card.id} />
                  <input type="hidden" name="makeActive" value={String(!card.isActive)} />
                  <button
                    type="submit"
                    className="h-9 w-full rounded-full bg-foreground text-xs font-medium text-background transition-[transform] duration-100 active:scale-[0.98]"
                  >
                    {card.isActive ? t('archive') : t('restore')}
                  </button>
                </form>
              </div>
              {/* On paper the card is just label + QR */}
              <span className="hidden text-center text-sm font-semibold print:block">
                {card.label}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <PrintButton />
      </div>
    </div>
  );
}
