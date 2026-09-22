import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Play, Crosshair, ArrowLeft, Info } from "lucide-react";
import { useApp } from "../../storage/store";
import { configSchema, scenarioId, type Config } from "../../domain/models";
import { preset, dailyConfig } from "../../engine/scenarios/catalog";
import { dimension, isTracking, isReaction } from "../../domain/rules";
import { Heading, Field, Badge, Goal } from "../../components/ui";
import { Link, useNavigate } from "../../components/router";
import { decodeChallenge } from "../sharing/share";
export default function Setup({ id }: { id: string }) {
  const { t } = useTranslation(),
    { db } = useApp(),
    nav = useNavigate();
  const parsed = scenarioId.safeParse(id),
    scenario = parsed.success ? parsed.data : "flick-burst";
  const [config, setConfig] = useState(() => preset(scenario, db.settings)),
    [error, setError] = useState(""),
    [routine, setRoutine] = useState<{ id: string; step: number } | null>(null),
    [locked, setLocked] = useState(false);
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    try {
      if (query.get("challenge")) {
        setConfig(decodeChallenge(query.get("challenge")!, db.settings));
        setLocked(true);
      } else if (query.get("daily")) {
        setConfig(
          dailyConfig(dimension(scenario), query.get("daily")!, db.settings),
        );
        setLocked(true);
      } else {
        const difficulty = query.get("difficulty");
        const p = preset(
          scenario,
          db.settings,
          difficulty === "advanced" || difficulty === "intermediate"
            ? difficulty
            : "beginner",
        );
        if (query.get("duration")) {
          const n = Number(query.get("duration"));
          if (n === 30 || n === 60 || n === 120) p.duration = n;
        }
        if (query.get("routine")) {
          p.kind = "practice";
          setRoutine({
            id: query.get("routine")!,
            step: Number(query.get("step")) || 0,
          });
        }
        setConfig(p);
      }
    } catch {
      setError("Invalid challenge link.");
    }
  }, [scenario, db.settings]);
  function patch(p: Partial<Config>, custom = false) {
    setConfig((c) => ({ ...c, ...p, kind: custom ? "custom" : c.kind }));
  }
  function start() {
    const check = configSchema.safeParse(config);
    if (!check.success) {
      setError("Invalid configuration.");
      return;
    }
    const payload = encodeURIComponent(JSON.stringify(check.data));
    nav(
      "/arena/?config=" +
        payload +
        (routine
          ? "&routine=" +
            encodeURIComponent(routine.id) +
            "&step=" +
            routine.step
          : ""),
    );
  }
  const dim = dimension(config.scenario);
  return (
    <>
      <Link className="text-link back-link" to="/training">
        <ArrowLeft size={16} />
        {t("Training library")}
      </Link>
      <Heading
        title={t(config.scenario)}
        description={t(config.scenario + "Desc")}
        eyebrow={t("SCENARIO SETUP")}
      />
      <div className="setup-grid">
        <section>
          <div
            className={
              "arena-preview " + (dim === "3d" ? "perspective-preview" : "")
            }
          >
            <div className="preview-grid" />
            {dim === "3d" ? (
              <div className="preview-spheres">
                <span />
                <span />
                <span />
              </div>
            ) : (
              <>
                <span className="setup-target a" />
                <span className="setup-target b" />
                <span className="setup-target c" />
              </>
            )}
            <Crosshair size={28} />
            <Badge>
              {dim.toUpperCase()} ·{" "}
              {t(
                isTracking(config.scenario) ? "Hold to track" : "Click to hit",
              )}
            </Badge>
          </div>
          <div className="panel controls-panel">
            <h3>{t("The drill")}</h3>
            <p>{t(config.scenario + "Desc")}</p>
            <div className="controls-list">
              <span>
                <kbd>{dim === "3d" ? "↔" : t("Pointer")}</kbd>
                {t(dim === "3d" ? "Move mouse to look" : "Move to the target")}
              </span>
              <span>
                <kbd>{t("Primary")}</kbd>
                {t(
                  isTracking(config.scenario)
                    ? "Hold to track"
                    : "Click to hit",
                )}
              </span>
              <span>
                <kbd>Esc</kbd>
                {t("Pause")}
              </span>
            </div>
            <div className="notice">
              <Info size={18} />
              <p>{t(dim === "3d" ? "pointerNotice" : "touchNotice")}</p>
            </div>
            {isReaction(config.scenario) && <p>{t("reactionCaveat")}</p>}
          </div>
        </section>
        <section className="panel config-panel">
          <div className="section-heading">
            <h2>{t("Your session")}</h2>
            <Badge color="violet">{t(config.kind)}</Badge>
          </div>
          {locked && (
            <p className="notice">{t("Challenge settings are fixed.")}</p>
          )}
          <Field label={t("Difficulty")}>
            <select
              value={config.difficulty}
              disabled={locked}
              onChange={(e) =>
                setConfig((c) => ({
                  ...preset(
                    c.scenario,
                    db.settings,
                    e.target.value as Config["difficulty"],
                    c.duration,
                  ),
                  kind: routine ? "practice" : "standard",
                  input: c.input,
                }))
              }
            >
              {["beginner", "intermediate", "advanced"].map((d) => (
                <option key={d} value={d}>
                  {t(d)}
                </option>
              ))}
            </select>
          </Field>
          {!isReaction(config.scenario) && (
            <Field label={t("Duration")}>
              <div className="segmented">
                {([30, 60, 120] as const).map((n) => (
                  <button
                    aria-label={n + " " + t("s")}
                    disabled={locked}
                    key={n}
                    className={config.duration === n ? "selected" : ""}
                    onClick={() => patch({ duration: n })}
                  >
                    {n} {t("s")}
                  </button>
                ))}
              </div>
            </Field>
          )}
          <Field label={t("Input")}>
            <select
              value={config.input}
              disabled={dim === "3d" || locked}
              onChange={(e) =>
                patch({ input: e.target.value as Config["input"] })
              }
            >
              <option value="mouse">{t("mouse")}</option>
              {dim === "2d" && <option value="touch">{t("touch")}</option>}
            </select>
          </Field>
          {dim === "3d" && (
            <>
              <Field
                label={t("Sensitivity")}
                hint={t("Degrees per mouse count")}
              >
                <input
                  type="number"
                  min=".005"
                  max=".5"
                  step=".005"
                  value={config.sensitivity}
                  onChange={(e) =>
                    patch({ sensitivity: Number(e.target.value) })
                  }
                />
              </Field>
              <Field label={t("Vertical field of view")}>
                <input
                  disabled={locked}
                  type="range"
                  min="45"
                  max="110"
                  value={config.fov}
                  onChange={(e) => patch({ fov: Number(e.target.value) }, true)}
                />
                <output>{config.fov}°</output>
              </Field>
              <p className="subtle">
                {t("Target distance")}:{" "}
                {config.scenario === "precision-range"
                  ? "8–" + (config.distance + 2)
                  : config.distance}{" "}
                {t("world units")}
              </p>
            </>
          )}
          <details>
            <summary>{t("Customize practice")}</summary>
            <Field
              label={t("Target radius")}
              hint={t("Custom settings create a separate comparison.")}
            >
              <input
                type="range"
                min="8"
                max="50"
                value={config.radius}
                disabled={locked}
                onChange={(e) =>
                  patch({ radius: Number(e.target.value) }, true)
                }
              />
              <output>{config.radius}</output>
            </Field>
            <Field label={t("Speed")}>
              <input
                type="range"
                min="30"
                max="400"
                value={config.speed}
                disabled={locked}
                onChange={(e) => patch({ speed: Number(e.target.value) }, true)}
              />
              <output>{config.speed}</output>
            </Field>
          </details>
          <div className="goal-box">
            <span className="eyebrow">{t("WIN CONDITION · V1")}</span>
            <p>
              <Goal config={config} />
            </p>
            <small>
              {t("Application-defined goal, not a professional rank.")}
            </small>
          </div>
          <p className="subtle">{t("interruptionNotice")}</p>
          {error && (
            <p role="alert" className="error-text">
              {t(error)}
            </p>
          )}
          <button
            className="button primary full"
            onClick={start}
            disabled={!!error}
          >
            <Play size={17} fill="currentColor" />
            {t("Enter training")}
          </button>
          <small className="center">
            {t("Three-second countdown. Start when ready.")}
          </small>
        </section>
      </div>
    </>
  );
}
