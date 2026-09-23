import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import type { Locale } from "../i18n/languages";
import { AppToasts } from "../components/notifications";
import { MotionPreferences } from "../components/MotionPreferences";
import "../styles/app.css";
import "../styles/controls.css";
import "../styles/training.css";
import "../styles/seo.css";
import "../styles/achievements.css";
import "../styles/motion.css";

export const siteRootMetadata: Metadata = {
  applicationName: "AimForge",
  icons: { icon: "/favicon.svg", apple: "/icon-192.png" },
  manifest: "/manifest.webmanifest",
  robots: { index: false, follow: true },
};
export const siteViewport: Viewport = { themeColor: "#101116" };
export function LocalizedRoot({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  return (
    <html lang={locale} data-motion="pending" suppressHydrationWarning>
      <body>
        {children}
        <MotionPreferences />
        <AppToasts locale={locale} />
      </body>
    </html>
  );
}
