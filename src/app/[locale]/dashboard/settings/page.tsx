import {getTranslations} from 'next-intl/server';
import {requireMember} from '@/server/dashboard';
import {SettingsForm} from '@/components/dashboard/settings-form';

type Props = {params: Promise<{locale: string}>};

/**
 * Settings (Stitch "settings" screen): the editable tenant profile above
 * read-only branch facts (slug, timezone, currency, seat role).
 */
export default async function SettingsPage({params}: Props) {
  const {locale} = await params;
  const {membership} = await requireMember(locale);
  const {restaurant, role} = membership;

  const t = await getTranslations('dashboard.settings');
  const tRole = await getTranslations('dashboard');

  const facts: {label: string; value: string; ltr?: boolean}[] = [
    {label: t('info.slug'), value: `/r/${restaurant.slug}`, ltr: true},
    {label: t('info.timezone'), value: restaurant.timezone, ltr: true},
    {label: t('info.currency'), value: restaurant.currency, ltr: true},
    {label: t('info.role'), value: tRole(`role.${role}`)}
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('tagline')}</p>
      </div>

      <section
        style={{animationDelay: '0ms'}}
        className="animate-float-up [animation-fill-mode:backwards] rounded-xl border border-hairline bg-surface p-5 sm:p-6"
      >
        <h2 className="text-sm font-semibold">{t('profile.title')}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{t('profile.tagline')}</p>
        <div className="mt-5">
          <SettingsForm
            locale={locale}
            restaurant={{
              nameAr: restaurant.nameAr,
              nameEn: restaurant.nameEn,
              whatsappNumber: restaurant.whatsappNumber
            }}
          />
        </div>
      </section>

      <section
        style={{animationDelay: '70ms'}}
        className="animate-float-up [animation-fill-mode:backwards] rounded-xl border border-hairline bg-surface p-5 sm:p-6"
      >
        <h2 className="text-sm font-semibold">{t('info.title')}</h2>
        <dl className="mt-4 flex flex-col divide-y divide-hairline border-t border-hairline pt-1 text-sm">
          {facts.map(({label, value, ltr}) => (
            <div
              key={label}
              className="-mx-2 flex items-center justify-between gap-2 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/60"
            >
              <dt className="text-muted-foreground">{label}</dt>
              <dd dir={ltr ? 'ltr' : undefined} className="font-mono text-xs sm:text-sm">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
