"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createInstance } from "i18next";
import { I18nextProvider } from "react-i18next";
import { resources } from "../i18n/resources";
import { type Locale } from "../i18n/languages";
import { useApp } from "../storage/store";
import Library from "../features/training/Library";

export function LocalizedRuntime({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  // A separate instance per rendered tree prevents one locale's static render
  // from changing another locale's content through the global app singleton.
  const [instance] = useState(() => {
    const i18n = createInstance();
    void i18n.init({
      resources,
      lng: locale,
      fallbackLng: "en",
      keySeparator: false,
      initAsync: false,
      interpolation: { escapeValue: false },
      returnNull: false,
    });
    return i18n;
  });
  const ready = useApp((state) => state.ready),
    applied = useRef<string>("");
  const hydrate = useApp((state) => state.hydrate);
  useEffect(hydrate, [hydrate]);
  useEffect(() => {
    if (!ready || applied.current === locale) return;
    applied.current = locale;
    if (useApp.getState().db.settings.language !== locale)
      void useApp.getState().settings({ language: locale });
  }, [ready, locale]);
  return <I18nextProvider i18n={instance}>{children}</I18nextProvider>;
}
export function PublicLibrary() {
  return <Library />;
}
