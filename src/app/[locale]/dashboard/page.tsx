import {getTranslations} from 'next-intl/server';
import {requireMember} from '@/server/dashboard';

type Props = {params: Promise<{locale: string}>};

/** Dashboard overview: the tenant's core facts. Feature sections grow here. */
export default async function DashboardPage({params}: Props) {
  const {locale} = await params;
  const {session, membership} = await requireMember(locale);
  const t = await getTranslations('dashboard');
  const {role, restaurant} = membership;

  return (
    <div className="flex flex-col gap-6">
      <span className="w-fit rounded-full border border-hairline px-3 py-1 text-xs tracking-wide text-muted-foreground">
        {t('phase')}
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{restaurant.nameAr}</h1>
        <p className="text-base text-muted-foreground">
          {t('signedInAs')} <span dir="ltr">{session.user.email}</span>
        </p>
      </div>
      <dl className="flex flex-col gap-2 border-t border-hairline pt-4 text-sm">
        <div className="flex items-center justify-between gap-2">
          <dt className="text-muted-foreground">{t('publicSlug')}</dt>
          <dd dir="ltr" className="font-mono">
            /r/{restaurant.slug}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-muted-foreground">{t('whatsappLabel')}</dt>
          <dd dir="ltr" className="font-mono">
            {restaurant.whatsappNumber}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-muted-foreground">{t('roleLabel')}</dt>
          <dd>{t(`role.${role}`)}</dd>
        </div>
      </dl>
    </div>
  );
}
