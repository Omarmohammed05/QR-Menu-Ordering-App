import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {LoginForm} from '@/components/auth/login-form';

export default function LoginPage() {
  const t = useTranslations('auth');

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <header className="flex flex-col gap-1.5 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">{t('loginTitle')}</h1>
          <p className="text-sm text-muted-foreground">{t('loginTagline')}</p>
        </header>
        <LoginForm />
        <p className="text-center text-sm text-muted-foreground">
          {t('noAccount')}{' '}
          <Link href="/signup" className="font-medium text-foreground underline underline-offset-4">
            {t('createOne')}
          </Link>
        </p>
      </div>
    </main>
  );
}
