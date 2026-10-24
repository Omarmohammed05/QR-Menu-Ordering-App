'use client';

import {useRouter} from '@/i18n/navigation';
import {useState, type FormEvent} from 'react';
import {useTranslations} from 'next-intl';
import {authClient} from '@/lib/auth-client';
import {EnvelopeIcon, LockIcon} from '@/components/icons';

export function LoginForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const {data, error} = await authClient.signIn.email({email, password});
    if (data?.user) {
      router.push('/dashboard');
    } else {
      setError(
        error?.code === 'INVALID_EMAIL_OR_PASSWORD'
          ? t('errors.invalidCredentials')
          : t('errors.generic')
      );
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t('email')}</span>
        <span className="relative block">
          <EnvelopeIcon className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            dir="ltr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 w-full rounded-xl border border-hairline bg-surface px-3.5 ps-10 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-brand"
          />
        </span>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t('password')}</span>
        <span className="relative block">
          <LockIcon className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
            dir="ltr"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 w-full rounded-xl border border-hairline bg-surface px-3.5 ps-10 text-base text-foreground outline-none transition-colors focus:border-brand"
          />
        </span>
      </label>
      {error ? (
        <p role="alert" className="text-sm font-medium">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-1 brand-gradient rounded-xl px-4 py-3 text-base font-medium text-white shadow-[0_6px_16px_rgba(255,87,34,0.3)] transition-[transform] duration-100 active:scale-[0.98] disabled:opacity-50"
      >
        {pending ? t('working') : t('login')}
      </button>
    </form>
  );
}
