"use client";
import { lazy, Suspense, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Crosshair,
  LayoutDashboard,
  Gamepad2,
  BarChart3,
  History as HistoryIcon,
  CalendarDays,
  ListVideo,
  Trophy,
  Settings as SettingsIcon,
  CircleHelp,
} from "lucide-react";
import i18n from "../i18n";
import { Link, NavLink } from "../components/router";
import { useApp } from "../storage/store";
import { STORAGE_KEY, repository } from "../storage/repository";
import { download } from "../features/sharing/share";
import Home from "../features/home/Home";
import Library from "../features/training/Library";
import Setup from "../features/training/Setup";
import { registerTools } from "./webmcp";
import { splitLocalizedPath, type Locale } from "../i18n/languages";
import { notify } from "../components/notifications";
const Arena = lazy(() => import("../features/training/Arena"));
const Results = lazy(() => import("../features/results/Results"));
const Dashboard = lazy(() => import("../features/analytics/Dashboard"));
const History = lazy(() => import("../features/history/History"));
const Challenges = lazy(() => import("../features/challenges/Challenges"));
const Routines = lazy(() => import("../features/routines/Routines"));
const Achievements = lazy(
  () => import("../features/achievements/Achievements"),
);
const Settings = lazy(() => import("../features/settings/Settings"));
const Help = lazy(() => import("../features/help/Help"));
const Onboarding = lazy(() => import("../features/onboarding/Onboarding"));
const nav = [
  ["/", "Overview", LayoutDashboard],
  ["/training", "Training library", Gamepad2],
  ["/dashboard", "My progress", BarChart3],
  ["/history", "Session history", HistoryIcon],
  ["/challenges", "Daily challenges", CalendarDays],
  ["/routines", "Routines", ListVideo],
  ["/achievements", "Achievements", Trophy],
] as const;
export default function App({ locale }: { locale?: Locale }) {
  const { t } = useTranslation(),
    { db, ready, error, hydrate, refresh } = useApp(),
    path = splitLocalizedPath(usePathname() || "/").path,
    main = useRef<HTMLElement>(null);
  useEffect(() => {
    hydrate();
    const listener = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) refresh();
    };
    window.addEventListener("storage", listener);
    const unregister = registerTools();
    return () => {
      window.removeEventListener("storage", listener);
      unregister();
    };
  }, [hydrate, refresh]);
  useEffect(() => {
    void i18n.changeLanguage(locale ?? db.settings.language);
    document.documentElement.lang = locale ?? db.settings.language;
    document.documentElement.dataset.motion = db.settings.reducedMotion
      ? "reduced"
      : "normal";
  }, [locale, db.settings.language, db.settings.reducedMotion]);
  useEffect(() => {
    main.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [path]);
  let page: React.ReactNode;
  if (path === "/") page = <Home />;
  else if (path === "/training") page = <Library />;
  else if (path.startsWith("/setup/"))
    page = <Setup key={path} id={path.split("/")[2]} />;
  else
    page = (
      {
        "/arena": <Arena />,
        "/results": <Results />,
        "/dashboard": <Dashboard />,
        "/history": <History />,
        "/challenges": <Challenges />,
        "/routines": <Routines />,
        "/achievements": <Achievements />,
        "/settings": <Settings />,
        "/help": <Help />,
        "/onboarding": <Onboarding />,
      } as Record<string, React.ReactNode>
    )[path] ?? <Home />;
  return (
    <div className={"app-shell " + (path === "/arena" ? "arena-shell" : "")}>
      <a className="skip-link" href="#content">
        {t("Skip to content")}
      </a>
      <aside className="sidebar">
        <Link className="brand" to="/">
          <span className="brand-symbol">
            <Crosshair size={24} />
          </span>
          AimForge<span className="brand-dot">.</span>
        </Link>
        <span className="nav-caption">{t("YOUR TRAINING SPACE")}</span>
        <nav aria-label={t("Main navigation")}>
          {nav.map(([p, n, I]) => (
            <NavLink key={p} to={p} end={p === "/"} title={t(n)}>
              <I size={19} />
              {t(n)}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <NavLink to="/settings" title={t("Settings")}>
            <SettingsIcon size={18} />
            {t("Settings")}
          </NavLink>
          <NavLink to="/help" title={t("Help & privacy")}>
            <CircleHelp size={18} />
            {t("Help & privacy")}
          </NavLink>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <span>{t("YOUR PERSONAL TRAINING GROUND")}</span>
          <div>
            <Link className="local-label" to="/settings">
              <span />
              {t("Local profile")}
            </Link>
            <Link className="avatar" to="/settings" aria-label={t("Settings")}>
              {db.settings.nickname
                ? db.settings.nickname.slice(0, 2).toUpperCase()
                : "AF"}
            </Link>
            <Link
              className="mobile-help"
              to="/help"
              aria-label={t("Help & privacy")}
            >
              <CircleHelp size={18} />
            </Link>
          </div>
        </header>
        <main id="content" tabIndex={-1} ref={main}>
          {error && (
            <div className="warning" role="alert">
              <p>{t(error)}</p>
              <button
                className="button"
                onClick={() => {
                  try {
                    download(
                      new Blob([repository().raw()], {
                        type: "application/json",
                      }),
                      "aimforge-recovery.json",
                    );
                    notify.success("data-downloadStarted", {
                      id: "recovery-export",
                      icon: "download",
                    });
                  } catch {
                    notify.error("Export failed.", { id: "recovery-export" });
                  }
                }}
              >
                {t("Export recovery data")}
              </button>
              <Link className="button" to="/settings">
                {t("Settings")}
              </Link>
            </div>
          )}
          <Suspense
            fallback={
              <div className="empty panel" role="status">
                {t("Loading…")}
              </div>
            }
          >
            {ready ? (
              page
            ) : (
              <div className="empty panel" role="status">
                {t("Loading your training space…")}
              </div>
            )}
          </Suspense>
          {path !== "/arena" && (
            <footer>
              <a href={`/${locale ?? db.settings.language}/training/`}>
                {t("Built for focused practice.")}
              </a>
              <span>{t("All results are local and unverified.")}</span>
            </footer>
          )}
        </main>
      </div>
    </div>
  );
}
