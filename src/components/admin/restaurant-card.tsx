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
    <li className="flex flex-col gap-5 rounded-[20px] bg-surface p-6 shadow-warm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="truncate text-[19px] font-semibold leading-[1.3] tracking-[-0.01em]">
            {restaurant.nameAr}
          </span>
          <span dir="ltr" className="mt-1 block font-mono text-xs text-warm-muted">
            /{restaurant.slug}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          {restaurant.isActive ? (
            <span className="sunrise-gradient inline-flex items-center gap-[7px] rounded-full px-[13px] py-[5px] text-xs font-medium text-white">
              <span className="size-[7px] animate-soft-pulse rounded-full bg-current" />
              {t('active')}
            </span>
          ) : (
            <span className="inline-flex items-center gap-[7px] rounded-full bg-warm-pill px-[13px] py-[5px] text-xs font-medium text-warm-muted">
              <span className="size-[7px] animate-soft-pulse rounded-full bg-current" />
              {t('inactive')}
            </span>
          )}
          <form action={setRestaurantActiveAction}>
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="restaurantId" value={restaurant.id} />
            <input type="hidden" name="makeActive" value={String(!restaurant.isActive)} />
            <button
              type="submit"
              className="h-[34px] rounded-full border border-warm-hairline bg-surface px-4 text-xs font-medium transition-[border-color,box-shadow] duration-150 hover:border-[#ff7043] hover:shadow-[0_4px_12px_rgba(255,87,34,0.16)]"
            >
              {restaurant.isActive ? t('deactivate') : t('activate')}
            </button>
          </form>
        </div>
      </div>

      {/* Fact rows: labels and values share one grid so they align in columns */}
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-[18px] gap-y-2.5 rounded-2xl bg-warm-canvas px-[18px] py-4 text-sm">
        <dt className="text-warm-muted">{t('publicMenu')}</dt>
        <dd className="min-w-0">
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            dir="ltr"
            className="block overflow-wrap-anywhere text-[13px] text-brand-strong underline underline-offset-[3px] hover:text-foreground"
          >
            {publicUrl}
          </a>
        </dd>
        <dt className="text-warm-muted">{t('whatsapp')}</dt>
        <dd dir="ltr" className="min-w-0 font-mono text-[13px]">{restaurant.whatsappNumber}</dd>
        <dt className="text-warm-muted">{t('owner')}</dt>
        <dd className="min-w-0">
          {ownerEmails.length > 0 ? (
            <span dir="ltr" className="block truncate font-mono text-[13px]">{ownerEmails.join(', ')}</span>
          ) : (
            <span className="text-xs font-medium text-warm-muted">{t('ownerPending')}</span>
          )}
        </dd>
      </dl>

      {unclaimed && shareUrl ? (
        <div className="flex flex-col gap-2.5 rounded-2xl border border-dashed border-warm-hairline bg-warm-input p-3.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-warm-muted">{t('inviteLink')}</span>
            <span dir="ltr" className="font-mono text-sm font-semibold tracking-widest">
              {unclaimed.code}
            </span>
          </div>
          <span dir="ltr" className="truncate font-mono text-[11px] text-warm-muted">
            {claimUrl}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <CopyLinkButton url={claimUrl} />
            <a
              href={shareUrl}
              target="_blank"
              rel="noreferrer"
              className="sunrise-gradient flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(230,74,25,0.3)] transition-[box-shadow,filter] duration-150 hover:brightness-[1.07] active:brightness-[0.95]"
            >
              <WhatsAppIcon className="size-4" />
              {t('sendInvite')}
            </a>
            <form action={regenerateInviteAction} className="flex-1">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="restaurantId" value={restaurant.id} />
              <button
                type="submit"
                className="h-10 w-full rounded-full border border-warm-hairline bg-surface text-sm font-medium transition-[border-color,box-shadow] duration-150 hover:border-[#ff7043] hover:shadow-[0_4px_12px_rgba(255,87,34,0.16)]"
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
            className="h-10 self-start rounded-full border-[1.5px] border-[#ff7043] bg-surface px-5 text-[13px] font-semibold text-brand-strong transition-[background,box-shadow] duration-150 hover:bg-warm-hover hover:shadow-[0_4px_12px_rgba(255,87,34,0.18)] active:bg-warm-chip"
          >
            {t('issueInvite')}
          </button>
        </form>
      ) : null}
    </li>
  );
}
