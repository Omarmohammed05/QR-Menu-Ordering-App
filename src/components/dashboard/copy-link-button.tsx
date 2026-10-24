'use client';

import {useState} from 'react';
import {useTranslations} from 'next-intl';
import {CheckIcon, CopyIcon} from '@/components/icons';

/** Copies a URL to the clipboard and flashes a check confirmation. */
export function CopyLinkButton({url}: {url: string}) {
  const t = useTranslations('dashboard.tables.masterQr');
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          /* clipboard unavailable (http origin) — the URL is shown next to it */
        }
      }}
      className="flex h-10 shrink-0 items-center gap-2 rounded-full border border-hairline bg-surface px-4 text-sm font-medium transition-colors hover:border-foreground print:hidden"
    >
      {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
      {copied ? t('copied') : t('copyLink')}
    </button>
  );
}
