"use client";

import { useLocale } from "@/lib/i18n/locale-context";
import { Globe } from "lucide-react";

export function LanguageToggle() {
  const { locale, setLocale, t } = useLocale();

  return (
    <button
      onClick={() => setLocale(locale === "en" ? "nl" : "en")}
      className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      aria-label={t("settings.language")}
    >
      <Globe className="h-4 w-4" />
      {locale === "en" ? t("settings.dutch") : t("settings.english")}
    </button>
  );
}
