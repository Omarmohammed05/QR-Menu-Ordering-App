'use client';

import {useRef, useState} from 'react';
import {useTranslations} from 'next-intl';
import {uploadImageAction} from '@/server/actions/images';

type Props = {
  /** Current image URL (seeded) — persisted through the form's hidden field. */
  value: string | null;
  /** Hidden input name carrying the imgbb URL into the save action. */
  name: string;
  /** Aspect of the preview box. */
  rounded?: 'lg' | 'full';
  onUploaded?: (url: string) => void;
};

/**
 * imgbb image picker: file → server action (the API key stays server-side)
 * → URL lands in a hidden input the enclosing form submits with its save.
 * No imgbb key or failed upload surfaces a locale error, never a silent no-op.
 */
export function ImageUpload({value, name, rounded = 'lg', onUploaded}: Props) {
  const t = useTranslations('images');
  const fileRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(value);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(file: File) {
    setBusy(true);
    setError(null);
    const data = new FormData();
    data.set('file', file);
    const result = await uploadImageAction(data);
    setBusy(false);
    if (result.url) {
      setUrl(result.url);
      onUploaded?.(result.url);
    } else {
      setError(t(`errors.${result.error ?? 'imgbb'}`));
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name={name} value={url ?? ''} />
      <div className="flex items-center gap-3">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element -- imgbb-hosted remote image
          <img
            src={url}
            alt=""
            className={`size-14 shrink-0 bg-muted object-cover ${
              rounded === 'full' ? 'rounded-full' : 'rounded-lg'
            }`}
          />
        ) : (
          <span
            className={`grid size-14 shrink-0 place-items-center bg-muted text-muted-foreground ${
              rounded === 'full' ? 'rounded-full' : 'rounded-lg'
            }`}
          >
            {t('empty')}
          </span>
        )}
        <div className="flex flex-col items-start gap-1.5">
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="rounded-full border border-hairline px-3 py-1.5 text-xs font-medium transition-[transform,border-color] duration-100 hover:border-foreground active:scale-[0.98] disabled:opacity-50"
          >
            {busy ? t('uploading') : url ? t('change') : t('upload')}
          </button>
          {url ? (
            <button
              type="button"
              onClick={() => setUrl(null)}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {t('remove')}
            </button>
          ) : null}
        </div>
      </div>
      {error ? (
        <p role="alert" className="text-xs font-medium">
          {error}
        </p>
      ) : null}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void pick(file);
          event.target.value = '';
        }}
      />
    </div>
  );
}
