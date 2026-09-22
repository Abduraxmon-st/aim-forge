import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleHelp,
  Info,
  LockKeyhole,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import { useApp } from "../../storage/store";
import { Heading } from "../../components/ui";
import { Link } from "../../components/router";
import {
  getAchievementProgress,
  type AchievementProgress,
} from "../../domain/achievements";
import { num } from "../../i18n";
import { AchievementEmblem, achievementArt } from "./Artwork";

type Filter = "all" | "unlocked" | "locked" | "secret";
type Category = "all" | AchievementProgress["category"];
const categories: Category[] = [
  "all",
  "practice",
  "consistency",
  "skill",
  "discovery",
];

function Progress({ item }: { item: AchievementProgress }) {
  const { t } = useTranslation();
  const measured = item.unit === "percent" || item.id === "reaction";
  const unit = t("achievements-metric-" + item.unit);
  const value =
    item.id === "reaction" && !item.current
      ? t("achievements-no-attempt")
      : `${num(item.current, item.unit === "minutes" || item.unit === "percent" ? 1 : 0)} / ${item.id === "reaction" ? "≤ " : ""}${num(item.target)} ${unit}`;
  return (
    <div
      className={"achievement-progress-wrap" + (item.earned ? " complete" : "")}
    >
      <div className="achievement-progress-copy">
        <span>
          {t(
            item.earned
              ? "achievements-unlocked"
              : measured
                ? "achievements-best"
                : "achievements-progress",
          )}
        </span>
        {item.earned ? <Check size={14} /> : <span>{value}</span>}
      </div>
      <div
        className="achievement-progress"
        role="progressbar"
        aria-label={`${t("achievement-" + item.id)}: ${t("achievements-progress")}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(item.percent)}
        aria-valuetext={item.earned ? t("achievements-unlocked") : value}
      >
        <span style={{ "--progress": `${item.percent}%` } as CSSProperties} />
      </div>
    </div>
  );
}

function trainingPath(id?: string) {
  if (id === "routine" || id === "routines-five") return "/routines/";
  if (id === "precision") return "/setup/micro-precision/";
  if (id === "tracking" || id === "still-water")
    return "/setup/smooth-tracking/";
  if (id === "reaction") return "/setup/reaction-tap/";
  if (id === "combo" || id === "ghost" || id === "first")
    return "/setup/flick-burst/";
  return "/training/";
}

export default function Achievements() {
  const { t } = useTranslation(),
    db = useApp((state) => state.db);
  const items = useMemo(() => getAchievementProgress(db), [db]);
  const [filter, setFilter] = useState<Filter>("all"),
    [category, setCategory] = useState<Category>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const selected = items.find((item) => item.id === selectedId);
  const earned = items.filter((item) => item.earned),
    secrets = items.filter((item) => item.secret);
  const found = secrets.filter((item) => item.earned).length;
  const next = items
    .filter((item) => !item.earned && !item.secret)
    .sort((a, b) => b.percent - a.percent)[0];
  const complete = earned.length === items.length;
  const counts: Record<Filter, number> = {
    all: items.length,
    unlocked: earned.length,
    locked: items.filter((item) => !item.earned && !item.secret).length,
    secret: secrets.length,
  };
  const filtered = items.filter(
    (item) =>
      (filter === "all" ||
        (filter === "unlocked" && item.earned) ||
        (filter === "locked" && !item.earned && !item.secret) ||
        (filter === "secret" && item.secret)) &&
      (category === "all" ||
        ((!item.secret || item.earned) && item.category === category)),
  );
  const hidden = Boolean(selected?.secret && !selected.earned);
  const selectedName = selected
    ? t(hidden ? "achievements-secret-name" : "achievement-" + selected.id)
    : "";
  useEffect(() => {
    const element = dialog.current;
    if (!selectedId) {
      element?.close();
      return;
    }
    if (!element?.open) element?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [selectedId]);

  return (
    <div className="achievements-page">
      <Heading
        eyebrow={t("achievements-eyebrow")}
        title={t("Achievements")}
        description={t("achievements-intro")}
        action={
          <Link className="button" to="/training/">
            {t("achievements-start")}
            <ArrowUpRight size={16} />
          </Link>
        }
      />
      <section
        className="achievement-hero"
        aria-label={t("achievements-collected")}
      >
        <div className="achievement-collection">
          <div
            className="collection-dial"
            role="progressbar"
            aria-label={t("achievements-progress-label")}
            aria-valuemin={0}
            aria-valuemax={items.length}
            aria-valuenow={earned.length}
            aria-valuetext={t("achievements-earned-count", {
              earned: earned.length,
              total: items.length,
            })}
          >
            <svg
              className="collection-ring"
              viewBox="0 0 160 160"
              aria-hidden="true"
            >
              <circle
                className="collection-ring-track"
                cx="80"
                cy="80"
                r="73"
              />
              <circle
                className="collection-ring-value"
                cx="80"
                cy="80"
                r="73"
                pathLength="100"
                strokeDasharray="100"
                strokeDashoffset={100 - (earned.length / items.length) * 100}
              />
            </svg>
            <div className="collection-trophy">
              <Trophy size={43} strokeWidth={1.35} />
              <Sparkles className="trophy-spark first" size={15} />
              <Sparkles className="trophy-spark second" size={10} />
            </div>
          </div>
          <div className="collection-summary">
            <span className="eyebrow">{t("achievements-collected")}</span>
            <div className="collection-count" aria-hidden="true">
              <strong>{num(earned.length)}</strong>
              <span>/ {num(items.length)}</span>
            </div>
            <p>
              {t("achievements-earned-count", {
                earned: num(earned.length),
                total: num(items.length),
              })}
            </p>
            <div className="collection-secret-count">
              <Sparkles size={13} />
              {t("achievements-secrets-found", {
                count: found,
                total: num(secrets.length),
              })}
            </div>
          </div>
        </div>
        <div className="achievement-next">
          <span className="eyebrow">
            {t(complete ? "achievements-complete" : "achievements-next")}
          </span>
          {next ? (
            <>
              <div className="achievement-next-title">
                <AchievementEmblem id={next.id} small />
                <h2>{t("achievement-" + next.id)}</h2>
              </div>
              <p>{t("requirement-" + next.id)}</p>
              <div className="achievement-next-bottom">
                <Progress item={next} />
                <Link
                  className="achievement-next-link"
                  to={trainingPath(next.id)}
                  aria-label={`${t("achievements-start")}: ${t("achievement-" + next.id)}`}
                >
                  <ArrowUpRight size={20} />
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="achievement-next-title">
                <Sparkles size={26} />
                <h2>
                  {t(
                    complete
                      ? "achievements-complete"
                      : "achievements-secret-name",
                  )}
                </h2>
              </div>
              <p>
                {t(
                  complete
                    ? "achievements-complete-body"
                    : "achievements-secret-hint",
                )}
              </p>
              <Link className="achievement-text-link" to="/training/">
                {t("achievements-start")}
                <ArrowUpRight size={16} />
              </Link>
            </>
          )}
        </div>
      </section>
      <div className="achievement-toolbar">
        <div
          className="achievement-filters"
          role="group"
          aria-label={t("achievements-filter-label")}
        >
          {(["all", "unlocked", "locked", "secret"] as const).map((value) => (
            <button
              type="button"
              key={value}
              aria-pressed={filter === value}
              onClick={() => {
                setFilter(value);
                setCategory("all");
              }}
            >
              {value === "secret" && <Sparkles size={14} />}
              <span>{t("achievements-" + value)}</span>
              <span className="achievement-filter-count">
                {num(counts[value])}
              </span>
            </button>
          ))}
        </div>
        {filter !== "secret" && (
          <div
            className="achievement-categories"
            role="group"
            aria-label={t("achievements-category-label")}
          >
            {categories.map((value) => (
              <button
                type="button"
                key={value}
                aria-pressed={category === value}
                onClick={() => setCategory(value)}
              >
                {t(
                  value === "all"
                    ? "achievements-all"
                    : "achievements-category-" + value,
                )}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="achievement-grid" key={filter + category}>
        {filtered.map((item, index) => {
          const concealed = item.secret && !item.earned;
          const secretIndex =
            secrets.findIndex((secret) => secret.id === item.id) + 1;
          const name = t(
            concealed ? "achievements-secret-name" : "achievement-" + item.id,
          );
          return (
            <article
              key={item.id}
              className={
                "achievement-card " +
                (item.earned ? "is-earned" : "is-locked") +
                (item.secret ? " is-secret" : "")
              }
              data-achievement={item.id}
              style={
                {
                  "--entry-delay": `${Math.min(index, 9) * 35}ms`,
                  "--badge-color": concealed
                    ? "#aaa0d1"
                    : achievementArt[item.id].color,
                } as CSSProperties
              }
            >
              <div className="achievement-card-top">
                <AchievementEmblem
                  id={item.id}
                  earned={item.earned}
                  hidden={concealed}
                />
                <span
                  className={
                    "achievement-state " + (item.earned ? "unlocked" : "")
                  }
                >
                  {item.earned ? (
                    <Check size={12} />
                  ) : concealed ? (
                    <LockKeyhole size={11} />
                  ) : (
                    <span className="achievement-state-dot" />
                  )}
                  {t(
                    item.earned
                      ? "achievements-unlocked"
                      : concealed
                        ? "achievements-hidden"
                        : "achievements-locked",
                  )}
                </span>
              </div>
              <span
                className="achievement-category"
                id={`achievement-caption-${item.id}`}
              >
                {item.secret
                  ? t(
                      item.earned
                        ? "achievements-secret-revealed"
                        : "achievements-secret-index",
                      { number: String(secretIndex).padStart(2, "0") },
                    )
                  : t("achievements-category-" + item.category)}
              </span>
              <h2>{name}</h2>
              <p className="achievement-description">
                {t(
                  concealed
                    ? "achievements-secret-description"
                    : "requirement-" + item.id,
                )}
              </p>
              {concealed ? (
                <div className="achievement-mystery">
                  <span className="mystery-dots" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                  </span>
                  <span>
                    <LockKeyhole size={11} />
                    {t("achievements-hidden")}
                  </span>
                </div>
              ) : (
                <Progress item={item} />
              )}
              <button
                type="button"
                className="achievement-card-open"
                aria-label={`${t("achievements-view")}: ${name}`}
                aria-haspopup="dialog"
                aria-describedby={`achievement-caption-${item.id}`}
                onClick={() => setSelectedId(item.id)}
              >
                <ChevronRight
                  className="achievement-card-arrow"
                  size={17}
                  aria-hidden="true"
                />
              </button>
            </article>
          );
        })}
      </div>
      {!filtered.length && (
        <div className="achievement-empty">
          <Trophy size={33} strokeWidth={1.4} />
          <h2>
            {t(
              !earned.length && filter === "unlocked"
                ? "achievements-empty-title"
                : "achievements-empty-filter",
            )}
          </h2>
          <p>{t("achievements-empty-body")}</p>
          <Link className="button primary" to="/training/">
            {t("achievements-start")}
            <ArrowUpRight size={15} />
          </Link>
        </div>
      )}
      <p className="achievement-footnote">
        <Info size={14} />
        {t("achievements-progress-note")}
      </p>
      <dialog
        ref={dialog}
        className="achievement-dialog"
        aria-labelledby="achievement-detail-title"
        onCancel={() => setSelectedId(null)}
        onClose={() => setSelectedId(null)}
        onClick={(event) => {
          if (event.target === dialog.current) setSelectedId(null);
        }}
      >
        {selected && (
          <div
            className={
              "achievement-detail " +
              (hidden ? "is-mystery" : selected.earned ? "is-earned" : "")
            }
          >
            <button
              type="button"
              className="achievement-detail-close"
              aria-label={t("achievements-detail-close")}
              onClick={() => setSelectedId(null)}
            >
              <X size={19} />
            </button>
            <AchievementEmblem
              id={selected.id}
              earned={selected.earned}
              hidden={hidden}
              large
            />
            <span className="eyebrow">
              {t(
                hidden
                  ? "achievements-hidden"
                  : selected.secret
                    ? "achievements-secret-revealed"
                    : "achievements-category-" + selected.category,
              )}
            </span>
            <h2 id="achievement-detail-title">{selectedName}</h2>
            <p>
              {t(
                hidden
                  ? "achievements-secret-description"
                  : "requirement-" + selected.id,
              )}
            </p>
            {hidden ? (
              <div className="achievement-detail-hint">
                <CircleHelp size={16} />
                {t("achievements-secret-hint")}
              </div>
            ) : (
              <Progress item={selected} />
            )}
            <Link
              className="button primary"
              to={trainingPath(hidden ? undefined : selected.id)}
              onClick={() => setSelectedId(null)}
            >
              {t("achievements-start")}
              <ArrowUpRight size={16} />
            </Link>
          </div>
        )}
      </dialog>
    </div>
  );
}
