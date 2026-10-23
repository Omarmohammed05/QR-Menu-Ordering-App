"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { updateWhatsAppNumberAction } from "@/server/actions/restaurant-settings";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

/**
 * Restaurant settings panel on the manage screen (owner-only,
 * permission "restaurant.edit"). Empty input clears the number.
 */
export function RestaurantSettingsPanel({
  restaurantId,
  initialWhatsappNumber,
}: {
  restaurantId: string;
  initialWhatsappNumber: string;
}) {
  const t = useTranslations("menu.settings");
  const [whatsappNumber, setWhatsappNumber] = useState(initialWhatsappNumber);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setSaved(false);
    setError(null);
    const result = await updateWhatsAppNumberAction({ restaurantId, whatsappNumber });
    if (result.ok) {
      setWhatsappNumber(result.data.whatsappNumber ?? "");
      setSaved(true);
    } else {
      setError(result.code === "INVALID_PHONE" || result.code === "INVALID_INPUT" ? t("invalidPhone") : t("genericError"));
    }
    setBusy(false);
  }

  return (
    <section className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--bg-subtle)] p-5 shadow-[var(--shadow-sm)]">
      <h2 className="text-lg font-semibold">{t("title")}</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Field label={t("whatsappLabel")} htmlFor="whatsapp-number" hint={t("whatsappHint")}>
          <Input
            id="whatsapp-number"
            dir="ltr"
            inputMode="tel"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            placeholder="+201000000000"
            maxLength={20}
          />
        </Field>
        {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={busy}>
            {t("save")}
          </Button>
          {saved ? <span className="text-sm text-[var(--fg-muted)]">{t("savedMsg")}</span> : null}
        </div>
      </form>
    </section>
  );
}
