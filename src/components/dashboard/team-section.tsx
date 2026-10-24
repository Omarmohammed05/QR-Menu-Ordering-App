'use client';

import {useActionState, useState, useTransition} from 'react';
import {useTranslations} from 'next-intl';
import {
  addMemberAction,
  removeMemberAction,
  updateMemberRoleAction,
  type AddMemberState,
  type MemberMutationState
} from '@/server/actions/team';

const ADD_INITIAL: AddMemberState = {};

const inputClassName =
  'h-10 min-w-0 flex-1 rounded-full border border-hairline bg-surface px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground';

export type TeamMemberView = {
  userId: string;
  name: string;
  email: string;
  role: 'owner' | 'manager' | 'staff';
};

/**
 * Team management: the restaurant's seats. Owners can seat an existing
 * account by email (sign-up is closed — no invite emails), change a member's
 * role, or remove them; everyone else sees the read-only list.
 */
export function TeamSection({
  locale,
  canManage,
  currentUserId,
  members
}: {
  locale: string;
  canManage: boolean;
  currentUserId: string;
  members: TeamMemberView[];
}) {
  const t = useTranslations('dashboard.team');
  const tRole = useTranslations('dashboard');
  const [addState, addAction, addPending] = useActionState(addMemberAction, ADD_INITIAL);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function runMutation(
    action: (prev: MemberMutationState, formData: FormData) => Promise<MemberMutationState>,
    formData: FormData
  ) {
    startTransition(async () => {
      const result = await action({}, formData);
      setMutationError(result.error ? t(`errors.${result.error}`) : null);
    });
  }

  const addError = addState.error ? t(`errors.${addState.error}`) : null;
  const roles = ['owner', 'manager', 'staff'] as const;

  return (
    <div className="flex flex-col gap-6">
      {canManage ? (
        <section
          className="animate-float-up [animation-fill-mode:backwards] rounded-xl border border-hairline bg-surface p-5 sm:p-6"
        >
          <h2 className="text-sm font-semibold">{t('add.title')}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{t('add.tagline')}</p>
          <form action={addAction} className="mt-5 flex flex-col gap-3" noValidate>
            <input type="hidden" name="locale" value={locale} />
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                name="email"
                required
                dir="ltr"
                autoComplete="off"
                placeholder={t('add.emailPlaceholder')}
                className={`${inputClassName} sm:max-w-72`}
              />
              <select
                name="role"
                aria-label={t('add.role')}
                defaultValue="staff"
                className={`${inputClassName} sm:w-40 sm:shrink-0 sm:pe-8`}
              >
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {tRole(`role.${role}`)}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={addPending}
                className="h-10 shrink-0 rounded-full bg-foreground px-5 text-sm font-medium text-background transition-[transform] duration-100 active:scale-[0.98] disabled:opacity-50"
              >
                {addPending ? t('add.working') : t('add.submit')}
              </button>
            </div>
            {addError ? (
              <p role="alert" className="text-sm font-medium">
                {addError}
              </p>
            ) : null}
          </form>
        </section>
      ) : null}

      <section
        style={{animationDelay: canManage ? '70ms' : '0ms'}}
        className="animate-float-up [animation-fill-mode:backwards] rounded-xl border border-hairline bg-surface p-5 sm:p-6"
      >
        <h2 className="text-sm font-semibold">{t('list.title')}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{t('list.tagline')}</p>
        {mutationError ? (
          <p role="alert" className="mt-3 text-sm font-medium">
            {mutationError}
          </p>
        ) : null}
        <ul className="mt-4 flex flex-col divide-y divide-hairline border-t border-hairline">
          {members.map((member) => {
            const isSelf = member.userId === currentUserId;
            return (
              <li key={member.userId} className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-sm font-medium">
                    {member.name}
                    {isSelf ? <span className="text-muted-foreground"> · {t('you')}</span> : null}
                  </span>
                  <span dir="ltr" className="truncate text-xs text-muted-foreground">
                    {member.email}
                  </span>
                </div>
                {canManage && !isSelf ? (
                  <div className="flex shrink-0 items-center gap-1.5">
                    <select
                      defaultValue={member.role}
                      disabled={pending}
                      aria-label={t('add.role')}
                      onChange={(event) => {
                        const formData = new FormData();
                        formData.set('locale', locale);
                        formData.set('userId', member.userId);
                        formData.set('role', event.currentTarget.value);
                        runMutation(updateMemberRoleAction, formData);
                      }}
                      className="h-8 rounded-full border border-hairline bg-surface px-2 text-xs outline-none transition-colors focus:border-foreground"
                    >
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {tRole(`role.${role}`)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => {
                        const formData = new FormData();
                        formData.set('locale', locale);
                        formData.set('userId', member.userId);
                        runMutation(removeMemberAction, formData);
                      }}
                      className="h-8 rounded-full border border-hairline px-3 text-xs font-medium transition-colors hover:border-foreground disabled:opacity-50"
                    >
                      {t('remove')}
                    </button>
                  </div>
                ) : (
                  <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-medium">
                    {tRole(`role.${member.role}`)}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
