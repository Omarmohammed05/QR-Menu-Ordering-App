import {notFound} from 'next/navigation';
import {getTranslations} from 'next-intl/server';
import {restaurantsRepo, createRestaurantRepos} from '@/server/db/repos';
import {DemoHeader} from '@/components/dashboard-demo/demo-header';
import {DemoCard} from '@/components/dashboard-demo/demo-card';

export const dynamic = 'force-dynamic';

type Fact = {label: string; value: string; ltr?: boolean};

/** Warm dl block — the read-only fact rows the demo settings page shows. */
function FactList({facts}: {facts: Fact[]}) {
  return (
    <dl className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2.5 rounded-2xl bg-warm-canvas px-[18px] py-4 text-sm">
      {facts.map(({label, value, ltr}) => (
        <div key={label} className="col-span-2 grid grid-cols-subgrid">
          <dt className="text-warm-muted">{label}</dt>
          <dd
            dir={ltr ? 'ltr' : undefined}
            className={`min-w-0 text-[13px] ${ltr ? 'font-mono' : ''}`}
          >
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Demo of the settings surface: the same tenant profile the editable form
 * shows, rendered as pure facts — nothing here can be changed.
 */
export default async function DemoSettingsPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const t = await getTranslations('dashboard.settings');
  const tRole = await getTranslations('dashboard');

  const restaurant = await restaurantsRepo.findBySlug('demo');
  if (!restaurant) notFound();
  const {addresses, hours} = createRestaurantRepos(restaurant.id);
  const [addressRows, hourRows] = await Promise.all([addresses.list(), hours.list()]);

  return (
    <>
      <DemoHeader title={t('title')} tagline={t('tagline')} />

      <DemoCard delay={80}>
        <h2 className="text-sm font-semibold">{t('profile.title')}</h2>
        <p className="mt-1 text-xs text-warm-muted">{t('profile.tagline')}</p>
        <FactList
          facts={[
            {label: t('profile.nameAr'), value: restaurant.nameAr},
            ...(restaurant.nameEn ? [{label: t('profile.nameEn'), value: restaurant.nameEn, ltr: true}] : []),
            {label: t('profile.whatsapp'), value: restaurant.whatsappNumber, ltr: true},
            ...(restaurant.instapayHandle
              ? [{label: t('profile.instapay'), value: restaurant.instapayHandle, ltr: true}]
              : [])
          ]}
        />
      </DemoCard>

      <DemoCard delay={150}>
        <h2 className="text-sm font-semibold">{t('branch.title')}</h2>
        <p className="mt-1 text-xs text-warm-muted">{t('branch.tagline')}</p>
        <FactList
          facts={[
            {label: t('branch.timezone'), value: restaurant.timezone, ltr: true},
            {label: t('branch.currency'), value: restaurant.currency, ltr: true}
          ]}
        />
      </DemoCard>

      <DemoCard delay={220}>
        <h2 className="text-sm font-semibold">{t('addresses.title')}</h2>
        <p className="mt-1 text-xs text-warm-muted">{t('addresses.tagline')}</p>
        {addressRows.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-warm-hairline px-4 py-6 text-center text-xs text-warm-muted">
            {t('addresses.empty')}
          </p>
        ) : (
          <FactList
            facts={addressRows.map(({label, address}) => ({label, value: address}))}
          />
        )}
      </DemoCard>

      <DemoCard delay={290}>
        <h2 className="text-sm font-semibold">{t('hours.title')}</h2>
        <p className="mt-1 text-xs text-warm-muted">{t('hours.tagline')}</p>
        <FactList
          facts={hourRows.map(({weekday, opensAt, closesAt}) => ({
            label: t(`hours.days.${weekday}`),
            value: `${opensAt.slice(0, 5)} – ${closesAt.slice(0, 5)}`,
            ltr: true
          }))}
        />
      </DemoCard>

      <DemoCard delay={360}>
        <h2 className="text-sm font-semibold">{t('info.title')}</h2>
        <FactList
          facts={[
            {label: t('info.slug'), value: `/${restaurant.slug}`, ltr: true},
            {label: t('info.role'), value: tRole('role.owner')}
          ]}
        />
      </DemoCard>
    </>
  );
}
