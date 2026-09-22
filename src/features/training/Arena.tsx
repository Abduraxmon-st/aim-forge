import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Pause,
  Play,
  RotateCcw,
  LogOut,
  Maximize,
  Crosshair,
} from "lucide-react";
import { type Config, configSchema, type Session } from "../../domain/models";
import { dimension, isTracking, ratio } from "../../domain/rules";
import { type Engine, type HUD } from "../../engine/core/engine";
import { Engine2D } from "../../engine/canvas2d/engine2d";
import { acquireTraining } from "../../storage/repository";
import { useApp } from "../../storage/store";
import { Link, useNavigate } from "../../components/router";
import { CrosshairPreview, Badge } from "../../components/ui";
import { num } from "../../i18n";
export default function Arena() {
  const { t } = useTranslation(),
    nav = useNavigate(),
    canvas = useRef<HTMLCanvasElement>(null),
    engine = useRef<Engine | null>(null),
    [config, setConfig] = useState<Config | null>(null),
    [hud, setHud] = useState<HUD | null>(null),
    [error, setError] = useState(""),
    [generation, setGeneration] = useState(0),
    [pending, setPending] = useState(false),
    release = useRef<(() => void) | null>(null),
    leaving = useRef(false);
  const db = useApp.getState().db;
  useEffect(() => {
    try {
      const q = new URLSearchParams(location.search),
        raw = q.get("config");
      if (!raw || raw.length > 4000) throw new Error();
      const parsed = configSchema.parse(JSON.parse(raw));
      if (dimension(parsed.scenario) === "3d" && parsed.input !== "mouse")
        throw new Error();
      setConfig(parsed);
    } catch {
      setError("Invalid configuration.");
    }
  }, []);
  useEffect(() => {
    if (!config || !canvas.current) return;
    let disposed = false;
    let current: Engine | undefined;
    leaving.current = false;
    const settings = structuredClone(useApp.getState().db.settings);
    const finish = async (s: Session) => {
      const q = new URLSearchParams(location.search);
      if (q.get("routine")) {
        s.routineId = q.get("routine")!;
        s.routineStep = Number(q.get("step")) || 0;
      }
      await useApp.getState().save(s);
      release.current?.();
      release.current = null;
      if (!leaving.current && !disposed) nav("/results/?id=" + s.id);
    };
    const callbacks = {
      hud: setHud,
      error: setError,
      finish: (s: Session) => {
        void finish(s);
      },
    };
    async function init() {
      try {
        if (dimension(config!.scenario) === "3d") {
          const { Engine3D } = await import("../../engine/three3d/engine3d");
          if (disposed) return;
          current = new Engine3D(canvas.current!, config!, settings, callbacks);
        } else
          current = new Engine2D(
            canvas.current!,
            config!,
            settings,
            callbacks,
            {
              wait: t("Wait for the cue"),
              go: t("TAP NOW"),
              done: t("Next trial"),
            },
          );
        engine.current = current;
      } catch (e) {
        setError(e instanceof Error ? e.message : "webglUnavailable");
      }
    }
    void init();
    return () => {
      disposed = true;
      if (
        current &&
        ["running", "paused", "countdown"].includes(current.machine.phase)
      )
        current.abort();
      current?.destroy();
      engine.current = null;
      release.current?.();
      release.current = null;
    };
  }, [config, generation]);
  async function start() {
    if (pending || !engine.current) return;
    setPending(true);
    setError("");
    try {
      if (!release.current)
        release.current = await acquireTraining(() =>
          engine.current?.pause("coordination"),
        );
      engine.current.start();
    } catch {
      setError("trainingBusy");
    } finally {
      setPending(false);
    }
  }
  function exit() {
    leaving.current = true;
    engine.current?.abort();
    engine.current?.destroy();
    release.current?.();
    release.current = null;
    nav("/training");
  }
  function restart() {
    if (
      engine.current?.activeMs &&
      !window.confirm(
        t("Restart this run? The current attempt will be saved as abandoned."),
      )
    )
      return;
    leaving.current = true;
    engine.current?.abort();
    engine.current?.destroy();
    engine.current = null;
    release.current?.();
    release.current = null;
    setHud(null);
    setGeneration((g) => g + 1);
  }
  if (!config)
    return (
      <div className="empty panel" role="alert">
        <p>{t(error || "Loading training…")}</p>
        {error && (
          <Link to="/training" className="button">
            {t("Training library")}
          </Link>
        )}
      </div>
    );
  const is3d = dimension(config.scenario) === "3d",
    phase = hud?.phase,
    overlay = !["running", "finished"].includes(phase ?? "loading");
  return (
    <div className="arena-page">
      <div className="arena-title">
        <div>
          <h1>{t(config.scenario)}</h1>
          <div className="badges">
            <Badge>{t(config.difficulty)}</Badge>
            <Badge>{t(config.kind)}</Badge>
            <Badge>{t(config.input)}</Badge>
          </div>
        </div>
        <button className="button" onClick={exit}>
          <LogOut size={16} />
          {t("Exit")}
        </button>
      </div>
      <div className="arena-hud">
        <div>
          <span>{t("Remaining")}</span>
          <strong>
            {config.scenario === "reaction-tap"
              ? `${(hud?.metrics.reaction.length ?? 0) + (hud?.metrics.timeouts ?? 0) + (hud?.metrics.falseStarts ?? 0)} / 10`
              : Math.ceil(hud?.remaining ?? config.duration)}{" "}
            <small>
              {config.scenario === "reaction-tap" ? t("trials") : t("s")}
            </small>
          </strong>
        </div>
        <div>
          <span>{t("Score")}</span>
          <strong>{num(hud?.score ?? 0)}</strong>
        </div>
        <div>
          <span>{t(isTracking(config.scenario) ? "Tracking" : "Hits")}</span>
          <strong>
            {isTracking(config.scenario)
              ? num(
                  hud
                    ? ratio(hud.metrics.onTargetMs, hud.metrics.exposureMs)
                    : null,
                  1,
                ) + "%"
              : num(hud?.metrics.hits ?? 0)}
          </strong>
        </div>
        <div>
          <span>
            {t(isTracking(config.scenario) ? "Time on target" : "Hit combo")}
          </span>
          <strong>
            {isTracking(config.scenario)
              ? num((hud?.metrics.onTargetMs ?? 0) / 1000, 1) + " " + t("s")
              : num(hud?.metrics.combo ?? 0)}
          </strong>
        </div>
        <button
          className="icon-button"
          aria-label={t("Pause")}
          disabled={phase !== "running"}
          onClick={() => engine.current?.pause()}
        >
          <Pause size={19} />
        </button>
      </div>
      <div className="arena-stage" data-phase={phase ?? "loading"}>
        <canvas
          ref={canvas}
          aria-label={t("Training arena")}
          className={"game-canvas " + (is3d ? "three" : "")}
          tabIndex={0}
        />
        {is3d && phase === "running" && (
          <CrosshairPreview value={db.settings.crosshair} />
        )}{" "}
        {db.settings.performance && (
          <div className="performance">
            {num(hud?.fps ?? 0)} FPS · {hud?.fps ? num(1000 / hud.fps, 1) : "—"}{" "}
            ms
          </div>
        )}
        {overlay && (
          <div className="arena-overlay">
            <div className="arena-dialog">
              {phase === "countdown" ? (
                <>
                  <div className="countdown">{hud?.countdown}</div>
                  <p>{t("Get ready")}</p>
                </>
              ) : (
                <>
                  <Crosshair size={36} />
                  <h2>
                    {t(
                      error
                        ? "Training unavailable"
                        : phase === "paused"
                          ? "Training paused"
                          : phase === "loading" || !phase
                            ? "Loading training…"
                            : "Ready when you are.",
                    )}
                  </h2>
                  <p>
                    {t(
                      phase === "paused"
                        ? "pausedNotice"
                        : is3d
                          ? "pointerNotice"
                          : isTracking(config.scenario)
                            ? "Hold to track"
                            : "Click to hit",
                    )}
                  </p>
                  {error && (
                    <p role="alert" className="error-text">
                      {t(error)}
                    </p>
                  )}
                  {phase && phase !== "error" && (
                    <button
                      className="button primary"
                      disabled={pending}
                      onClick={() => void start()}
                    >
                      <Play size={18} />
                      {t(phase === "paused" ? "Resume" : "Start round")}
                    </button>
                  )}
                  {error && (
                    <Link className="button" to="/setup/flick-burst">
                      {t("Try 2D practice")}
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="arena-bottom">
        <span>
          <kbd>Esc</kbd> {t("Pause")} ·{" "}
          {t("Only input inside the arena counts.")}
        </span>
        <div>
          <button className="button" onClick={restart}>
            <RotateCcw size={15} />
            {t("Restart")}
          </button>
          <button
            className="button"
            onClick={() => {
              const p = canvas.current?.parentElement?.requestFullscreen?.();
              void p?.catch(() => setError("fullscreenUnavailable"));
            }}
          >
            <Maximize size={15} />
            {t("Fullscreen")}
          </button>
        </div>
      </div>
      {error && phase === "running" && <p role="alert">{t(error)}</p>}
    </div>
  );
}
