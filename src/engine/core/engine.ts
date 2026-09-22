import {
  type Config,
  type Settings,
  type Session,
  type Metrics,
  emptyMetrics,
} from "../../domain/models";
import {
  comparisonKey,
  dateInZone,
  isTracking,
  score,
  won,
  rng,
} from "../../domain/rules";
import { StateMachine, type Phase } from "./state";
import { AudioFeedback } from "./audio";
export type HUD = {
  phase: Phase;
  activeMs: number;
  remaining: number;
  score: number;
  metrics: Metrics;
  countdown: number;
  fps: number;
  message: string;
};
export interface EngineCallbacks {
  hud: (hud: HUD) => void;
  finish: (session: Session) => void;
  error: (message: string) => void;
}
export abstract class Engine {
  readonly machine = new StateMachine();
  readonly metrics = emptyMetrics();
  readonly random: () => number;
  activeMs = 0;
  held = false;
  pointer = { x: -1000, y: -1000 };
  fps = 0;
  protected frame = 0;
  protected lastTime = 0;
  protected accumulator = 0;
  protected countdownMs = 3000;
  protected lastHud = 0;
  protected startedAt = "";
  protected interruption: Session["interruption"] = "none";
  protected destroyed = false;
  protected trackingSegment = 0;
  protected abortController = new AbortController();
  protected audio: AudioFeedback;
  protected resizeObserver: ResizeObserver;
  protected rawInput = false;
  protected resumePending = false;
  protected emitted = false;
  protected id = crypto.randomUUID();
  protected message = "";
  constructor(
    public canvas: HTMLCanvasElement,
    public readonly config: Config,
    protected settings: Settings,
    protected callbacks: EngineCallbacks,
  ) {
    this.random = rng(config.seed);
    this.audio = new AudioFeedback(settings);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.machine.transition("loading");
  }
  protected ready() {
    this.bind();
    this.resizeObserver.observe(this.canvas);
    this.resize();
    this.machine.transition("ready");
    this.publish();
    this.frame = requestAnimationFrame(this.tick);
  }
  protected bind() {
    const o = { signal: this.abortController.signal };
    this.canvas.addEventListener("pointerdown", this.down, o);
    this.canvas.addEventListener("pointermove", this.move, o);
    window.addEventListener("pointerup", this.up, o);
    window.addEventListener("pointercancel", this.up, o);
    window.addEventListener("blur", () => this.pause("blur"), o);
    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.hidden) this.pause("hidden");
      },
      o,
    );
    window.addEventListener(
      "keydown",
      (e) => {
        if ((e.target as HTMLElement).matches("input,textarea,select")) return;
        if (e.key === "Escape" || e.code === "Space") {
          if (e.code === "Space") e.preventDefault();
          this.pause("pause");
        }
      },
      o,
    );
    this.canvas.addEventListener("contextmenu", (e) => e.preventDefault(), o);
  }
  protected point(e: PointerEvent) {
    const b = this.canvas.getBoundingClientRect(),
      scale = Math.min(b.width / 960, b.height / 600),
      x = (e.clientX - b.left - (b.width - 960 * scale) / 2) / scale,
      y = (e.clientY - b.top - (b.height - 600 * scale) / 2) / scale;
    return { x, y, inside: x >= 0 && x <= 960 && y >= 0 && y <= 600 };
  }
  protected down = (e: PointerEvent) => {
    if (e.button !== 0 || !e.isPrimary || this.machine.phase !== "running")
      return;
    const isTouch = e.pointerType === "touch";
    if ((this.config.input === "touch") !== isTouch) {
      this.pause("input");
      return;
    }
    const p = this.point(e);
    if (!this.is3d && !p.inside) return;
    if (this.is3d && document.pointerLockElement !== this.canvas) return;
    e.preventDefault();
    if (!this.is3d) {
      this.pointer = p;
      try {
        this.canvas.setPointerCapture(e.pointerId);
      } catch {
        /* pointer may have ended */
      }
    }
    this.held = true;
    if (!isTracking(this.config.scenario)) this.shoot(performance.now());
  };
  protected move = (e: PointerEvent) => {
    if (
      (this.config.input === "touch" && e.pointerType !== "touch") ||
      (this.config.input === "mouse" && e.pointerType === "touch")
    )
      return;
    if (!this.is3d) this.pointer = this.point(e);
  };
  protected up = () => {
    this.held = false;
  };
  protected get is3d() {
    return false;
  }
  start() {
    if (!["ready", "paused"].includes(this.machine.phase)) return;
    this.audio.unlock();
    this.beginCountdown();
  }
  protected beginCountdown() {
    this.held = false;
    this.countdownMs = 3000;
    this.machine.transition("countdown");
    this.lastTime = 0;
    this.accumulator = 0;
    this.publish();
  }
  pause(reason: Session["interruption"] = "pause") {
    if (!["running", "countdown"].includes(this.machine.phase)) return;
    this.held = false;
    this.trackingSegment = 0;
    if (this.activeMs > 0) this.interruption = reason;
    this.machine.transition("paused");
    this.accumulator = 0;
    if (document.pointerLockElement === this.canvas) document.exitPointerLock();
    this.publish();
  }
  abort() {
    if (["finished", "aborted"].includes(this.machine.phase)) return;
    if (this.machine.phase === "error") this.machine.transition("aborted");
    else this.machine.transition("aborted");
    this.held = false;
    if (this.activeMs > 0) {
      if (this.interruption === "none") this.interruption = "exit";
      this.emit("aborted");
    }
    this.publish();
  }
  protected tick = (now: number) => {
    if (this.destroyed) return;
    const delta = this.lastTime ? now - this.lastTime : 0;
    this.lastTime = now;
    if (delta > 250 && ["running", "countdown"].includes(this.machine.phase)) {
      this.pause("gap");
    } else if (this.machine.phase === "countdown") {
      this.countdownMs -= delta;
      if (this.countdownMs <= 0) {
        this.machine.transition("running");
        this.startedAt ||= new Date().toISOString();
        this.accumulator = 0;
        this.onRun();
      }
    } else if (this.machine.phase === "running") {
      this.accumulator += delta;
      const step = 1000 / 120;
      while (
        this.accumulator + 1e-7 >= step &&
        this.machine.phase === "running"
      ) {
        const remaining =
          (this.config.scenario === "reaction-tap"
            ? 120000
            : this.config.duration * 1000) - this.activeMs;
        const dt = Math.min(step, remaining);
        this.activeMs += dt;
        this.update(dt);
        if (isTracking(this.config.scenario)) {
          this.metrics.exposureMs += dt;
          if (this.held && this.intersects()) {
            this.metrics.onTargetMs += dt;
            this.trackingSegment += dt;
            this.metrics.longestTrackingMs = Math.max(
              this.metrics.longestTrackingMs,
              this.trackingSegment,
            );
          } else this.trackingSegment = 0;
        }
        this.accumulator -= step;
        if (
          this.activeMs >= this.config.duration * 1000 - 0.001 &&
          this.config.scenario !== "reaction-tap"
        )
          this.finish();
        if (this.config.scenario === "reaction-tap" && this.activeMs >= 120000)
          this.finish();
      }
    }
    if (delta > 0 && delta < 250)
      this.fps = this.fps
        ? this.fps * 0.95 + (1000 / delta) * 0.05
        : 1000 / delta;
    this.render(now);
    if (now - this.lastHud >= 75) {
      this.publish();
      this.lastHud = now;
    }
    this.frame = requestAnimationFrame(this.tick);
  };
  protected onRun() {}
  protected hit(error: number, acquisition: number) {
    const m = this.metrics;
    m.shots++;
    m.hits++;
    m.combo++;
    m.bestCombo = Math.max(m.bestCombo, m.combo);
    m.centerErrorSum += error;
    m.centerErrorCount++;
    this.sample(m.acquisition, acquisition);
    this.audio.play(true);
  }
  protected miss() {
    this.metrics.shots++;
    this.metrics.misses++;
    this.metrics.combo = 0;
    this.audio.play(false);
  }
  protected sample(a: number[], n: number) {
    if (a.length < 256) a.push(Math.max(0, n));
  }
  protected finish() {
    if (this.machine.phase !== "running") return;
    this.machine.transition("finished");
    this.held = false;
    if (document.pointerLockElement === this.canvas) document.exitPointerLock();
    this.emit("finished");
    this.publish();
  }
  protected emit(status: Session["status"]) {
    if (this.emitted) return;
    this.emitted = true;
    const date = dateInZone(this.startedAt, this.settings.timezone);
    const eligible =
      status === "finished" &&
      this.interruption === "none" &&
      ["standard", "daily"].includes(this.config.kind);
    const s: Session = {
      id: this.id,
      startedAt: this.startedAt,
      endedAt: new Date().toISOString(),
      date,
      month: date.slice(0, 7),
      timezone: this.settings.timezone,
      config: structuredClone(this.config),
      comparisonKey: comparisonKey(this.config),
      status,
      eligible,
      interruption: this.interruption,
      activeMs: this.activeMs,
      dayGoal: this.settings.dailyGoal,
      score: score(this.config, this.metrics),
      won: status === "finished" && won(this.config, this.metrics),
      metrics: structuredClone(this.metrics),
      environment: {
        width: this.canvas.clientWidth,
        height: this.canvas.clientHeight,
        dpr: devicePixelRatio,
        quality: this.settings.quality,
        fps: this.fps,
        rawInput: this.rawInput,
      },
    };
    this.callbacks.finish(s);
  }
  protected fail(message: string) {
    if (!["finished", "aborted", "error"].includes(this.machine.phase))
      this.machine.transition("error");
    this.held = false;
    this.message = message;
    this.callbacks.error(message);
    this.publish();
  }
  protected publish() {
    this.callbacks.hud({
      phase: this.machine.phase,
      activeMs: this.activeMs,
      remaining: Math.max(0, this.config.duration - this.activeMs / 1000),
      score: score(this.config, this.metrics),
      metrics: structuredClone(this.metrics),
      countdown: Math.ceil(this.countdownMs / 1000),
      fps: this.fps,
      message: this.message,
    });
  }
  abstract resize(): void;
  protected abstract update(dt: number): void;
  protected abstract render(now: number): void;
  protected abstract shoot(now: number): void;
  protected abstract intersects(): boolean;
  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    cancelAnimationFrame(this.frame);
    this.abortController.abort();
    this.resizeObserver.disconnect();
    this.audio.destroy();
    this.held = false;
    if (document.pointerLockElement === this.canvas) document.exitPointerLock();
  }
}
