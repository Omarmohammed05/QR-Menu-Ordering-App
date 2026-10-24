'use server';

import {requireMember} from '@/server/dashboard';
import {env} from '@/server/env';

/** Machine-readable failure codes; the form maps them to locale strings. */
export type UploadImageState = {url?: string; error?: 'file' | 'size' | 'forbidden' | 'imgbb'};

/** imgbb accepts images up to 32MB; we cap uploads well under it. */
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Server-side imgbb upload — the API key never reaches the browser. Any signed-in
 * member may upload (the image becomes a dish/section/logo URL only through the
 * role-guarded save actions), so the surface is as safe as the menu itself.
 */
export async function uploadImageAction(formData: FormData): Promise<UploadImageState> {
  await requireMember('ar');
  if (!env.IMGBB_API_KEY) return {error: 'imgbb'};

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return {error: 'file'};
  if (file.size > MAX_BYTES) return {error: 'size'};

  const upload = new FormData();
  upload.set('key', env.IMGBB_API_KEY);
  upload.set('image', file);

  try {
    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: upload
    });
    if (!response.ok) return {error: 'imgbb'};
    const json = (await response.json()) as {data?: {url?: string}};
    const url = json.data?.url;
    if (!url) return {error: 'imgbb'};
    return {url};
  } catch {
    return {error: 'imgbb'};
  }
}
