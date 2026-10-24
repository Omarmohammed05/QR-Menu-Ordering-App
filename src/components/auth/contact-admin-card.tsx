import {getTranslations} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import {contactAdminUrl} from '@/lib/contact';
import {StoreIcon, WhatsAppIcon} from '@/components/icons';

/**
 * Sign-up is closed: restaurants (and their owner accounts) are created only
 * by the platform owner through invite codes. Everyone else lands on this
 * card — a direct WhatsApp line to the owner.
 */
export async function ContactAdminCard() {
  const t = await getTranslations('auth.contact');
  const whatsappUrl = contactAdminUrl(t('prefilled'));

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-hairline bg-surface p-8 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
        <StoreIcon className="size-6" />
      </span>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-sm leading-6 text-muted-foreground">{t('body')}</p>
      </div>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        className="flex h-11 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background transition-[transform] duration-100 active:scale-[0.98]"
      >
        <WhatsAppIcon className="size-4" />
        {t('button')}
      </a>
      <Link href="/login" className="text-sm text-muted-foreground underline underline-offset-4">
        {t('backToLogin')}
      </Link>
    </div>
  );
}
