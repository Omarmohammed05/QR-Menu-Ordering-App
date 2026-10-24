import {getTranslations} from 'next-intl/server';
import {ClaimForm} from '@/components/claim/claim-form';
import {AuthVisual} from '@/components/auth/auth-visual';
import {LogoGlyphIcon} from '@/components/icons';

type Props = {
  params: Promise<{locale: string}>;
  searchParams: Promise<{code?: string}>;
};

/**
 * Invite-claim page — the ONLY account-creation path. The restaurant owner
 * arrives here from the link the platform owner sent them (code prefilled via
 * ?code=, or typed by hand) and sets their name, email and password.
 */
export default async function ClaimPage({params, searchParams}: Props) {
  const {locale} = await params;
  const {code} = await searchParams;
  const t = await getTranslations('claim');

  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col items-center justify-center px-6 py-12">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <header className="flex flex-col gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-brand text-white shadow-[0_6px_16px_rgba(255,87,34,0.3)]">
              <LogoGlyphIcon className="size-6" />
            </span>
            <div className="flex flex-col gap-1.5">
              <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
              <p className="text-sm text-muted-foreground">{t('tagline')}</p>
            </div>
          </header>
          <ClaimForm locale={locale} initialCode={code ?? ''} />
        </div>
      </div>
      <AuthVisual />
    </main>
  );
}
