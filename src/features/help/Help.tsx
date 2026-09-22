import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Accessibility,
  ArrowUpRight,
  BarChart3,
  ChevronRight,
  Crosshair,
  Database,
  Download,
  Fingerprint,
  Flame,
  Keyboard,
  Monitor,
  MousePointer2,
  Scale,
  ShieldCheck,
  WifiOff,
} from "lucide-react";
import { Heading } from "../../components/ui";
import { Link } from "../../components/router";

const sections = [
  { id: "controls", icon: MousePointer2, group: "help-navTraining" },
  { id: "metrics", icon: BarChart3, group: "help-navTraining" },
  { id: "comparisons", icon: Scale, group: "help-navTraining" },
  { id: "streaks", icon: Flame, group: "help-navTraining" },
  { id: "privacy", icon: ShieldCheck, group: "help-navData" },
  { id: "retention", icon: Database, group: "help-navData" },
  { id: "browser", icon: Monitor, group: "help-navDevice" },
  { id: "offline", icon: WifiOff, group: "help-navDevice" },
  { id: "accessibility", icon: Accessibility, group: "help-navDevice" },
] as const;
const shortcuts = [
  ["Click to hit", "help-primaryButton", MousePointer2],
  ["Hold to track", "help-holdMove", Crosshair],
  ["Move mouse to look", "help-mouse3d", Monitor],
  ["Pause", "Esc", Keyboard],
] as const;

export default function Help() {
  const { t } = useTranslation();
  const [active, setActive] = useState<string>("controls");

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      let current: string = sections[0].id;
      for (const section of sections) {
        const element = document.getElementById("help-" + section.id);
        if (element && element.getBoundingClientRect().top <= 150)
          current = section.id;
      }
      if (
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 8
      )
        current = sections[sections.length - 1].id;
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="help-page">
      <Heading
        eyebrow={t("help-eyebrow")}
        title={t("Help & privacy")}
        description={t("Know your tools. Own your progress.")}
        action={
          <Link className="button" to="/setup/flick-burst">
            <Crosshair size={16} aria-hidden="true" />
            {t("Try 2D practice")}
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        }
      />
      <div className="help-layout">
        <nav className="help-nav" aria-label={t("help-navigation")}>
          {sections.map(({ id, icon: Icon, group }, index) => (
            <div className="help-nav-item" key={id}>
              {(index === 0 || sections[index - 1].group !== group) && (
                <span className="help-nav-caption">{t(group)}</span>
              )}
              <a
                href={"#help-" + id}
                aria-current={active === id ? "location" : undefined}
                onClick={() => setActive(id)}
              >
                <Icon size={16} aria-hidden="true" />
                <span>{t("help-short-" + id)}</span>
                <ChevronRight
                  size={13}
                  className="help-nav-arrow"
                  aria-hidden="true"
                />
              </a>
            </div>
          ))}
        </nav>
        <div className="help-content">
          {sections.map(({ id, icon: Icon }, index) => (
            <section
              className={"help-section help-section-" + id}
              id={"help-" + id}
              aria-labelledby={"help-heading-" + id}
              tabIndex={-1}
              key={id}
            >
              <div className="help-section-heading">
                <span className="help-section-icon">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <h2 id={"help-heading-" + id}>{t("help-" + id)}</h2>
                <span className="help-section-number" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              {id === "controls" && (
                <div className="help-shortcuts">
                  {shortcuts.map(([label, key, ShortcutIcon]) => (
                    <div className="help-shortcut" key={label}>
                      <ShortcutIcon size={16} aria-hidden="true" />
                      <span>{t(label)}</span>
                      <kbd>{key === "Esc" ? "Esc" : t(key)}</kbd>
                    </div>
                  ))}
                </div>
              )}
              {id === "metrics" && (
                <div className="help-metric-grid">
                  <div>
                    <span>{t("help-clickAccuracy")}</span>
                    <strong>{t("help-accuracyFormula")}</strong>
                  </div>
                  <div>
                    <span>{t("Tracking")}</span>
                    <strong>{t("help-trackingFormula")}</strong>
                  </div>
                  <div>
                    <span>{t("help-reactionTime")}</span>
                    <strong>{t("help-reactionFormula")}</strong>
                  </div>
                </div>
              )}
              {id === "privacy" && (
                <div className="help-privacy-note">
                  <Fingerprint size={18} aria-hidden="true" />
                  <span>{t("help-localNote")}</span>
                </div>
              )}
              <p>{t("help-" + id + "Body")}</p>
              {id === "retention" && (
                <Link className="help-inline-link" to="/settings">
                  <Download size={15} aria-hidden="true" />
                  {t("help-backupAction")}
                  <ArrowUpRight size={14} aria-hidden="true" />
                </Link>
              )}
              {(id === "offline" || id === "accessibility") && (
                <Link className="help-inline-link" to="/settings">
                  {t("Settings")}
                  <ArrowUpRight size={14} aria-hidden="true" />
                </Link>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
