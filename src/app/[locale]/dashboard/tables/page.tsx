import {headers} from 'next/headers';
import {getTranslations} from 'next-intl/server';
import {requireMember} from '@/server/dashboard';
import {createRestaurantRepos} from '@/server/db/repos';
import {qrSvg} from '@/lib/qr';
import {setTableActiveAction} from '@/server/actions/tables';
import {CreateTableForm} from '@/components/dashboard/create-table-form';

type Props = {params: Promise<{locale: string}>};

type TableCard = {
  id: string;
  label: string;
  isActive: boolean;
  url: string;
  qr: string;
};

/** Request origin → the URL encoded into each table's QR. */
async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

/**
 * Tables & QR: one card per physical table with its printable QR (inline SVG,
 * monochrome) and the public menu URL it encodes.
 */
export default async function TablesPage({params}: Props) {
  const {locale} = await params;
  const {membership} = await requireMember(locale);
  const repos = createRestaurantRepos(membership.restaurant.id);
  const t = await getTranslations('dashboard.tables');

  const tables = await repos.tables.list();
  const origin = await requestOrigin();
  const cards: TableCard[] = await Promise.all(
    tables.map(async (table) => {
      const url = `${origin}/${locale}/r/${membership.restaurant.slug}?t=${table.token}`;
      return {
        id: table.id,
        label: table.label,
        isActive: table.isActive,
        url,
        qr: await qrSvg(url)
      };
    })
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('tagline')}</p>
      </div>
      <CreateTableForm locale={locale} />
      {cards.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('empty')}</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {cards.map((card) => (
            <li
              key={card.id}
              className="flex flex-col gap-3 rounded-xl border border-hairline p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{card.label}</span>
                <span
                  className={`rounded-full border border-hairline px-2.5 py-0.5 text-xs ${
                    card.isActive ? '' : 'text-muted-foreground'
                  }`}
                >
                  {t(card.isActive ? 'active' : 'archived')}
                </span>
              </div>
              <div className="flex justify-center border border-hairline p-2 [&>svg]:h-auto [&>svg]:w-full">
                {/* Inline QR SVG from our own `qrSvg` — no untrusted markup. */}
                <div dangerouslySetInnerHTML={{__html: card.qr}} />
              </div>
              <p dir="ltr" className="truncate font-mono text-xs text-muted-foreground">
                {card.url}
              </p>
              <form action={setTableActiveAction} className="self-start">
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="tableId" value={card.id} />
                <input type="hidden" name="makeActive" value={String(!card.isActive)} />
                <button
                  type="submit"
                  className="rounded-base border border-hairline px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t(card.isActive ? 'archive' : 'restore')}
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
