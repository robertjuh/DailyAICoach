"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import en from "./dictionaries/en.json";
import nl from "./dictionaries/nl.json";

export type Locale = "en" | "nl";

type Dictionary = Record<string, Record<string, string>>;

const dictionaries: Record<Locale, Dictionary> = { en, nl };

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: "en",
  setLocale: () => {},
  t: (key) => key,
});

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [dict, setDict] = useState<Dictionary>(dictionaries[initialLocale]);

  const setLocale = useCallback(async (newLocale: Locale) => {
    setLocaleState(newLocale);
    setDict(dictionaries[newLocale]);
    try {
      await fetch("/api/v1/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: newLocale }),
      });
    } catch {
      // Silently fail — UI already updated
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const [ns, ...rest] = key.split(".");
      const k = rest.join(".");
      let value = dict[ns]?.[k] ?? key;
      if (params) {
        for (const [param, replacement] of Object.entries(params)) {
          value = value.replace(`{${param}}`, String(replacement));
        }
      }
      return value;
    },
    [dict]
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export const useLocale = () => useContext(LocaleContext);
