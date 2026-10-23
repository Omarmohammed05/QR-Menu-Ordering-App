"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

/**
 * Menu QR panel on the manage screen: the PNG is generated server-side from
 * the public menu URL (absolute, built from the request host) and offered
 * for printing (download) together with a copy-link button.
 */
export function QrPanel({
  dataUrl,
  url,
  fileName,
}: {
  dataUrl: string;
  url: string;
  fileName: string;
}) {
  const t = useTranslations("menu.qr");
  const tCommon = useTranslations("common");
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-[var(--line)] p-5">
      <h2 className="text-lg font-semibold">{t("title")}</h2>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={dataUrl}
          alt={t("alt")}
          className="h-40 w-40 shrink-0 rounded-[var(--radius-sm)] border border-[var(--line)]"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <code
            dir="ltr"
            className="block truncate rounded-[var(--radius-sm)] bg-[var(--bg-muted)] px-3 py-2 text-xs text-[var(--fg-muted)]"
          >
            {url}
          </code>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={copyLink}>
              {copied ? tCommon("copied") : t("copy")}
            </Button>
            <a
              href={dataUrl}
              download={`${fileName}.png`}
              className="inline-flex min-h-12 items-center rounded-[var(--radius-pill)] bg-[var(--invert-bg)] px-5 py-2 text-sm font-medium text-[var(--invert-fg)]"
            >
              {t("download")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
