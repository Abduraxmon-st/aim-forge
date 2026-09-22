import type { Metadata, Viewport } from "next";
import "../../styles/app.css";
import "../../styles/controls.css";
import "../../styles/training.css";
export const metadata: Metadata = {
  title: "AimForge — Your training ground",
  description:
    "Practice real 2D and 3D aiming, build routines, and understand your progress. Local-first, private training.",
  icons: { icon: "/favicon.svg" },
  manifest: "/manifest.webmanifest",
  robots: { index: false, follow: true },
};
export const viewport: Viewport = { themeColor: "#101116" };
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
