"use client";

import { useLocale } from "@/lib/i18n/locale-context";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();

  return (
    <button
      onClick={() => setLocale(locale === "en" ? "nl" : "en")}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors w-full"
    >
      <Globe className="h-5 w-5" />
      {locale === "en" ? t("settings.dutch") : t("settings.english")}
    </button>
  );
}
