'use client';

import {useTranslations} from 'next-intl';
import {DemoButton} from './demo-button';

type Props = {
  /** Aspect of the preview box — `full` for the settings logo. */
  rounded?: 'lg' | 'full';
};

/**
 * Read-only stand-in for the real `ImageUpload`: the same preview box and
 * upload control prospects see after subscribing, but the gesture only
 * fires the demo notice — no file ever leaves the browser in the showcase.
 */
export function DemoImagePicker({rounded = 'lg'}: Props) {
  const t = useTranslations('images');
  return (
    <div className="flex items-center gap-3">
      <span
        className={`grid size-14 shrink-0 place-items-center bg-muted text-xs font-medium text-muted-foreground ${
          rounded === 'full' ? 'rounded-full' : 'rounded-lg'
        }`}
      >
        {t('empty')}
      </span>
      <div className="flex flex-col items-start gap-1.5">
        <DemoButton className="rounded-full border border-hairline px-3 py-1.5 text-xs font-medium transition-[transform,border-color] duration-100 hover:border-foreground active:scale-[0.98]">
          {t('upload')}
        </DemoButton>
      </div>
    </div>
  );
}
