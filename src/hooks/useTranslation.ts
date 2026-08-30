"use client";

import { useSettings } from "@/contexts/SettingsContext";
import { dictionaries, resolvePath } from "@/lib/i18n";
import { useCallback } from "react";

export function useTranslation() {
  const { settings } = useSettings();
  const lang = settings?.language || "en";
  
  // Fallback to English if language dictionary isn't found
  const dictionary = dictionaries[lang] || dictionaries["en"];

  const t = useCallback((key: string) => {
    const value = resolvePath(dictionary, key);
    // If the translation is missing, fallback to English
    if (value === key && lang !== "en") {
      return resolvePath(dictionaries["en"], key) || key;
    }
    return value || key;
  }, [dictionary, lang]);

  return { t, lang };
}
