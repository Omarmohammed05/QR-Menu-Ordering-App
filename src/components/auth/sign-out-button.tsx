"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/server/auth/client";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await authClient.signOut();
          void router.push("/sign-in");
        })
      }
    >
      {t("signOut")}
    </Button>
  );
}
