'use client';

import {useLocale, useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {toggleLocale} from '@/i18n/locale';

/** Client island: everything else on the landing page is a server component. */
export function LocaleToggle() {
  const t = useTranslations('landing');
  const locale = useLocale();

  return (
    <Link
      locale={toggleLocale(locale)}
      href="/"
      className="rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {t('switchLocale')}
    </Link>
  );
}
