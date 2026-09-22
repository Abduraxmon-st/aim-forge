import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { resources } from "./resources";
void i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  keySeparator: false,
  interpolation: { escapeValue: false },
  returnNull: false,
});
export default i18n;
export const num = (n: number | null | undefined, digits = 0) =>
  n == null || !Number.isFinite(n)
    ? "—"
    : new Intl.NumberFormat(i18n.language, {
        maximumFractionDigits: Math.min(3, Math.max(0, Math.trunc(digits))),
      }).format(n);
export const decimal = (n: number) =>
  Number.isFinite(n) ? Number(n.toFixed(3)) : 0;
export const duration = (ms: number) =>
  `${num(ms / 60000, 1)} ${i18n.t("min")}`;
export const dateLabel = (iso: string) =>
  new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium" }).format(
    new Date(iso.length === 10 ? iso + "T12:00:00" : iso),
  );
