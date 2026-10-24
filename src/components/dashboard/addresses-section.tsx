'use client';

import {useActionState, useState, useTransition} from 'react';
import {useTranslations} from 'next-intl';
import {
  addAddressAction,
  deleteAddressAction,
  updateAddressAction,
  type AddressMutationState
} from '@/server/actions/addresses';

const INITIAL_STATE: AddressMutationState = {};

const inputClassName =
  'h-10 min-w-0 flex-1 rounded-full border border-hairline bg-surface px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground';

export type BranchAddress = {id: string; label: string; address: string};

/**
 * Branch addresses: the restaurant's physical locations, editable here and
 * rendered to customers on the public menu. Add form on top, one row per
 * branch with inline edit and delete.
 */
export function AddressesSection({locale, addresses}: {locale: string; addresses: BranchAddress[]}) {
  const t = useTranslations('dashboard.settings.addresses');
  const [addState, addAction, addPending] = useActionState(addAddressAction, INITIAL_STATE);
  const [editState, setEditState] = useState<AddressMutationState>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPending, startTransition] = useTransition();

  // Saved edit → collapse the inline form back to the row.
  function handleEdit(formData: FormData) {
    startTransition(async () => {
      const result = await updateAddressAction({}, formData);
      setEditState(result);
      if (!result.error) setEditingId(null);
    });
  }

  const addError = addState.error ? t(`errors.${addState.error}`) : null;
  const editing = addresses.find((a) => a.id === editingId) ?? null;

  return (
    <div className="mt-5 flex flex-col gap-4">
      <form action={addAction} className="flex flex-col gap-3" noValidate>
        <input type="hidden" name="locale" value={locale} />
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            name="label"
            required
            dir="rtl"
            autoComplete="off"
            placeholder={t('labelPlaceholder')}
            className={`${inputClassName} sm:max-w-44`}
          />
          <input
            type="text"
            name="address"
            required
            dir="rtl"
            autoComplete="off"
            placeholder={t('addressPlaceholder')}
            className={inputClassName}
          />
          <button
            type="submit"
            disabled={addPending}
            className="h-10 shrink-0 rounded-full bg-foreground px-5 text-sm font-medium text-background transition-[transform] duration-100 active:scale-[0.98] disabled:opacity-50"
          >
            {addPending ? t('working') : t('add')}
          </button>
        </div>
        {addError ? (
          <p role="alert" className="text-sm font-medium">
            {addError}
          </p>
        ) : null}
      </form>

      {addresses.length === 0 && !editing ? (
        <p className="rounded-lg border border-dashed border-hairline px-3 py-4 text-center text-sm text-muted-foreground">
          {t('empty')}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-hairline border-y border-hairline">
          {addresses.map((entry) => (
            <li key={entry.id} className="flex flex-col gap-2 py-3">
              {editingId === entry.id ? (
                <form action={handleEdit} className="flex flex-col gap-2" noValidate>
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="addressId" value={entry.id} />
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      name="label"
                      required
                      dir="rtl"
                      defaultValue={entry.label}
                      className={`${inputClassName} sm:max-w-44`}
                    />
                    <input
                      type="text"
                      name="address"
                      required
                      dir="rtl"
                      defaultValue={entry.address}
                      className={inputClassName}
                    />
                  </div>
                  {editState.error ? (
                    <p role="alert" className="text-sm font-medium">
                      {t(`errors.${editState.error}`)}
                    </p>
                  ) : null}
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={editPending}
                      className="h-9 rounded-full bg-foreground px-4 text-xs font-medium text-background transition-[transform] duration-100 active:scale-[0.98] disabled:opacity-50"
                    >
                      {editPending ? t('working') : t('save')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="h-9 rounded-full border border-hairline px-4 text-xs font-medium transition-colors hover:border-foreground"
                    >
                      {t('cancel')}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-sm font-medium">{entry.label}</span>
                    <span className="truncate text-xs text-muted-foreground">{entry.address}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditingId(entry.id)}
                      className="h-8 rounded-full border border-hairline px-3 text-xs font-medium transition-colors hover:border-foreground"
                    >
                      {t('edit')}
                    </button>
                    <form action={deleteAddressAction}>
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="addressId" value={entry.id} />
                      <button
                        type="submit"
                        className="h-8 rounded-full border border-hairline px-3 text-xs font-medium transition-colors hover:border-foreground"
                      >
                        {t('delete')}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
