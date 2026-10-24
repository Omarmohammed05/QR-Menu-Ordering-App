'use client';

import {useActionState, useEffect, useRef, useState} from 'react';
import {useTranslations} from 'next-intl';
import {createItemAction, type CreateItemState} from '@/server/actions/menu';
import {MultiImageUpload} from '@/components/dashboard/multi-image-upload';
import {CloseIcon, PlusIcon} from '@/components/icons';

type Category = {id: string; nameAr: string};

/**
 * Top-of-page entry point for adding a product: a two-step dialog that first
 * asks for the product type (menu section), then the details and images.
 */
export function AddProductButton({locale, categories}: {locale: string; categories: Category[]}) {
  const t = useTranslations('menuManagement');
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(createItemAction, {} as CreateItemState);
  const submitted = useRef(false);

  // Close the dialog once a submitted form comes back without an error.
  useEffect(() => {
    if (submitted.current && !pending) {
      submitted.current = false;
      if (!state.error) {
        setOpen(false);
        setCategoryId(null);
      }
    }
  }, [pending, state]);

  const inputClass =
    'rounded-base border border-hairline bg-surface px-3.5 py-2.5 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-brand';
  const error = state.error ? t(`errors.${state.error}`) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setCategoryId(null);
          setOpen(true);
        }}
        className="flex shrink-0 items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-card transition-[transform,opacity] duration-100 hover:opacity-90 active:scale-[0.98]"
      >
        <PlusIcon className="size-4" />
        {t('addProduct')}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('addProduct')}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div className="flex max-h-[85vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-2xl border border-hairline bg-surface p-5 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold">
                {categoryId ? t('productDetails') : t('chooseType')}
              </h2>
              <button
                type="button"
                aria-label={t('close')}
                onClick={() => setOpen(false)}
                className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <CloseIcon className="size-4" />
              </button>
            </div>

            {categoryId ? (
              <form
                action={formAction}
                className="flex flex-col gap-3"
                noValidate
                onSubmit={() => {
                  submitted.current = true;
                }}
              >
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="categoryId" value={categoryId} />
                <MultiImageUpload name="imageUrls" values={[]} />
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium">{t('itemName')}</span>
                  <input
                    type="text"
                    name="nameAr"
                    required
                    autoComplete="off"
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium">{t('itemDescription')}</span>
                  <textarea
                    name="descriptionAr"
                    rows={4}
                    autoComplete="off"
                    className={`${inputClass} min-h-24 resize-y`}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium">{t('price')}</span>
                  <input
                    type="text"
                    name="price"
                    required
                    dir="ltr"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder={t('pricePlaceholder')}
                    className={inputClass}
                  />
                </label>
                {error ? (
                  <p role="alert" className="text-sm font-medium">
                    {error}
                  </p>
                ) : null}
                <div className="flex items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setCategoryId(null)}
                    className="rounded-base border border-hairline px-4 py-2 text-sm font-medium transition-[transform] duration-100 active:scale-[0.98]"
                  >
                    {t('back')}
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition-[transform,opacity] duration-100 hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                  >
                    {pending ? t('working') : t('addItem')}
                  </button>
                </div>
              </form>
            ) : categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('emptyCategories')}</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setCategoryId(category.id)}
                    className="rounded-base border border-hairline px-3 py-2.5 text-sm font-medium transition-[transform,border-color] duration-100 hover:border-brand active:scale-[0.98]"
                  >
                    {category.nameAr}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
