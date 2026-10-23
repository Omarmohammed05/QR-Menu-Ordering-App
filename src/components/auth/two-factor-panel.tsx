"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { authClient } from "@/server/auth/client";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type Step = "idle" | "password" | "enroll" | "verify" | "done";

export function TwoFactorPanel({ initialEnabled }: { initialEnabled: boolean }) {
  const t = useTranslations("auth.security");
  const tCommon = useTranslations("common");
  const [enabled, setEnabled] = useState(initialEnabled);
  const [step, setStep] = useState<Step>(initialEnabled ? "idle" : "idle");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const secret = totpUri ? new URL(totpUri).searchParams.get("secret") : null;

  useEffect(() => {
    if (!totpUri) return;
    QRCode.toString(totpUri, { type: "svg", margin: 1 })
      .then(setQrSvg)
      .catch(() => setQrSvg(null));
  }, [totpUri]);

  async function onStartEnable(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const { data, error: enableError } = await authClient.twoFactor.enable({
      password,
      method: "totp",
    });
    setBusy(false);
    setPassword("");
    if (enableError) {
      setError(enableError.code === "INVALID_PASSWORD" ? "wrongPassword" : "generic");
      return;
    }
    if (data?.method === "totp") {
      setTotpUri(data.totpURI ?? null);
      setBackupCodes(Array.isArray(data.backupCodes) ? data.backupCodes : []);
      setStep("enroll");
    }
  }

  async function onVerify(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const { error: verifyError } = await authClient.twoFactor.verifyTotp({ code });
    setBusy(false);
    if (verifyError) {
      setError("invalidCode");
      return;
    }
    setEnabled(true);
    setStep("done");
  }

  async function onDisable(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const { error: disableError } = await authClient.twoFactor.disable({ password });
    setBusy(false);
    setPassword("");
    if (disableError) {
      setError(disableError.code === "INVALID_PASSWORD" ? "wrongPassword" : "generic");
      return;
    }
    setEnabled(false);
    setStep("idle");
  }

  if (enabled) {
    return (
      <form onSubmit={onDisable} className="flex flex-col gap-4">
        <p className="text-sm text-[var(--fg-muted)]">{t("statusEnabled")}</p>
        <Field label={t("passwordPrompt")} htmlFor="disable-password">
          <Input
            id="disable-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
        {error ? <p className="text-sm text-[var(--danger)]">{t(error)}</p> : null}
        <Button type="submit" variant="ghost" disabled={busy || password.length === 0}>
          {t("disable")}
        </Button>
      </form>
    );
  }

  if (step === "enroll" || step === "verify") {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-[var(--fg-muted)]">{t("scanQr")}</p>
        {qrSvg ? (
          <div
            className="w-44 [&>svg]:h-full [&>svg]:w-full"
            // Library-generated SVG from a server-produced otpauth URI.
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
        ) : null}
        {secret ? (
          <p className="font-mono text-xs break-all text-[var(--fg-muted)]">
            {t("secret")}: {secret}
          </p>
        ) : null}
        <div className="rounded-[var(--radius-md)] border border-[var(--line)] p-4">
          <p className="mb-2 text-sm font-medium">{t("backupCodes")}</p>
          <p className="mb-3 text-xs text-[var(--fg-subtle)]">{t("backupCodesHint")}</p>
          <ul className="grid grid-cols-2 gap-1 font-mono text-xs">
            {backupCodes.map((backupCode) => (
              <li key={backupCode}>{backupCode}</li>
            ))}
          </ul>
        </div>
        <form onSubmit={onVerify} className="flex flex-col gap-4">
          <Field label={t("codeLabel")} htmlFor="totp-code" error={error ? t(error) : null}>
            <Input
              id="totp-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
            />
          </Field>
          <Button type="submit" disabled={busy || code.length !== 6}>
            {t("verify")}
          </Button>
        </form>
      </div>
    );
  }

  if (step === "done") {
    return <p className="text-sm">{t("verified")}</p>;
  }

  return (
    <form onSubmit={onStartEnable} className="flex flex-col gap-4">
      <Field label={t("passwordPrompt")} htmlFor="enable-password" error={error ? t(error) : null}>
        <Input
          id="enable-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </Field>
      <Button type="submit" disabled={busy || password.length === 0}>
        {busy ? tCommon("loading") : t("enable")}
      </Button>
    </form>
  );
}
