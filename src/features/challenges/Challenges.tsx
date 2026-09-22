import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CalendarDays, ArrowRight } from "lucide-react";
import { useApp } from "../../storage/store";
import { dailyConfig } from "../../engine/scenarios/catalog";
import { comparisonKey, dateInZone, addDays } from "../../domain/rules";
import { Heading, Goal, Badge, Stat } from "../../components/ui";
import { Link } from "../../components/router";
import { num, duration } from "../../i18n";
export default function Challenges() {
  const { t } = useTranslation(),
    { db } = useApp(),
    [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const day = new Date(now).toISOString().slice(0, 10),
    reset = new Date(day + "T00:00:00Z").getTime() + 86400000 - now,
    h = Math.floor(reset / 3600000),
    m = Math.floor(reset / 60000) % 60,
    s = Math.floor(reset / 1000) % 60,
    today = dateInZone(new Date(now).toISOString(), db.settings.timezone),
    weekStart = addDays(today, -6),
    week = Object.entries(db.daily)
      .filter(([k]) => k.slice(0, 10) >= weekStart)
      .reduce((n, [, v]) => n + v.activeMs, 0),
    month = Object.entries(db.monthly)
      .filter(([k]) => k.startsWith(today.slice(0, 7)))
      .reduce((n, [, v]) => n + v.activeMs, 0);
  return (
    <>
      <Heading
        eyebrow={t("A FRESH CHALLENGE, EVERY DAY")}
        title={t("Daily challenges")}
        description={t(
          "Two seeded challenges. Unlimited retries. Your best local attempt.",
        )}
        action={
          <Badge>
            <CalendarDays size={15} />
            {t("Resets in")} {h}:{String(m).padStart(2, "0")}:
            {String(s).padStart(2, "0")} UTC
          </Badge>
        }
      />
      <div className="two-columns">
        {(["2d", "3d"] as const).map((dim) => {
          const c = dailyConfig(dim, day, db.settings),
            best = db.dailyBest[c.challengeId + "|" + comparisonKey(c)];
          return (
            <section className="panel challenge-card" key={dim}>
              <div className="section-heading">
                <Badge color="violet">
                  {dim.toUpperCase()} · {t("DAILY CHALLENGE")}
                </Badge>
                <Badge color={best?.won ? "green" : ""}>
                  {t(best?.won ? "Completed" : "Open challenge")}
                </Badge>
              </div>
              <h2>{t(c.scenario)}</h2>
              <p>{t(c.scenario + "Desc")}</p>
              <div className="goal-box">
                <span className="eyebrow">{t("WIN CONDITION · V1")}</span>
                <p>
                  <Goal config={c} />
                </p>
              </div>
              <dl className="details-list">
                <div>
                  <dt>{t("Best local score")}</dt>
                  <dd>{best ? num(best.score) : "—"}</dd>
                </div>
                <div>
                  <dt>{t("Duration")}</dt>
                  <dd>60 {t("s")}</dd>
                </div>
                <div>
                  <dt>{t("Input")}</dt>
                  <dd>{t(c.input)}</dd>
                </div>
              </dl>
              <Link
                className="button primary full"
                to={"/setup/" + c.scenario + "/?daily=" + day}
              >
                {t(best ? "Try again" : "Take the challenge")}
                <ArrowRight size={16} />
              </Link>
            </section>
          );
        })}
      </div>
      <p className="retention-note">{t("dailyRules")}</p>
      <div className="stat-grid">
        <Stat
          label={t("Challenge win streak")}
          value={num(db.streaks.wins)}
          note={t("Standard challenges only")}
        />
        <Stat
          label={t("Longest win streak")}
          value={num(db.streaks.longestWins)}
        />
        <Stat
          label={t("Weekly training goal")}
          value={`${num(week / 60000, 1)} / ${num(db.settings.weeklyGoal / 60)} ${t("min")}`}
          note={t("Last seven training dates")}
        />
        <Stat label={t("This month")} value={duration(month)} />
      </div>
    </>
  );
}
