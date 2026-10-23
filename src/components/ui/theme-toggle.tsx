"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function readInitialTheme(): Theme {
  const stored = window.localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  const t = useTranslations("placeholder.theme");
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(readInitialTheme());
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  function toggle() {
    setTheme((previous) => {
      const next: Theme = previous === "dark" ? "light" : "dark";
      window.localStorage.setItem("theme", next);
      return next;
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t("toggle")}
      className="inline-flex min-h-12 items-center rounded-[var(--radius-pill)] border border-[var(--line-strong)] px-5 py-2 text-sm"
    >
      {theme === "dark" ? t("light") : t("dark")}
    </button>
  );
}
