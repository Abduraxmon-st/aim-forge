import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import es from "./locales/es.json";
import de from "./locales/de.json";
import ru from "./locales/ru.json";
import uz from "./locales/uz.json";
void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
    de: { translation: de },
    ru: { translation: ru },
    uz: { translation: uz },
  },
  lng: "en",
  fallbackLng: "en",
  keySeparator: false,
  interpolation: { escapeValue: false },
  returnNull: false,
});
export default i18n;
export const num = (n: number | null | undefined, digits = 0) =>
  n == null
    ? "—"
    : new Intl.NumberFormat(i18n.language, {
        maximumFractionDigits: digits,
      }).format(n);
export const duration = (ms: number) =>
  `${num(ms / 60000, 1)} ${i18n.t("min")}`;
export const dateLabel = (iso: string) =>
  new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium" }).format(
    new Date(iso.length === 10 ? iso + "T12:00:00" : iso),
  );
