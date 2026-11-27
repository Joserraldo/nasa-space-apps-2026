import { en } from "./strings.en";
import { es } from "./strings.es";
import { extraEn, extraEs, spanishChapterText } from "./strings.extra";

export type UILanguage = "en" | "es";
export type UIStrings = Record<string, string>;

const catalogs = { en: { ...en, ...extraEn }, es: { ...es, ...extraEs, ...spanishChapterText } };
export function getUiStrings(language: UILanguage): UIStrings {
  return catalogs[language] ?? catalogs.en;
}

export function uiText(strings: UIStrings = catalogs.en) {
  const fallback: UIStrings = catalogs.en;
  return (key: string, values: Record<string, string | number> = {}) =>
    (strings[key] ?? fallback[key] ?? key).replace(/\{(\w+)\}/g, (slot, name: string) =>
      Object.hasOwn(values, name) ? String(values[name]) : slot);
}

/** Reopen the preview on the same Settings tab with all copy rebuilt in the selected language. */
export function reopenLocalizedSettings(language: UILanguage, persisted: boolean): void {
  const url = new URL(location.href);
  url.searchParams.set("settings", "play");
  if (persisted) url.searchParams.delete("language");
  else url.searchParams.set("language", language);
  location.assign(url);
}
