export const supportedLocales = ["en", "es", "de", "ru", "uz"] as const;
export type Locale = (typeof supportedLocales)[number];
export const localeNames: Record<Locale, string> = {
  en: "English",
  es: "Español",
  de: "Deutsch",
  ru: "Русский",
  uz: "O‘zbekcha",
};
export const isLocale = (value: string): value is Locale =>
  supportedLocales.includes(value as Locale);

export function splitLocalizedPath(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  const locale = isLocale(parts[0] ?? "") ? (parts[0] as Locale) : undefined;
  return { locale, path: "/" + (locale ? parts.slice(1) : parts).join("/") };
}
export function localizeHref(href: string, locale?: Locale) {
  if (
    !locale ||
    !href.startsWith("/") ||
    href.startsWith("//") ||
    isLocale(href.split(/[/?#]/)[1] ?? "")
  )
    return href;
  return `/${locale}${href === "/" ? "/" : href}`;
}
