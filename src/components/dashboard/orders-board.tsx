'use client';

import {useEffect, useMemo, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {useRouter} from '@/i18n/navigation';
import {setOrderStatusAction} from '@/server/actions/orders';
import type {OrderStatus, OrderWithItems} from '@/server/db/repos';
import {formatDateTime, formatPrice} from '@/lib/format';
import {
  BagIcon,
  ClockIcon,
  RefreshIcon,
  SearchIcon,
  TableIcon
} from '@/components/icons';

type Props = {
  orders: OrderWithItems[];
  tableLabels: Record<string, string>;
};

const POLL_MS = 15_000;

/** Board columns in workflow order; cancelled orders stay off the board. */
const COLUMNS: OrderStatus[] = ['pending', 'accepted', 'ready', 'completed'];

/** Workflow transition offered as the card's primary action. */
const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: 'accepted',
  accepted: 'ready',
  ready: 'completed'
};

/** Compacts elapsed time into the design's "منذ ٣ د" label. */
function timeAgo(date: Date, t: ReturnType<typeof useTranslations>, locale: string): string {
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60_000));
  if (minutes < 60) return t('timeAgo.minute', {count: minutes});
  const hours = Math.floor(minutes / 60);
  if (hours < 6) return t('timeAgo.hour', {count: hours});
  return formatDateTime(date, locale);
}

type Channel = 'all' | 'dineIn' | 'takeaway';

/**
 * Live kanban order board (Stitch "orders_board" screen). Data arrives from
 * the server; the client filters by channel/search and polls with
 * `router.refresh()` while the tab is visible.
 */
export function OrdersBoard({orders, tableLabels}: Props) {
  const t = useTranslations('dashboard.orders');
  const locale = useLocale();
  const router = useRouter();
  const [channel, setChannel] = useState<Channel>('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') router.refresh();
    };
    const timer = setInterval(refreshIfVisible, POLL_MS);
    document.addEventListener('visibilitychange', refreshIfVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', refreshIfVisible);
    };
  }, [router]);

  const active = useMemo(
    () => orders.filter(({order}) => order.status !== 'cancelled'),
    [orders]
  );

  const filtered = useMemo(() => {
    const q = query.trim();
    return active.filter(({order, items}) => {
      const isDineIn = order.tableId != null;
      if (channel === 'dineIn' && !isDineIn) return false;
      if (channel === 'takeaway' && isDineIn) return false;
      if (!q) return true;
      const haystack = [
        `#${order.id.slice(0, 6)}`,
        order.tableId ? (tableLabels[order.tableId] ?? '') : '',
        order.customerName ?? '',
        order.customerPhone ?? '',
        ...items.map((line) => line.nameSnapshotAr)
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q.toLowerCase());
    });
  }, [active, channel, query, tableLabels]);

  const countFor = (status: OrderStatus) =>
    filtered.filter(({order}) => order.status === status).length;

  const channelCounts = {
    all: active.length,
    dineIn: active.filter(({order}) => order.tableId != null).length,
    takeaway: active.filter(({order}) => order.tableId == null).length
  };

  const chips: {key: Channel; label: string}[] = [
    {key: 'all', label: t('filter.all')},
    {key: 'dineIn', label: t('filter.dineIn')},
    {key: 'takeaway', label: t('filter.takeaway')}
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
                  {channelCounts[key]}
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
              placeholder={t('searchPlaceholder')}
              className="h-9 w-full rounded-lg border border-hairline bg-surface ps-9 pe-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground"
            />
          </div>
          <button
            type="button"
            onClick={() => router.refresh()}
            title={t('refresh')}
            className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-foreground transition-[transform,background-color] duration-100 hover:bg-hairline active:scale-[0.98]"
          >
            <RefreshIcon className="size-4" />
          </button>
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
                <h2 className="text-sm font-semibold">{t(`board.${status}`)}</h2>
                <span className="rounded-full bg-foreground px-2 py-0.5 text-[11px] font-semibold leading-none text-background">
                  {countFor(status)}
                </span>
              </div>
              {status === 'pending' ? (
                <span className="text-[11px] text-muted-foreground">{t('incoming')}</span>
              ) : null}
            </header>
            <div className="flex flex-col gap-3">
              {filtered
                .filter(({order}) => order.status === status)
                .map(({order, items}) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    items={items}
                    tableLabel={order.tableId ? (tableLabels[order.tableId] ?? null) : null}
                    locale={locale}
                  />
                ))}
              {countFor(status) === 0 ? (
                <p className="animate-fade-in rounded-xl border border-dashed border-hairline px-3 py-6 text-center text-xs text-muted-foreground">
                  {t('emptyColumn')}
                </p>
              ) : null}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

type CardProps = {
  order: OrderWithItems['order'];
  items: OrderWithItems['items'];
  tableLabel: string | null;
  locale: string;
};

/** One order ticket: channel, lines, total, and the workflow action. */
function OrderCard({order, items, tableLabel, locale}: CardProps) {
  const t = useTranslations('dashboard.orders');
  const isDone = order.status === 'completed';
  const next = NEXT_STATUS[order.status];

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
          <span dir="ltr" className="font-mono text-sm font-bold tracking-tight">
            #{order.id.slice(0, 6).toUpperCase()}
          </span>
          {tableLabel ? (
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold">
              <TableIcon className="size-3.5" />
              {tableLabel}
            </span>
          ) : (
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold">
              <BagIcon className="size-3.5" />
              {t('outside')}
            </span>
          )}
        </div>
        <span className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
          <ClockIcon className="size-3.5" />
          {timeAgo(order.createdAt, t, locale)}
        </span>
      </div>

      <ul className="flex flex-col gap-1.5 rounded-lg bg-muted/70 p-2.5">
        {items.map((line) => (
          <li
            key={line.id}
            className="flex items-center justify-between gap-2 text-sm"
          >
            <span className="min-w-0 truncate font-medium">
              {line.quantity}× {line.nameSnapshotAr}
            </span>
            {line.options.length > 0 ? (
              <span className="shrink-0 truncate text-[11px] text-muted-foreground">
                {line.options.map((option) => option.nameAr).join('، ')}
              </span>
            ) : null}
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between gap-2 pt-0.5">
        <span className="text-[11px] text-muted-foreground">{t('total')}</span>
        <span className="text-base font-bold tabular-nums">
          {formatPrice(order.totalPiastres, locale)}
        </span>
      </div>

      {order.customerName || order.customerPhone || order.note ? (
        <div className="flex flex-col gap-0.5 border-t border-hairline pt-2 text-[11px] text-muted-foreground">
          {order.customerName ? <span>{order.customerName}</span> : null}
          {order.customerPhone ? <span dir="ltr">{order.customerPhone}</span> : null}
          {order.note ? <span>{order.note}</span> : null}
        </div>
      ) : null}

      {next ? (
        <div className="mt-1 flex items-center gap-2">
          <form action={setOrderStatusAction} className="flex-1">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="orderId" value={order.id} />
            <input type="hidden" name="status" value={next} />
            <button
              type="submit"
              className="h-10 w-full rounded-full bg-foreground text-sm font-medium text-background transition-[transform] duration-100 active:scale-[0.98] active:opacity-90"
            >
              {t(`action.${next}`)}
            </button>
          </form>
          <form action={setOrderStatusAction}>
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="orderId" value={order.id} />
            <input type="hidden" name="status" value="cancelled" />
            <button
              type="submit"
              title={t('cancel')}
              className="grid size-10 shrink-0 place-items-center rounded-full border border-hairline text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
            >
              <span aria-hidden className="text-lg leading-none">
                ×
              </span>
              <span className="sr-only">{t('cancel')}</span>
            </button>
          </form>
        </div>
      ) : null}
    </article>
  );
}
