'use client';

import {useRouter} from '@/i18n/navigation';
import {useState} from 'react';
import {useTranslations} from 'next-intl';
import {authClient} from '@/lib/auth-client';

export function SignOutButton() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await authClient.signOut();
        router.push('/login');
      }}
      className="rounded-full border border-hairline px-3.5 py-1.5 text-xs font-medium transition-[transform] duration-100 active:scale-[0.98] disabled:opacity-50"
    >
      {t('signOut')}
    </button>
  );
}
