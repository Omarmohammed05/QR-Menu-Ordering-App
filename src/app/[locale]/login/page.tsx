import {getTranslations} from 'next-intl/server';
import {LoginForm} from '@/components/auth/login-form';
import {contactAdminUrl} from '@/lib/contact';
import {WhatsAppIcon} from '@/components/icons';

type Props = {searchParams: Promise<{claimed?: string}>};

/** Owner sign-in. `?claimed=1` confirms a just-claimed invite (login next). */
export default async function LoginPage({searchParams}: Props) {
  const {claimed} = await searchParams;
  const t = await getTranslations('auth');

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <header className="flex flex-col gap-1.5 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">{t('loginTitle')}</h1>
          <p className="text-sm text-muted-foreground">{t('loginTagline')}</p>
        </header>
        {claimed === '1' ? (
          <p
            role="status"
            className="rounded-base border border-hairline bg-surface px-3.5 py-2.5 text-center text-sm font-medium"
          >
            {t('claimedNote')}
          </p>
        ) : null}
        <LoginForm />
        <div className="flex flex-col items-center gap-2 border-t border-hairline pt-5">
          <p className="text-center text-sm text-muted-foreground">{t('noAccount')}</p>
          <a
            href={contactAdminUrl(t('contact.prefilled'))}
            target="_blank"
            rel="noreferrer"
            className="flex h-10 items-center gap-2 rounded-full border border-hairline px-4 text-sm font-medium transition-colors hover:border-foreground"
          >
            <WhatsAppIcon className="size-4" />
            {t('contact.button')}
          </a>
        </div>
      </div>
    </main>
  );
}
