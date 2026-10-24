'use client';

import {useRef, useState} from 'react';
import {useTranslations} from 'next-intl';
import {uploadImageAction} from '@/server/actions/images';

type Props = {
  /** Hidden input name — repeated once per image, so the form submits all URLs. */
  name: string;
  /** Seeded URLs (edit form). */
  values: string[];
};

/**
 * imgbb multi-image picker for dish galleries: pick one or more files, each is
 * uploaded through the server action (the API key stays server-side) and its
 * URL lands in a hidden input the enclosing form submits with its save. The
 * first image is the cover. A failed upload surfaces a locale error and keeps
 * the images that already made it.
 */
export function MultiImageUpload({name, values}: Props) {
  const t = useTranslations('images');
  const fileRef = useRef<HTMLInputElement>(null);
  const [urls, setUrls] = useState<string[]>(values);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(files: FileList) {
    setBusy(true);
    setError(null);
    for (const file of Array.from(files)) {
      const data = new FormData();
      data.set('file', file);
      const result = await uploadImageAction(data);
      const url = result.url;
      if (url) {
        setUrls((prev) => [...prev, url]);
      } else {
        setError(t(`errors.${result.error ?? 'imgbb'}`));
        break;
      }
    }
    setBusy(false);
  }

  function remove(index: number) {
    setError(null);
    setUrls((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-2">
      {urls.map((url) => (
        <input key={url} type="hidden" name={name} value={url} />
      ))}
      <div className="flex flex-wrap items-center gap-2.5">
        {urls.map((url, index) => (
          <span key={url} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element -- imgbb-hosted remote image */}
            <img src={url} alt="" className="size-14 rounded-lg bg-muted object-cover" />
            <button
              type="button"
              onClick={() => remove(index)}
              aria-label={t('remove')}
              className="absolute -end-1 -top-1 grid size-5 place-items-center rounded-full bg-brand text-xs font-bold leading-none text-white shadow-sm transition-transform duration-100 hover:scale-110 active:scale-90"
            >
              ×
            </button>
          </span>
        ))}
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="h-9 rounded-full border border-hairline px-3 text-xs font-medium transition-[transform,border-color] duration-100 hover:border-brand active:scale-[0.98] disabled:opacity-50"
        >
          {busy ? t('uploading') : t('upload')}
        </button>
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
        multiple
        className="hidden"
        onChange={(event) => {
          if (event.target.files?.length) void pick(event.target.files);
          event.target.value = '';
        }}
      />
    </div>
  );
}
