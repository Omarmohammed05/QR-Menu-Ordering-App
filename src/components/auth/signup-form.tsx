'use client';

import {useRouter} from '@/i18n/navigation';
import {useState, type FormEvent} from 'react';
import {useTranslations} from 'next-intl';
import {authClient} from '@/lib/auth-client';

export function SignupForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const {data, error} = await authClient.signUp.email({name, email, password});
    if (data?.user) {
      router.push('/dashboard');
    } else {
      setError(
        error?.code === 'USER_ALREADY_EXISTS'
          ? t('errors.emailTaken')
          : error?.code === 'INVALID_PASSWORD' || error?.code === 'WEAK_PASSWORD'
            ? t('errors.weakPassword')
            : t('errors.generic')
      );
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t('name')}</span>
        <input
          type="text"
          name="name"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-base border border-hairline bg-surface px-3.5 py-2.5 text-base text-foreground"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t('email')}</span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          dir="ltr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-base border border-hairline bg-surface px-3.5 py-2.5 text-base text-foreground"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t('password')}</span>
        <input
          type="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={8}
          dir="ltr"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-base border border-hairline bg-surface px-3.5 py-2.5 text-base text-foreground"
        />
      </label>
      {error ? (
        <p role="alert" className="text-sm font-medium">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-1 rounded-base bg-foreground px-4 py-2.5 text-base font-medium text-background transition-[transform] duration-100 active:scale-[0.98] disabled:opacity-50"
      >
        {pending ? t('working') : t('signup')}
      </button>
    </form>
  );
}
