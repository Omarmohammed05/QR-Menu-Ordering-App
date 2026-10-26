'use client';

import {useMemo, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {NEXT_ORDER_STATUS} from '@/lib/order-status';
import {formatNumber, formatPrice} from '@/lib/format';
import {
  DEMO_ORDERS,
  type DemoOrder,
  type DemoOrderStatus
} from '@/components/dashboard-demo/demo-data';
import {useDemoNotice} from '@/components/dashboard-demo/demo-notice';
import {BagIcon, ClockIcon, SearchIcon, TableIcon} from '@/components/icons';

type Channel = 'all' | 'dineIn' | 'takeaway';

const COLUMNS: DemoOrderStatus[] = ['pending', 'accepted', 'ready', 'completed'];

/**
 * The live order board as prospects see it after subscribing: channel
 * filters, search and the kanban — on static data. Every workflow button
 * fires the read-only notice instead of writing.
 */
export function DemoOrdersBoard() {
  const t = useTranslations('dashboardDemo');
  const tDash = useTranslations('dashboard.orders');
  const locale = useLocale();
  const [channel, setChannel] = useState<Channel>('all');
  const [query, setQuery] = useState('');

  const translated = useMemo(
    () =>
      DEMO_ORDERS.map((order) => ({
        ...order,
        tableLabel: order.tableLabelKey ? t(order.tableLabelKey) : null,
        customerName: order.customerNameKey ? t(order.customerNameKey) : null,
        lines: order.lines.map((line) => ({
          ...line,
          dish: t(line.dishKey),
          options: (line.optionKeys ?? []).map((key) => t(key))
        }))
      })),
    [t]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return translated.filter((order) => {
      const isDineIn = order.tableLabel !== null;
      if (channel === 'dineIn' && !isDineIn) return false;
      if (channel === 'takeaway' && isDineIn) return false;
      if (!q) return true;
      const haystack = [
        `#${order.number}`,
        order.tableLabel ?? '',
        order.customerName ?? '',
        ...order.lines.map((line) => line.dish)
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [translated, channel, query]);

  const countFor = (status: DemoOrderStatus) =>
    filtered.filter((order) => order.status === status).length;

  const channelCounts = {
    all: translated.length,
    dineIn: translated.filter((order) => order.tableLabel !== null).length,
    takeaway: translated.filter((order) => order.tableLabel === null).length
  };

  const chips: {key: Channel; label: string}[] = [
    {key: 'all', label: tDash('filter.all')},
    {key: 'dineIn', label: tDash('filter.dineIn')},
    {key: 'takeaway', label: tDash('filter.takeaway')}
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Filter & search deck */}
      <div className="animate-fade-in flex flex-col gap-3 rounded-xl border border-hairline bg-surface p-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0" role="group">
          {chips.map(({key, label}) => {
            const selected = channel === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setChannel(key)}
                aria-pressed={selected}
                className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm transition-[transform] duration-100 active:scale-[0.98] ${
                  selected
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-none ${
                    selected ? 'bg-background/20' : 'bg-background'
                  }`}
                >
                  {formatNumber(channelCounts[key], locale)}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1 lg:w-72">
            <SearchIcon className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={tDash('searchPlaceholder')}
              className="h-9 w-full rounded-lg border border-hairline bg-surface ps-9 pe-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground"
            />
          </div>
        </div>
      </div>

      {/* Kanban stage */}
      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((status, index) => (
          <section
            key={status}
            style={{animationDelay: `${index * 70}ms`}}
            className="animate-float-up [animation-fill-mode:backwards] flex min-w-0 flex-col gap-3"
          >
            <header className="flex items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-2">
                <span
                  className={`size-2.5 rounded-full bg-foreground ${
                    status === 'pending' ? 'motion-safe:animate-pulse' : ''
                  }`}
                />
                <h2 className="text-sm font-semibold">{tDash(`board.${status}`)}</h2>
                <span className="rounded-full bg-foreground px-2 py-0.5 text-[11px] font-semibold leading-none text-background">
                  {formatNumber(countFor(status), locale)}
                </span>
              </div>
              {status === 'pending' ? (
                <span className="text-[11px] text-muted-foreground">{tDash('incoming')}</span>
              ) : null}
            </header>
            <div className="flex flex-col gap-3">
              {filtered
                .filter((order) => order.status === status)
                .map((order) => (
                  <DemoOrderCard key={order.id} order={order} />
                ))}
              {countFor(status) === 0 ? (
                <p className="animate-fade-in rounded-xl border border-dashed border-hairline px-3 py-6 text-center text-xs text-muted-foreground">
                  {tDash('emptyColumn')}
                </p>
              ) : null}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

/** One static order ticket — the workflow buttons fire the demo notice. */
function DemoOrderCard({
  order
}: {
  order: Omit<DemoOrder, 'lines'> & {
    tableLabel: string | null;
    customerName: string | null;
    lines: {id: string; quantity: number; dish: string; options: string[]}[];
  };
}) {
  const t = useTranslations('dashboardDemo');
  const tDash = useTranslations('dashboard.orders');
  const locale = useLocale();
  const fireNotice = useDemoNotice();
  const isDone = order.status === 'completed';
  const next = NEXT_ORDER_STATUS[order.status];

  return (
    <article
      className={`animate-float-up [animation-fill-mode:backwards] relative flex flex-col gap-2.5 overflow-hidden rounded-xl border border-hairline bg-surface p-4 transition-[transform,border-color,box-shadow] duration-100 hover:border-hairline-strong hover:shadow-[0_2px_8px_rgba(0,0,0,0.05)] ${
        isDone ? 'opacity-70' : ''
      }`}
    >
      {order.status === 'pending' ? (
        <span className="absolute inset-y-0 start-0 w-1 bg-foreground" />
      ) : null}
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-sm font-bold tracking-tight tabular-nums">
            #{formatNumber(order.number, locale)}
          </span>
          {order.tableLabel ? (
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold">
              <TableIcon className="size-3.5" />
              {order.tableLabel}
            </span>
          ) : (
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold">
              <BagIcon className="size-3.5" />
              {tDash('outside')}
            </span>
          )}
          <span className="flex shrink-0 items-center rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold">
            {tDash(`payment.${order.paymentMethod}`)}
          </span>
        </div>
        <span className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
          <ClockIcon className="size-3.5" />
          {t('minutesAgo', {count: order.minutesAgo})}
        </span>
      </div>

      <ul className="flex flex-col gap-1.5 rounded-lg bg-muted/70 p-2.5">
        {order.lines.map((line) => (
          <li key={line.id} className="flex items-center justify-between gap-2 text-sm">
            <span className="min-w-0 truncate font-medium">
              {formatNumber(line.quantity, locale)}× {line.dish}
            </span>
            {line.options.length > 0 ? (
              <span className="shrink-0 truncate text-[11px] text-muted-foreground">
                {line.options.join('، ')}
              </span>
            ) : null}
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between gap-2 pt-0.5">
        <span className="text-[11px] text-muted-foreground">{tDash('total')}</span>
        <span className="text-base font-bold tabular-nums">
          {formatPrice(order.totalPiastres, locale)}
        </span>
      </div>

      {order.customerName || order.noteKey ? (
        <div className="flex flex-col gap-0.5 border-t border-hairline pt-2 text-[11px] text-muted-foreground">
          {order.customerName ? <span>{order.customerName}</span> : null}
          {order.noteKey ? <span>{t(order.noteKey)}</span> : null}
        </div>
      ) : null}

      {next ? (
        <div className="mt-1 flex items-center gap-2">
          <button
            type="button"
            onClick={fireNotice}
            className="h-10 flex-1 rounded-full bg-foreground text-sm font-medium text-background transition-[transform] duration-100 active:scale-[0.98] active:opacity-90"
          >
            {tDash(`action.${next}`)}
          </button>
          <button
            type="button"
            onClick={fireNotice}
            title={tDash('cancel')}
            className="grid size-10 shrink-0 place-items-center rounded-full border border-hairline text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
          >
            <span aria-hidden className="text-lg leading-none">
              ×
            </span>
            <span className="sr-only">{tDash('cancel')}</span>
          </button>
        </div>
      ) : null}
    </article>
  );
}
