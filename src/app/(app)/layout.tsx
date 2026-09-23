import type { Metadata, Viewport } from "next";
import { AppToasts } from "../../components/notifications";
import { MotionPreferences } from "../../components/MotionPreferences";
import "../../styles/app.css";
import "../../styles/controls.css";
import "../../styles/training.css";
import "../../styles/achievements.css";
import "../../styles/motion.css";
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
    <html lang="en" data-motion="pending" suppressHydrationWarning>
      <body>
        {children}
        <MotionPreferences />
        <AppToasts />
      </body>
    </html>
  );
}
