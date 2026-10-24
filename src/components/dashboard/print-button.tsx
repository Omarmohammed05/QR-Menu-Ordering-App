'use client';

import {useTranslations} from 'next-intl';
import {PrinterIcon} from '@/components/icons';

/** Opens the browser print dialog (print styles strip the dashboard chrome). */
export function PrintButton() {
  const t = useTranslations('dashboard.tables');
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex h-10 items-center gap-2 rounded-full border border-hairline bg-surface px-4 text-sm font-medium transition-colors hover:border-foreground print:hidden"
    >
      <PrinterIcon className="size-4" />
      {t('printAll')}
    </button>
  );
}
