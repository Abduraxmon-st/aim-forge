import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import type { Locale } from "../i18n/languages";
import "../styles/app.css";
import "../styles/controls.css";
import "../styles/training.css";
import "../styles/seo.css";

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
    <html lang={locale} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
