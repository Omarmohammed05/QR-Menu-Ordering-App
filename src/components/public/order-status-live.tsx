'use client';

import {useEffect, useState} from 'react';
import {useTranslations} from 'next-intl';
import {
  isTerminal,
  type OrderLifecycleStatus
} from '@/lib/order-status';
import {CheckIcon, ClockIcon, WhatsAppIcon} from '@/components/icons';

type Props = {
  slug: string;
  publicId: string;
  initialStatus: OrderLifecycleStatus;
};

const POLL_MS = 8_000; // spec §6: poll every 8 s until a terminal status

/** Steps of the happy path, in walk order — the page's progress spine. */
const STEPS: OrderLifecycleStatus[] = ['pending', 'accepted', 'ready', 'completed'];

/**
 * Live status for the customer's order: polls the public read-only endpoint
 * while the tab is visible, stops for good on `completed`/`cancelled`. The
 * "Open WhatsApp" fallback appears when the automatic handoff popup was
 * blocked — the order is already saved, and the customer re-sends the same
 * prefilled message from here.
 */
export function OrderStatusLive({slug, publicId, initialStatus}: Props) {
  const t = useTranslations('publicMenu.order');
  const [status, setStatus] = useState<OrderLifecycleStatus>(initialStatus);
  // The handoff URL was stashed by the menu before navigating here; a blocked
  // popup means the customer re-sends the message from this page instead.
  const [whatsappUrl] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(`order-wa:${publicId}`);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (isTerminal(status)) return;
    let cancelled = false;
    const poll = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const response = await fetch(`/api/order-status/${publicId}?slug=${encodeURIComponent(slug)}`);
        if (!response.ok) return; // transient — the next tick retries
        const data = (await response.json()) as {status: OrderLifecycleStatus};
        if (!cancelled && data.status) setStatus(data.status);
      } catch {
        /* network hiccup — keep the last known status and retry next tick */
      }
    };
    const timer = setInterval(poll, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void poll();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [publicId, slug, status]);

  const stepIndex = STEPS.indexOf(status);
  const cancelled = status === 'cancelled';

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-hairline bg-surface p-5">
      {/* Progress spine: dots connected by a hairline, current step filled */}
      <div aria-hidden className="flex items-center gap-1.5">
        {STEPS.map((step, index) => {
          const reached = !cancelled && stepIndex >= index;
          return (
            <span key={step} className="flex flex-1 items-center gap-1.5">
              <span
                className={`grid size-6 shrink-0 place-items-center rounded-full border transition-colors duration-200 ${
                  reached ? 'border-foreground bg-foreground text-background' : 'border-hairline'
                }`}
              >
                {reached ? <CheckIcon className="size-3.5" /> : null}
              </span>
              {index < STEPS.length - 1 ? (
                <span
                  className={`h-px flex-1 ${!cancelled && stepIndex > index ? 'bg-foreground' : 'bg-hairline'}`}
                />
              ) : null}
            </span>
          );
        })}
      </div>
      <p aria-live="polite" className="text-center text-base font-semibold tracking-tight">
        {t(`steps.${status}`)}
      </p>
      <div className="grid grid-cols-4 gap-1.5 text-center text-[11px] text-muted-foreground">
        {STEPS.map((step, index) => (
          <span key={step} className={stepIndex === index ? 'font-medium text-foreground' : ''}>
            {t(`steps.${step}`)}
          </span>
        ))}
      </div>

      {cancelled ? (
        <p className="rounded-lg bg-muted px-3 py-2 text-center text-xs text-muted-foreground">
          {t('cancelledNote')}
        </p>
      ) : null}

      {whatsappUrl && !isTerminal(status) ? (
        <div className="flex flex-col gap-2 border-t border-hairline pt-4">
          <p className="text-center text-xs text-muted-foreground">{t('whatsappHint')}</p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="flex h-11 items-center justify-center gap-2 rounded-full bg-foreground text-sm font-medium text-background transition-[transform] duration-100 active:scale-[0.98]"
          >
            <WhatsAppIcon className="size-4" />
            {t('openWhatsApp')}
          </a>
        </div>
      ) : null}

      {!isTerminal(status) ? (
        <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <ClockIcon className="size-3.5" />
          {t('updating')}
        </p>
      ) : null}
    </section>
  );
}
