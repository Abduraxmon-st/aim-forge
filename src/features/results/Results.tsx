import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Trophy,
  RotateCcw,
  ArrowRight,
  Download,
  Copy,
  Share2,
} from "lucide-react";
import { useApp } from "../../storage/store";
import { type Session } from "../../domain/models";
import {
  coaching,
  isTracking,
  isReaction,
  median,
  percentile,
  ratio,
} from "../../domain/rules";
import { Heading, Stat, Badge, Empty, Goal } from "../../components/ui";
import { Link } from "../../components/router";
import { num, duration } from "../../i18n";
import {
  resultText,
  resultImage,
  download,
  challengeLink,
} from "../sharing/share";
import { expandRoutine } from "../../storage/repository";
export default function Results() {
  const { t } = useTranslation(),
    { db, unsaved, save } = useApp(),
    [id, setId] = useState(""),
    [share, setShare] = useState(false),
    [notice, setNotice] = useState("");
  useEffect(
    () => setId(new URLSearchParams(location.search).get("id") ?? ""),
    [],
  );
  const s = unsaved?.id === id ? unsaved : db.sessions.find((s) => s.id === id);
  if (!s)
    return (
      <Empty
        title={t("Result unavailable")}
        description={t(
          "This session may have been compacted or belongs to another browser.",
        )}
        to="/history"
        label={t("Session history")}
      />
    );
  const previous = db.sessions
      .filter(
        (p) =>
          p.id !== s.id &&
          p.comparisonKey === s.comparisonKey &&
          p.eligible &&
          p.startedAt < s.startedAt,
      )
      .at(-1),
    record = db.records[s.comparisonKey],
    isBest = s.eligible && record?.id === s.id,
    coach = coaching(s, db.sessions),
    text = resultText(s, db.settings.nickname);
  const routine =
    db.routineProgress &&
    db.routines.find((r) => r.id === db.routineProgress?.routineId);
  const steps = routine ? expandRoutine(routine) : [];
  const next = routine && db.routineProgress && steps[db.routineProgress.step];
  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setNotice("Copied.");
    } catch {
      setNotice("Copy the text below.");
    }
  }
  return (
    <>
      <Heading
        title={t(
          s.status === "aborted" ? "Session ended" : "Session complete.",
        )}
        description={t(s.config.scenario) + " · " + t(s.config.difficulty)}
        eyebrow={t("YOUR RESULTS")}
        action={
          <Badge color={s.eligible ? "green" : ""}>
            {t(s.eligible ? "Benchmark eligible" : "Practice result")}
          </Badge>
        }
      />
      {unsaved?.id === id && (
        <div role="alert" className="warning">
          {t("Result not saved. Export it before leaving.")}
          <button
            className="button"
            onClick={() =>
              download(
                new Blob([JSON.stringify(s, null, 2)], {
                  type: "application/json",
                }),
                "aimforge-unsaved-result.json",
              )
            }
          >
            {t("Export result")}
          </button>
          <button className="button" onClick={() => void save(s)}>
            {t("Retry save")}
          </button>
        </div>
      )}
      <section className="result-hero panel">
        <div>
          <span className="eyebrow">{t("SESSION SCORE")}</span>
          <div className="big-score">{num(s.score)}</div>
          <div className="badges">
            {isBest && (
              <Badge color="violet">
                <Trophy size={14} />
                {t("Personal best")}
              </Badge>
            )}
            <Badge color={s.won ? "green" : ""}>
              {t(s.won ? "Goal reached" : "Keep practicing")}
            </Badge>
          </div>
        </div>
        <div className="result-goal">
          <h3>
            <Goal config={s.config} />
          </h3>
          <p>{t("Application-defined goal, not a professional rank.")}</p>
          {previous && s.eligible ? (
            <p>
              {t("Previous comparable score")}: {num(previous.score)}{" "}
              <strong className="accent">
                ({s.score - previous.score >= 0 ? "+" : ""}
                {num(s.score - previous.score)})
              </strong>
            </p>
          ) : (
            <p>{t("No previous comparable result.")}</p>
          )}
          {!s.eligible && (
            <p>
              {t(
                s.interruption === "none"
                  ? "Practice and custom runs do not set benchmark records."
                  : "Interrupted runs are practice only.",
              )}{" "}
              {s.interruption !== "none" && t(s.interruption)}
            </p>
          )}
        </div>
      </section>
      <div className="stat-grid result-stats">
        {isTracking(s.config.scenario) ? (
          <>
            <Stat
              label={t("Tracking")}
              value={
                num(ratio(s.metrics.onTargetMs, s.metrics.exposureMs), 1) + "%"
              }
            />
            <Stat
              label={t("Time on target")}
              value={num(s.metrics.onTargetMs / 1000, 2) + " " + t("s")}
            />
            <Stat
              label={t("Eligible exposure")}
              value={num(s.metrics.exposureMs / 1000, 2) + " " + t("s")}
            />
            <Stat
              label={t("Longest tracking segment")}
              value={num(s.metrics.longestTrackingMs / 1000, 2) + " " + t("s")}
            />
          </>
        ) : isReaction(s.config.scenario) ? (
          <>
            <Stat
              label={t("Median reaction")}
              value={num(median(s.metrics.reaction)) + " " + t("ms")}
            />
            <Stat
              label={t("90th percentile")}
              value={num(percentile(s.metrics.reaction, 90)) + " " + t("ms")}
            />
            <Stat
              label={t("Valid responses")}
              value={s.metrics.reaction.length}
            />
            <Stat
              label={t("False starts / timeouts")}
              value={`${s.metrics.falseStarts} / ${s.metrics.timeouts}`}
            />
          </>
        ) : (
          <>
            <Stat
              label={t("Accuracy")}
              value={num(ratio(s.metrics.hits, s.metrics.shots), 1) + "%"}
            />
            <Stat
              label={t("Hits / shots")}
              value={`${num(s.metrics.hits)} / ${num(s.metrics.shots)}`}
            />
            <Stat
              label={t("Hits per second")}
              value={
                s.activeMs ? num(s.metrics.hits / (s.activeMs / 1000), 2) : "—"
              }
            />
            <Stat
              label={t("Median acquisition")}
              value={num(median(s.metrics.acquisition)) + " " + t("ms")}
            />
          </>
        )}
      </div>
      <div className="two-columns">
        <section className="panel">
          <h2>{t("Session details")}</h2>
          <dl className="details-list">
            <div>
              <dt>{t("Training time")}</dt>
              <dd>{duration(s.activeMs)}</dd>
            </div>
            <div>
              <dt>{t("Input")}</dt>
              <dd>{t(s.config.input)}</dd>
            </div>
            {!isTracking(s.config.scenario) &&
              !isReaction(s.config.scenario) && (
                <>
                  <div>
                    <dt>{t("Misses / expired targets")}</dt>
                    <dd>
                      {s.metrics.misses} / {s.metrics.expired}
                    </dd>
                  </div>
                  <div>
                    <dt>{t("Best hit combo")}</dt>
                    <dd>{s.metrics.bestCombo}</dd>
                  </div>
                  <div>
                    <dt>{t("Mean center error")}</dt>
                    <dd>
                      {s.metrics.centerErrorCount
                        ? num(
                            s.metrics.centerErrorSum /
                              s.metrics.centerErrorCount,
                            3,
                          )
                        : "—"}{" "}
                      {t("target radii")}
                    </dd>
                  </div>
                </>
              )}
            <div>
              <dt>{t("Vertical field of view")}</dt>
              <dd>{num(s.config.fov, 3)}°</dd>
            </div>
            <div>
              <dt>{t("Sensitivity")}</dt>
              <dd>{num(s.config.sensitivity, 3)}°</dd>
            </div>
            <div>
              <dt>{t("Run type")}</dt>
              <dd>
                {t(s.config.kind)} · v{s.config.version}
              </dd>
            </div>
          </dl>
          {s.config.challengeId && (
            <p className="subtle">{s.config.challengeId}</p>
          )}
          {isReaction(s.config.scenario) && <p>{t("reactionCaveat")}</p>}
        </section>
        <section className="panel coach-panel">
          <span className="eyebrow">{t("PRACTICE NOTES")}</span>
          <h2>{t("A little perspective.")}</h2>
          <p>
            {t(coach.key, { count: coach.count, delta: num(coach.delta, 1) })}
          </p>
          <small>
            {t("Rule-based observations from comparable retained sessions.")}
          </small>
          {s.config.scenario === "target-switching" && (
            <dl className="details-list">
              <div>
                <dt>{t("Targets completed")}</dt>
                <dd>{s.metrics.completedTargets}</dd>
              </div>
              <div>
                <dt>{t("Target switches")}</dt>
                <dd>{s.metrics.switches}</dd>
              </div>
              <div>
                <dt>{t("Median completion time")}</dt>
                <dd>
                  {num(median(s.metrics.switchTimes))} {t("ms")}
                </dd>
              </div>
            </dl>
          )}
        </section>
      </div>
      {db.settings.breakReminder && s.activeMs >= 60000 && (
        <p className="retention-note">
          {t("Take a short break before your next round.")}
        </p>
      )}
      <div className="action-row">
        <Link
          className="button primary"
          to={"/arena/?config=" + encodeURIComponent(JSON.stringify(s.config))}
        >
          <RotateCcw size={16} />
          {t("Try again")}
        </Link>
        {next && routine && (
          <Link className="button" to="/routines">
            {t("Next routine step")}
            <ArrowRight size={16} />
          </Link>
        )}
        <Link className="button" to="/dashboard">
          {t("My progress")}
        </Link>
        <button className="button" onClick={() => setShare(!share)}>
          <Share2 size={16} />
          {t("Share result")}
        </button>
      </div>
      {share && (
        <section className="panel share-panel">
          <h2>{t("Share your session")}</h2>
          <p>{t("Only this result is shared. Your history stays private.")}</p>
          <textarea readOnly value={text} aria-label={t("Share text")} />
          <div className="action-row">
            <button className="button" onClick={() => void copy(text)}>
              <Copy size={15} />
              {t("Copy text")}
            </button>
            <button
              className="button"
              onClick={() =>
                void resultImage(s, db.settings.nickname)
                  .then((b) => download(b, "aimforge-result.png"))
                  .catch(() => setNotice("Export failed."))
              }
            >
              <Download size={15} />
              {t("Download image")}
            </button>
            {typeof navigator !== "undefined" && !!navigator.share && (
              <button
                className="button"
                onClick={() =>
                  void navigator
                    .share({ title: "AimForge", text })
                    .catch(() => setNotice("Copy the text below."))
                }
              >
                {t("Share")}
              </button>
            )}
            <button
              className="button"
              onClick={() => void copy(challengeLink(s.config))}
            >
              {t("Challenge a friend")}
            </button>
          </div>
          <input
            readOnly
            aria-label={t("Challenge link")}
            value={challengeLink(s.config)}
          />
          <p role="status">{t(notice)}</p>
        </section>
      )}
    </>
  );
}
export type { Session };
