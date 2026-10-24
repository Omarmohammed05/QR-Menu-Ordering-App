import {getTranslations} from 'next-intl/server';
import {requirePlatformOwner} from '@/server/platform';
import {invitesRepo, restaurantsRepo} from '@/server/db/repos';
import {env} from '@/server/env';
import {buildPublicMenuUrl} from '@/lib/public-url';
import {CreateRestaurantForm} from '@/components/admin/create-restaurant-form';
import {RestaurantCard} from '@/components/admin/restaurant-card';
import {StoreIcon} from '@/components/icons';

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
    {label: t('stats.total'), value: rows.length},
    {label: t('stats.active'), value: active},
    {label: t('stats.pending'), value: pending}
  ];

  return (
    <main className="flex min-h-dvh flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('tagline')}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {stats.map(({label, value}) => (
          <div
            key={label}
            className="flex items-center justify-between rounded-xl border border-hairline bg-surface p-4"
          >
            <span className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className="text-lg font-semibold">{value}</span>
            </span>
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted">
              <StoreIcon className="size-4" />
            </span>
          </div>
        ))}
      </div>

      <section className="flex flex-col gap-4 rounded-xl border border-hairline bg-surface p-5">
        <h2 className="text-base font-semibold">{t('create.title')}</h2>
        <CreateRestaurantForm locale={locale} />
      </section>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-hairline px-3 py-6 text-center text-sm text-muted-foreground">
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
    </main>
  );
}
