import {getTranslations} from 'next-intl/server';
import {DEMO_ADDRESSES, DEMO_HOURS} from '@/components/dashboard-demo/demo-data';
import {DemoButton} from '@/components/dashboard-demo/demo-button';
import {DemoImagePicker} from '@/components/dashboard-demo/demo-image-picker';

type Props = {params: Promise<{locale: string}>};

/** Demo of settings — the full editable profile as preview-only fields. */
export default async function DashboardDemoSettingsPage({params}: Props) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'dashboard.settings'});
  const tDash = await getTranslations({locale, namespace: 'dashboard'});
  const tMock = await getTranslations({locale, namespace: 'dashboardDemo'});

  const slug = tMock('mock.slug');
  const inputClasses =
    'min-w-0 flex-1 rounded-base border border-hairline bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground';
  const labelClasses = 'flex flex-col gap-1.5';
  const labelSpan = 'text-sm font-medium';

  const facts: {label: string; value: string; ltr?: boolean}[] = [
    {label: t('info.slug'), value: `/${slug}`, ltr: true},
    {label: t('info.role'), value: tDash('role.owner')}
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('tagline')}</p>
      </div>

      {/* Profile */}
      <section className="animate-float-up [animation-fill-mode:backwards] rounded-xl border border-hairline bg-surface p-5 sm:p-6">
        <h2 className="text-sm font-semibold">{t('profile.title')}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{t('profile.tagline')}</p>
        <div className="mt-5 flex flex-col gap-4">
          {/* Logo — read-only stand-in for the real image upload */}
          <DemoImagePicker rounded="full" />
          <label className={labelClasses}>
            <span className={labelSpan}>{t('profile.nameAr')}</span>
            <input type="text" defaultValue={tMock('mock.restaurant')} className={inputClasses} />
          </label>
          <label className={labelClasses}>
            <span className={labelSpan}>{t('profile.nameEn')}</span>
            <input type="text" dir="ltr" defaultValue={tMock('mock.restaurantEn')} className={inputClasses} />
          </label>
          <label className={labelClasses}>
            <span className={labelSpan}>{t('slug.label')}</span>
            <span dir="ltr" className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">/</span>
              <input type="text" dir="ltr" defaultValue={slug} className={inputClasses} />
            </span>
          </label>
          <label className={labelClasses}>
            <span className={labelSpan}>{t('profile.whatsapp')}</span>
            <input type="tel" dir="ltr" defaultValue={tMock('mock.phone')} className={inputClasses} />
            <span className="text-xs text-muted-foreground">{t('profile.whatsappHint')}</span>
          </label>
          <label className={labelClasses}>
            <span className={labelSpan}>{t('profile.instapay')}</span>
            <input type="text" dir="ltr" defaultValue={tMock('mock.instapay')} className={inputClasses} />
            <span className="text-xs text-muted-foreground">{t('profile.instapayHint')}</span>
          </label>
          <DemoButton className="self-start rounded-base bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-[transform] duration-100 active:scale-[0.98]">
            {t('profile.save')}
          </DemoButton>
        </div>
      </section>

      {/* Branch preferences */}
      <section
        style={{animationDelay: '70ms'}}
        className="animate-float-up [animation-fill-mode:backwards] rounded-xl border border-hairline bg-surface p-5 sm:p-6"
      >
        <h2 className="text-sm font-semibold">{t('branch.title')}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{t('branch.tagline')}</p>
        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end">
          <label className={`${labelClasses} flex-1`}>
            <span className={labelSpan}>{t('branch.timezone')}</span>
            <select className={inputClasses} defaultValue="Africa/Cairo">
              <option value="Africa/Cairo">Africa/Cairo</option>
            </select>
          </label>
          <label className={`${labelClasses} flex-1`}>
            <span className={labelSpan}>{t('branch.currency')}</span>
            <select className={inputClasses} defaultValue="EGP">
              <option value="EGP">EGP</option>
            </select>
          </label>
          <DemoButton className="rounded-base bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-[transform] duration-100 active:scale-[0.98]">
            {t('branch.save')}
          </DemoButton>
        </div>
      </section>

      {/* Addresses */}
      <section
        style={{animationDelay: '140ms'}}
        className="animate-float-up [animation-fill-mode:backwards] rounded-xl border border-hairline bg-surface p-5 sm:p-6"
      >
        <h2 className="text-sm font-semibold">{t('addresses.title')}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{t('addresses.tagline')}</p>
        <ul className="mt-4 flex flex-col divide-y divide-hairline">
          {DEMO_ADDRESSES.map((address) => (
            <li key={address.id} className="flex flex-wrap items-center gap-3 py-3">
              <span className="flex min-w-0 flex-col">
                <span className="font-medium">{tMock(address.labelKey)}</span>
                <span className="truncate text-sm text-muted-foreground">
                  {tMock(address.addressKey)}
                </span>
              </span>
              <span className="ms-auto flex items-center gap-2">
                <DemoButton className="rounded-base border border-hairline px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted">
                  {t('addresses.edit')}
                </DemoButton>
                <DemoButton className="rounded-base border border-hairline px-2.5 py-1 text-xs font-medium text-accent transition-colors hover:bg-muted">
                  {t('addresses.delete')}
                </DemoButton>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Opening hours */}
      <section
        style={{animationDelay: '210ms'}}
        className="animate-float-up [animation-fill-mode:backwards] rounded-xl border border-hairline bg-surface p-5 sm:p-6"
      >
        <h2 className="text-sm font-semibold">{t('hours.title')}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{t('hours.tagline')}</p>
        <ul className="mt-4 flex flex-col divide-y divide-hairline">
          {DEMO_HOURS.map(({id, weekday}) => (
            <li key={id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
              <span className="min-w-24 font-medium">{t(`hours.days.${weekday}`)}</span>
              <span className="flex items-center gap-2 text-muted-foreground">
                {t('hours.opens')} {tMock('mock.hours.opens')} — {t('hours.closes')}{' '}
                {tMock('mock.hours.closes')}
              </span>
              <DemoButton className="ms-auto rounded-base border border-hairline px-2.5 py-1 text-xs font-medium text-accent transition-colors hover:bg-muted">
                {t('hours.delete')}
              </DemoButton>
            </li>
          ))}
        </ul>
      </section>

      {/* Read-only facts */}
      <section
        style={{animationDelay: '280ms'}}
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
