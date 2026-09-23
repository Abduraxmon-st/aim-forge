import { useTranslation } from "react-i18next";
import {
  Play,
  ChevronRight,
  Crosshair,
  Target,
  Zap,
  Move,
  ArrowUpRight,
  CalendarDays,
  Plus,
} from "lucide-react";
import { Link } from "../../components/router";
import { useApp } from "../../storage/store";
import { Heading, Stat, SessionTable } from "../../components/ui";
import { allTotals, dateInZone } from "../../domain/rules";
import { num, duration } from "../../i18n";
export default function Home() {
  const { t } = useTranslation(),
    { db } = useApp(),
    totals = allTotals(db),
    today = dateInZone(new Date().toISOString(), db.settings.timezone),
    active =
      (db.daily[today + "|mouse"]?.activeMs ?? 0) +
      (db.daily[today + "|touch"]?.activeMs ?? 0),
    goal = db.dayGoals[today] ?? db.settings.dailyGoal;
  const next = db.lastScenario ?? "flick-burst";
  return (
    <>
      <Heading
        eyebrow={t("LET’S GET DIALED IN")}
        title={
          db.settings.nickname
            ? t("Welcome back, {{name}}.", { name: db.settings.nickname })
            : t("A little practice. A better aim.")
        }
        description={t("Your next good session starts here.")}
      />
      <div className="home-grid">
        <section className="quick-card">
          <div>
            <span className="tag">
              {t(
                db.lastScenario
                  ? "PICK UP WHERE YOU LEFT OFF"
                  : "QUICK START · 2D",
              )}
            </span>
            <h2>{t(db.lastScenario ? next : "Find your flow.")}</h2>
            <p>{t("homeQuickDescription")}</p>
            <Link className="button primary" to={"/setup/" + next}>
              <Play size={17} fill="currentColor" />
              {t(db.lastScenario ? "Repeat last scenario" : "Start training")}
              <ChevronRight size={17} />
            </Link>
            <small>{t("60 seconds · Beginner · Your pace")}</small>
          </div>
          <div className="target-preview" aria-hidden="true">
            <div className="axis horizontal" />
            <div className="axis vertical" />
            <span className="preview-circle one" />
            <span className="preview-circle two" />
            <span className="preview-circle three" />
            <Plus size={16} className="preview-plus plus-one" />
            <Plus size={12} className="preview-plus plus-two" />
            <span className="preview-dot dot-one" />
            <span className="preview-dot dot-two" />
            <Crosshair size={29} />
            <span className="preview-label">{t("flick-burst")} / 001</span>
          </div>
        </section>
        <section className="panel goal-panel">
          <div className="section-heading">
            <span className="eyebrow">{t("DAILY FOCUS")}</span>
            <Target size={20} />
          </div>
          <h2>{t("Show up for yourself.")}</h2>
          <p>{t("dailyGoalDescription", { minutes: num(goal / 60) })}</p>
          <div className="goal-number">
            {num(active / 60000, 1)}{" "}
            <span>
              / {num(goal / 60)} {t("min")}
            </span>
          </div>
          <div className="progress-track">
            <span
              style={{ width: Math.min(100, active / (goal * 10)) + "%" }}
            />
          </div>
          <div className="subtle">
            {t(
              active >= goal * 1000
                ? "Daily goal complete. Nicely done."
                : "Your first session is a fresh start.",
            )}
          </div>
        </section>
      </div>
      <div className="stat-grid">
        <Stat
          label={t("Training time")}
          value={duration(totals.activeMs)}
          note={t("Completed training only")}
        />
        <Stat
          label={t("Completed sessions")}
          value={num(totals.sessions)}
          note={t("One focused round at a time")}
        />
        <Stat
          label={t("Training-day streak")}
          value={`${num(db.streaks.current)} ${t("days")}`}
          note={t("Longest: {{count}} days", { count: db.streaks.longest })}
        />
        <Stat
          label={t("Personal bests")}
          value={num(Object.keys(db.records).length)}
          note={t("Compatible benchmarks only")}
        />
      </div>
      <section>
        <div className="section-heading">
          <div>
            <h2>{t("Build a sharper skill set")}</h2>
            <p>{t("Different drills. One focused session at a time.")}</p>
          </div>
          <Link className="text-link" to="/training">
            {t("Explore all scenarios")}
            <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="mode-grid">
          {[
            [
              Zap,
              "flicking",
              "Fast transitions. Deliberate shots.",
              "flick-burst",
              "violet",
            ],
            [
              Move,
              "tracking",
              "Stay with it. Smooth out the motion.",
              "smooth-tracking",
              "blue",
            ],
            [
              Crosshair,
              "precision",
              "Smaller targets. Greater control.",
              "micro-precision",
              "orange",
            ],
          ].map(([Icon, title, desc, id, color]) => {
            const I = Icon as typeof Zap;
            return (
              <Link
                to={"/setup/" + id}
                className={"mode-card " + color}
                key={String(id)}
              >
                <span className="mode-icon">
                  <I size={27} />
                </span>
                <span className="eyebrow">{t("FOCUS AREA")}</span>
                <h3>{t(String(title))}</h3>
                <p>{t(String(desc))}</p>
                <span className="card-footer">
                  {t("Open scenario")}
                  <ArrowUpRight size={18} />
                </span>
              </Link>
            );
          })}
        </div>
      </section>
      <section className="panel welcome-strip">
        <div>
          <span className="eyebrow">{t("A FRESH CHALLENGE, EVERY DAY")}</span>
          <h3>{t("Same drill. A new opportunity.")}</h3>
          <p>
            {t(
              "Two seeded challenges. Unlimited retries. Your best local attempt.",
            )}
          </p>
        </div>
        <Link className="button" to="/challenges">
          <CalendarDays size={16} />
          {t("Daily challenges")}
          <ChevronRight size={17} />
        </Link>
      </section>
      {db.sessions.length > 0 ? (
        <section className="panel recent-panel">
          <div className="section-heading">
            <h2>{t("Recent sessions")}</h2>
            <Link className="text-link" to="/history">
              {t("View all")}
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <SessionTable sessions={db.sessions.slice(-4)} />
        </section>
      ) : (
        <section className="welcome-empty">
          <Crosshair size={22} />
          <div>
            <h3>{t("Your progress, without the noise.")}</h3>
            <p>
              {t(
                "Finish a round to see your real scores, training time, and personal records here.",
              )}
            </p>
          </div>
          {!db.settings.onboarded && (
            <Link className="text-link" to="/onboarding">
              {t("Quick orientation")}
              <ChevronRight size={16} />
            </Link>
          )}
        </section>
      )}
    </>
  );
}
