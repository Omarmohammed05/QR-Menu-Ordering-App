import {getTranslations} from 'next-intl/server';
import {buildWhatsAppUrl} from '@/lib/whatsapp';
import type {Restaurant} from '@/server/db/repos';
import type {restaurantInvites} from '@/server/db/schema';
import {regenerateInviteAction, setRestaurantActiveAction} from '@/server/actions/admin';
import {CopyLinkButton} from '@/components/dashboard/copy-link-button';
import {WhatsAppIcon} from '@/components/icons';

type Props = {
  locale: string;
  restaurant: Restaurant;
  ownerEmails: string[];
  invite: typeof restaurantInvites.$inferSelect | null;
  claimUrl: string;
  publicUrl: string;
};

/** One platform restaurant: public identity, owner status, invite handoff. */
export async function RestaurantCard({
  locale,
  restaurant,
  ownerEmails,
  invite,
  claimUrl,
  publicUrl
}: Props) {
  const t = await getTranslations('admin.list');
  const unclaimed = invite && !invite.claimedAt ? invite : null;
  const shareUrl = unclaimed
    ? buildWhatsAppUrl(
        restaurant.whatsappNumber,
        t('shareText', {name: restaurant.nameAr, url: claimUrl, code: unclaimed.code})
      )
    : null;

  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-hairline bg-surface shadow-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="truncate text-base font-semibold">{restaurant.nameAr}</span>
          <span dir="ltr" className="truncate font-mono text-xs text-muted-foreground">
            /{restaurant.slug}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {restaurant.isActive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-medium text-white">
              <span className="size-1.5 rounded-full bg-current" />
              {t('active')}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              <span className="size-1.5 rounded-full bg-current" />
              {t('inactive')}
            </span>
          )}
          <form action={setRestaurantActiveAction}>
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="restaurantId" value={restaurant.id} />
            <input type="hidden" name="makeActive" value={String(!restaurant.isActive)} />
            <button
              type="submit"
              className="h-8 rounded-full border border-hairline px-3 text-xs font-medium transition-[transform,border-color] duration-100 hover:border-brand active:scale-[0.95]"
            >
              {restaurant.isActive ? t('deactivate') : t('activate')}
            </button>
          </form>
        </div>
      </div>

      {/* Fact rows: labels and values share one grid so they align in columns */}
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm">
        <dt className="text-muted-foreground">{t('publicMenu')}</dt>
        <dd className="min-w-0">
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            dir="ltr"
            className="block truncate underline underline-offset-2 hover:text-foreground"
          >
            {publicUrl}
          </a>
        </dd>
        <dt className="text-muted-foreground">{t('whatsapp')}</dt>
        <dd dir="ltr" className="min-w-0 font-mono text-xs">{restaurant.whatsappNumber}</dd>
        <dt className="text-muted-foreground">{t('owner')}</dt>
        <dd className="min-w-0">
          {ownerEmails.length > 0 ? (
            <span dir="ltr" className="block truncate text-xs">{ownerEmails.join(', ')}</span>
          ) : (
            <span className="text-xs font-medium text-muted-foreground">{t('ownerPending')}</span>
          )}
        </dd>
      </dl>

      {unclaimed && shareUrl ? (
        <div className="flex flex-col gap-2.5 rounded-lg border border-dashed border-hairline bg-muted/40 p-3.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">{t('inviteLink')}</span>
            <span dir="ltr" className="font-mono text-sm font-semibold tracking-widest">
              {unclaimed.code}
            </span>
          </div>
          <span dir="ltr" className="truncate font-mono text-[11px] text-muted-foreground">
            {claimUrl}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <CopyLinkButton url={claimUrl} />
            <a
              href={shareUrl}
              target="_blank"
              rel="noreferrer"
              className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-brand px-4 text-sm font-medium text-white transition-[transform] duration-100 active:scale-[0.98]"
            >
              <WhatsAppIcon className="size-4" />
              {t('sendInvite')}
            </a>
            <form action={regenerateInviteAction} className="flex-1">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="restaurantId" value={restaurant.id} />
              <button
                type="submit"
                className="h-10 w-full rounded-full border border-hairline text-sm font-medium transition-[transform,border-color] duration-100 hover:border-brand active:scale-[0.98]"
              >
                {t('regenerate')}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {ownerEmails.length === 0 && !unclaimed ? (
        <form action={regenerateInviteAction}>
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="restaurantId" value={restaurant.id} />
          <button
            type="submit"
            className="h-9 rounded-full border border-hairline px-4 text-xs font-medium transition-[transform,border-color] duration-100 hover:border-brand active:scale-[0.95]"
          >
            {t('issueInvite')}
          </button>
        </form>
      ) : null}
    </li>
  );
}
