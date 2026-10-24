import {getTranslations} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import {requirePlatformOwner} from '@/server/platform';
import {invitesRepo, restaurantsRepo} from '@/server/db/repos';
import {env} from '@/server/env';
import {buildPublicMenuUrl} from '@/lib/public-url';
import {CreateRestaurantForm} from '@/components/admin/create-restaurant-form';
import {RestaurantCard} from '@/components/admin/restaurant-card';
import {
  CheckIcon,
  ChevronDownIcon,
  ClockIcon,
  PlusIcon,
  SparkleIcon,
  StoreIcon
} from '@/components/icons';

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

  const [rows, invites] = await Promise.all([
    restaurantsRepo.listAllWithOwners(),
    invitesRepo.listAll()
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
    <main className="relative min-h-dvh overflow-hidden bg-warm-canvas text-warm-ink">
      {/* Header glow — warm image wash fading into the cream canvas */}
      <div aria-hidden className="sunrise-glow" />
      <div className="relative z-10 flex min-h-dvh flex-col gap-7 p-6 sm:p-8 lg:p-12">
      <header className="animate-rise flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="flex items-center gap-3 text-2xl font-semibold leading-[1.2] tracking-[-0.02em] sm:text-[32px]">
            <span className="sunrise-gradient grid size-[34px] shrink-0 place-items-center rounded-xl text-white shadow-[0_6px_14px_rgba(255,87,34,0.3)]">
              <SparkleIcon className="size-[18px]" />
            </span>
            {t('title')}
          </h1>
          <p className="max-w-2xl text-[13px] leading-relaxed text-warm-muted sm:text-[15px]">
            {t('tagline')}
          </p>
        </div>
        <Link
          href="/dashboard"
          className="flex h-[42px] shrink-0 items-center gap-2 rounded-full border border-warm-hairline bg-surface px-5 text-[13px] font-medium text-warm-ink shadow-[0_4px_14px_rgba(255,87,34,0.10)] transition-[border-color,box-shadow] duration-150 hover:border-[#ff7043] hover:shadow-[0_6px_18px_rgba(255,87,34,0.2)] active:shadow-[0_2px_6px_rgba(255,87,34,0.15)]"
        >
          <ChevronDownIcon className="size-4 rotate-90 rtl:-rotate-90" />
          {t('backToDashboard')}
        </Link>
      </header>

      {/* Platform headline numbers — same pattern as the dashboard overview */}
      <section
        style={{animationDelay: '80ms'}}
        className="animate-rise grid grid-cols-1 gap-[18px] sm:grid-cols-3"
      >
        {stats.map(({label, value, icon}, index) => (
          <div
            key={label}
            className={`flex min-h-[150px] flex-col justify-between gap-[26px] rounded-[20px] p-[22px] ${
              index === 0
                ? 'sunrise-gradient text-white shadow-warm-strong'
                : 'bg-surface shadow-warm'
            }`}
          >
            <span className="flex items-start justify-between gap-2">
              <span
                className={`text-sm leading-relaxed ${
                  index === 0 ? 'text-white/[0.88]' : 'text-warm-muted'
                }`}
              >
                {label}
              </span>
              <span
                className={`grid size-[38px] shrink-0 place-items-center rounded-full ${
                  index === 0 ? 'bg-white/[0.22] text-white' : 'bg-warm-chip text-brand-strong'
                }`}
              >
                {icon}
              </span>
            </span>
            <span className="text-[32px] font-semibold leading-none tracking-[-0.03em] tabular-nums sm:text-[40px]">
              {value}
            </span>
          </div>
        ))}
      </section>

      <section
        style={{animationDelay: '160ms'}}
        className="animate-rise rounded-[20px] bg-surface p-6 shadow-warm sm:p-7"
      >
        <div className="flex items-center gap-3.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-warm-chip text-brand-strong">
            <PlusIcon className="size-[18px]" />
          </span>
          <div>
            <h2 className="text-lg font-semibold leading-[1.3] tracking-[-0.01em]">
              {t('create.title')}
            </h2>
            <p className="mt-0.5 text-[13px] leading-relaxed text-warm-muted">
              {t('create.tagline')}
            </p>
            <i className="tick" />
          </div>
        </div>
        <div className="mt-6">
          <CreateRestaurantForm locale={locale} />
        </div>
      </section>

      <section style={{animationDelay: '240ms'}} className="animate-rise flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold leading-[1.3] tracking-[-0.01em]">
            {t('list.title')}
          </h2>
          <i className="tick" />
        </div>
        {rows.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-warm-hairline bg-surface px-4 py-8 text-center text-sm text-warm-muted shadow-warm">
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
      </div>
    </main>
  );
}
