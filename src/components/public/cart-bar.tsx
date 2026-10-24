'use client';

import {useLocale, useTranslations} from 'next-intl';
import {BagIcon} from '@/components/icons';
import {formatPrice} from '@/lib/format';

type Props = {count: number; totalPiastres: number; onOpen: () => void};

/**
 * The floating cart bar (Stitch action-bar pattern): a translucent material
 * pill that floats over the menu as soon as the cart holds something.
 */
export function CartBar({count, totalPiastres, onOpen}: Props) {
  const t = useTranslations('publicMenu');
  const locale = useLocale();

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <div className="animate-float-up material mx-auto flex w-full max-w-2xl items-center justify-between gap-3 rounded-full border border-hairline py-2 pe-2 ps-2.5 shadow-[0_12px_32px_rgb(0_0_0/0.14)]">
        <span className="flex min-w-0 items-center gap-3">
          <span className="relative grid size-9 shrink-0 place-items-center rounded-full bg-foreground text-background">
            <BagIcon className="size-4" />
            <span className="absolute -end-1 -top-1 grid min-w-5 place-items-center rounded-full border border-hairline bg-surface px-1 text-[11px] font-semibold tabular-nums">
              {count}
            </span>
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-xs text-muted-foreground">
              {t('cartCount', {count})}
            </span>
            <span className="text-sm font-semibold tabular-nums">
              {formatPrice(totalPiastres, locale)}
            </span>
          </span>
        </span>
        <button
          type="button"
          onClick={onOpen}
          className="shrink-0 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-transform duration-100 active:scale-[0.97]"
        >
          {t('checkout')}
        </button>
      </div>
    </div>
  );
}
