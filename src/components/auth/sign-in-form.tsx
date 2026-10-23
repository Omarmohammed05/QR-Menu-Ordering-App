"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { authClient } from "@/server/auth/client";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

type Credentials = z.output<typeof credentialsSchema>;

export function SignInForm({ locale }: { locale: string }) {
  const t = useTranslations("auth.signIn");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [step, setStep] = useState<"credentials" | "code">("credentials");
  const [serverError, setServerError] = useState<string | null>(null);
  const [code, setCode] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Credentials>({ resolver: zodResolver(credentialsSchema) });

  async function onCredentials(values: Credentials) {
    setServerError(null);
    const { data, error } = await authClient.signIn.email({
      email: values.email,
      password: values.password,
    });
    if (data && "twoFactorRedirect" in data && data.twoFactorRedirect) {
      setStep("code");
      return;
    }
    if (error) {
      setServerError(error.code === "INVALID_EMAIL_OR_PASSWORD" ? "invalid" : "generic");
      return;
    }
    router.push(`/${locale}/dashboard`);
    router.refresh();
  }

  async function onCode() {
    setServerError(null);
    const { error } = await authClient.twoFactor.verifyTotp({ code });
    if (error) {
      setServerError("twoFactorInvalid");
      return;
    }
    router.push(`/${locale}/dashboard`);
    router.refresh();
  }

  if (step === "code") {
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void onCode();
        }}
        className="flex flex-col gap-4"
      >
        <Field label={t("twoFactorCode")} htmlFor="code" error={serverError}>
          <Input
            id="code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            autoFocus
          />
        </Field>
        <Button type="submit" disabled={code.length !== 6}>
          {t("twoFactorSubmit")}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit(onCredentials)} className="flex flex-col gap-4" noValidate>
      <Field label={t("email")} htmlFor="email" error={errors.email ? t("invalidEmail") : null}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          enterKeyHint="next"
          {...register("email")}
        />
      </Field>
      <Field label={tCommon("password")} htmlFor="password">
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          {...register("password")}
        />
      </Field>
      {serverError ? <p className="text-sm text-[var(--danger)]">{t(serverError)}</p> : null}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? t("loading") : t("submit")}
      </Button>
    </form>
  );
}
