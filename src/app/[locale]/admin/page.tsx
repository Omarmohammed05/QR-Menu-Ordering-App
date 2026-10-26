import {getTranslations} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import {requirePlatformOwner} from '@/server/platform';
import {durationsRepo, invitesRepo, restaurantsRepo} from '@/server/db/repos';
import {env} from '@/server/env';
import {buildPublicMenuUrl} from '@/lib/public-url';
import {CreateRestaurantForm} from '@/components/admin/create-restaurant-form';
import {DurationsSection} from '@/components/admin/durations-section';
import {RestaurantCard} from '@/components/admin/restaurant-card';
import {CheckIcon, ChevronDownIcon, ClockIcon, PlusIcon, StoreIcon} from '@/components/icons';

type Props = {params: Promise<{locale: string}>};

/**
 * Platform-owner admin page — the ONLY place restaurants are created. Each
 * creation issues an owner invite (claim link + code); the restaurant owner
 * uses it on /claim to create their account. Guarded to the account whose
 * email matches PLATFORM_OWNER_EMAIL.
 */
export default async function AdminPage({params}: Props) {
  const {locale} = await params;
  await requirePlatformOwner(locale);
  const t = await getTranslations('admin');

  const [rows, invites, durations] = await Promise.all([
    restaurantsRepo.listAllWithOwners(),
    invitesRepo.listAll(),
    durationsRepo.list()
  ]);
  const inviteByRestaurant = new Map(invites.map((invite) => [invite.restaurantId, invite]));
  const pending = invites.filter((invite) => !invite.claimedAt).length;
  const active = rows.filter(({restaurant}) => restaurant.isActive).length;

  const stats = [
    {label: t('stats.total'), value: rows.length, icon: <StoreIcon className="size-4" />},
    {label: t('stats.active'), value: active, icon: <CheckIcon className="size-4" />},
    {label: t('stats.pending'), value: pending, icon: <ClockIcon className="size-4" />}
  ];

  return (
    <main className="flex min-h-dvh flex-col gap-6 bg-surface-raised px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('tagline')}</p>
        </div>
        <Link
          href="/dashboard"
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-hairline bg-surface px-4 text-xs font-medium transition-[transform,border-color] duration-100 hover:border-foreground active:scale-[0.97]"
        >
          <ChevronDownIcon className="size-4 rotate-90 rtl:-rotate-90" />
          {t('backToDashboard')}
        </Link>
      </div>

      {/* Platform headline numbers — same pattern as the dashboard overview */}
      <section
        style={{animationDelay: '60ms'}}
        className="animate-float-up [animation-fill-mode:backwards] grid grid-cols-3 gap-3"
      >
        {stats.map(({label, value, icon}) => (
          <div
            key={label}
            className="flex flex-col justify-between gap-3 rounded-xl border border-hairline bg-surface p-4 sm:p-5"
          >
            <span className="flex items-start justify-between gap-2">
              <span className="text-xs leading-relaxed text-muted-foreground">{label}</span>
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted">
                {icon}
              </span>
            </span>
            <span className="text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
              {value}
            </span>
          </div>
        ))}
      </section>

      <section
        style={{animationDelay: '120ms'}}
        className="animate-float-up [animation-fill-mode:backwards] rounded-xl border border-hairline bg-surface p-5 sm:p-6"
      >
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted">
            <PlusIcon className="size-4" />
          </span>
          <span className="flex flex-col">
            <h2 className="text-sm font-semibold">{t('create.title')}</h2>
            <p className="text-xs text-muted-foreground">{t('create.tagline')}</p>
          </span>
        </div>
        <div className="mt-5">
          <CreateRestaurantForm locale={locale} />
        </div>
      </section>

      <DurationsSection locale={locale} durations={durations} />

      <section
        style={{animationDelay: '180ms'}}
        className="animate-float-up [animation-fill-mode:backwards] flex flex-col gap-3"
      >
        <h2 className="text-sm font-semibold">{t('list.title')}</h2>
        {rows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-hairline bg-surface px-3 py-6 text-center text-sm text-muted-foreground">
            {t('list.empty')}
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {rows.map(({restaurant, ownerEmails}) => {
              const invite = inviteByRestaurant.get(restaurant.id) ?? null;
              const code = invite && !invite.claimedAt ? invite.code : '';
              const claimUrl =
                locale === 'en'
                  ? `${env.NEXT_PUBLIC_APP_URL}/en/claim?code=${code}`
                  : `${env.NEXT_PUBLIC_APP_URL}/claim?code=${code}`;
              return (
                <RestaurantCard
                  key={restaurant.id}
                  locale={locale}
                  restaurant={restaurant}
                  ownerEmails={ownerEmails}
                  invite={invite}
                  claimUrl={claimUrl}
                  publicUrl={buildPublicMenuUrl(env.NEXT_PUBLIC_APP_URL, restaurant.slug, 'ar')}
                />
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
