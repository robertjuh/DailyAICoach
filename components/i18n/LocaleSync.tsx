"use client";

import { useEffect, useRef } from "react";
import { useLocale, type Locale } from "@/lib/i18n/locale-context";

// @Robert, this looks a bit dodgy, check later if we can find any bugs here
export function LocaleSync({ dbLocale }: { dbLocale: Locale }) {
  const { locale, setLocale } = useLocale();
  const synced = useRef(false);

  useEffect(() => {
    if (synced.current) return;
    synced.current = true;
    if (locale !== dbLocale) {
      setLocale(dbLocale);
    }
  }, [locale, dbLocale, setLocale]);

  return null;
}
