import {getTranslations} from 'next-intl/server';
import {DEMO_TEAM} from '@/components/dashboard-demo/demo-data';
import {DemoButton} from '@/components/dashboard-demo/demo-button';
import {PersonIcon} from '@/components/icons';

type Props = {params: Promise<{locale: string}>};

/** Demo of team management — the read-only roster with a preview add form. */
export default async function DashboardDemoTeamPage({params}: Props) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'dashboard.team'});
  const tDash = await getTranslations({locale, namespace: 'dashboard'});

  const inputClasses =
    'min-w-0 flex-1 rounded-base border border-hairline bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('tagline')}</p>
      </div>

      {/* Seat a member */}
      <section className="animate-float-up [animation-fill-mode:backwards] rounded-xl border border-hairline bg-surface p-5">
        <h2 className="text-sm font-semibold">{t('add.title')}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{t('add.tagline')}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <input type="email" placeholder={t('add.emailPlaceholder')} className={inputClasses} />
          <select
            aria-label={t('add.role')}
            className="rounded-base border border-hairline bg-surface px-3 py-2.5 text-sm text-foreground"
          >
            {(['manager', 'staff'] as const).map((role) => (
              <option key={role} value={role}>
                {tDash(`role.${role}`)}
              </option>
            ))}
          </select>
          <DemoButton className="rounded-base bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-[transform] duration-100 active:scale-[0.98]">
            {t('add.submit')}
          </DemoButton>
        </div>
      </section>

      {/* Roster */}
      <section className="animate-fade-in rounded-xl border border-hairline bg-surface p-5">
        <h2 className="text-sm font-semibold">{t('list.title')}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{t('list.tagline')}</p>
        <ul className="mt-4 flex flex-col divide-y divide-hairline">
          {DEMO_TEAM.map((member, index) => (
            <li
              key={member.id}
              style={{animationDelay: `${index * 60}ms`}}
              className="animate-float-up [animation-fill-mode:backwards] -mx-2 flex flex-wrap items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted/60"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted">
                <PersonIcon className="size-5" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="flex items-center gap-1.5 font-medium">
                  {t(member.nameKey)}
                  {member.role === 'owner' ? (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {t('you')}
                    </span>
                  ) : null}
                </span>
                <span dir="ltr" className="truncate text-xs text-muted-foreground">
                  {t(member.emailKey)}
                </span>
              </span>
              <span className="ms-auto flex items-center gap-2">
                <span className="rounded-full border border-hairline bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {tDash(`role.${member.role}`)}
                </span>
                {member.role !== 'owner' ? (
                  <DemoButton className="rounded-base border border-hairline px-2.5 py-1 text-xs font-medium text-accent transition-colors hover:bg-muted">
                    {t('remove')}
                  </DemoButton>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
