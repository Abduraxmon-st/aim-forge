import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowUpRight, X } from "lucide-react";
import { useApp } from "../../storage/store";
import { Link } from "../../components/router";
import { AchievementEmblem } from "./Artwork";

export default function UnlockNotice() {
  const { t } = useTranslation(),
    ready = useApp((state) => state.ready),
    queue = useApp((state) => state.achievementNotices),
    dismiss = useApp((state) => state.dismissAchievementNotice);
  const [paused, setPaused] = useState(false);
  const current = ready ? queue[0] : undefined;
  useEffect(() => {
    if (!current || paused) return;
    const timer = window.setTimeout(() => dismiss(current), 7000);
    return () => window.clearTimeout(timer);
  }, [current, paused, dismiss]);
  if (!current) return null;
  return (
    <aside
      className="achievement-unlock-notice"
      aria-label={t("achievements-celebration")}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setPaused(false);
      }}
    >
      <AchievementEmblem key={current} id={current} earned small />
      <div>
        <div role="status" aria-live="polite">
          <span className="eyebrow">{t("achievements-celebration")}</span>
          <strong>{t("achievement-" + current)}</strong>
        </div>
        <Link to="/achievements/" onClick={() => dismiss()}>
          {t("achievements-view-collection")}
          <ArrowUpRight size={13} />
        </Link>
      </div>
      <button
        type="button"
        aria-label={t("achievements-detail-close")}
        onClick={() => {
          setPaused(false);
          dismiss(current);
        }}
      >
        <X size={16} />
      </button>
    </aside>
  );
}
