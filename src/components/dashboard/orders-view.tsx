'use client';

import {useEffect} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {useRouter} from '@/i18n/navigation';
import {setOrderStatusAction} from '@/server/actions/orders';
import type {OrderStatus, OrderWithItems} from '@/server/db/repos';
import {formatDateTime, formatPrice} from '@/lib/format';

type Props = {
  locale: string;
  orders: OrderWithItems[];
  tableLabels: Record<string, string>;
};

const POLL_MS = 15_000;

/**
 * Status transitions offered per state; staff confirm/cancel as the floor
 * works the orders. Buttons are progressive-enhancement forms against the
 * server action, so they also work before hydration.
 */
const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  pending: ['accepted', 'cancelled'],
  accepted: ['completed', 'cancelled'],
  completed: [],
  cancelled: []
};

/** Live order board with visibility-aware polling (Page Visibility API). */
export function OrdersView({orders, tableLabels}: Props) {
  const t = useTranslations('dashboard.orders');
  const locale = useLocale();
  const router = useRouter();

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

  if (orders.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('empty')}</p>;
  }

  return (
    <ol className="flex flex-col gap-4">
      {orders.map(({order, items}) => (
        <li key={order.id} className="rounded-xl border border-hairline p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
              <span className="font-mono" dir="ltr">
                #{order.id.slice(0, 8)}
              </span>
              {order.tableId ? (
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">
                  {tableLabels[order.tableId] ?? t('unknownTable')}
                </span>
              ) : null}
              <span className="text-xs font-normal text-muted-foreground">
                {formatDateTime(order.createdAt, locale)}
              </span>
            </div>
            <span className="rounded-full border border-hairline px-2.5 py-0.5 text-xs">
              {t(`status.${order.status}`)}
            </span>
          </div>
          <ul className="mt-3 flex flex-col gap-1 border-t border-hairline pt-3 text-sm">
            {items.map((line) => (
              <li key={line.id} className="flex items-center justify-between gap-3">
                <span>
                  {line.nameSnapshotAr} × {line.quantity}
                </span>
                <span className="tabular-nums">{formatPrice(line.lineTotalPiastres, locale)}</span>
              </li>
            ))}
            <li className="flex items-center justify-between gap-3 pt-1 font-semibold">
              <span>{t('total')}</span>
              <span className="tabular-nums">{formatPrice(order.totalPiastres, locale)}</span>
            </li>
          </ul>
          {order.customerName || order.customerPhone || order.note ? (
            <div className="mt-3 flex flex-col gap-0.5 border-t border-hairline pt-3 text-xs text-muted-foreground">
              {order.customerName ? <span>{t('customerName')}: {order.customerName}</span> : null}
              {order.customerPhone ? (
                <span dir="ltr" className="self-start">
                  {t('customerPhone')}: {order.customerPhone}
                </span>
              ) : null}
              {order.note ? <span>{t('note')}: {order.note}</span> : null}
            </div>
          ) : null}
          {NEXT_STATUSES[order.status].length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2 border-t border-hairline pt-3">
              {NEXT_STATUSES[order.status].map((status) => (
                <form key={status} action={setOrderStatusAction}>
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="orderId" value={order.id} />
                  <input type="hidden" name="status" value={status} />
                  <button
                    type="submit"
                    className={
                      status === 'cancelled'
                        ? 'rounded-base border border-hairline px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground'
                        : 'rounded-base bg-foreground px-3.5 py-1.5 text-sm font-medium text-background transition-[transform] duration-100 active:scale-[0.98]'
                    }
                  >
                    {t(`action.${status}`)}
                  </button>
                </form>
              ))}
            </div>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
