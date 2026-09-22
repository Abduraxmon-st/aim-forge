import { Engine, type EngineCallbacks } from "../core/engine";
import type { Config, Settings } from "../../domain/models";
import { isTracking } from "../../domain/rules";
type Target = {
  x: number;
  y: number;
  r: number;
  born: number;
  phase: number;
  hp: number;
};
export class Engine2D extends Engine {
  private ctx: CanvasRenderingContext2D;
  readonly targets: Target[] = [];
  private scale = 1;
  private ox = 0;
  private oy = 0;
  private reactionState: "waiting" | "cue" | "feedback" = "waiting";
  private cueAt = 0;
  private nextCue = 0;
  private trials = 0;
  private feedbackUntil = 0;
  private reactionLabels: { wait: string; go: string; done: string };
  constructor(
    canvas: HTMLCanvasElement,
    config: Config,
    settings: Settings,
    callbacks: EngineCallbacks,
    labels: { wait: string; go: string; done: string },
  ) {
    super(canvas, config, settings, callbacks);
    this.reactionLabels = labels;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvasUnavailable");
    this.ctx = ctx;
    for (let i = 0; i < config.count; i++) this.spawn();
    this.nextCue = 1000 + this.random() * 2500;
    this.ready();
  }
  resize() {
    const rect = this.canvas.getBoundingClientRect(),
      cap =
        this.settings.quality === "low"
          ? 1
          : this.settings.quality === "medium"
            ? 1.5
            : 2,
      dpr = Math.min(devicePixelRatio, cap);
    this.canvas.width = Math.max(1, Math.round(rect.width * dpr));
    this.canvas.height = Math.max(1, Math.round(rect.height * dpr));
    this.scale = Math.min(this.canvas.width / 960, this.canvas.height / 600);
    this.ox = (this.canvas.width - 960 * this.scale) / 2;
    this.oy = (this.canvas.height - 600 * this.scale) / 2;
  }
  private spawn(previous?: Target) {
    const r = this.config.radius;
    let x = 480,
      y = 300;
    for (let n = 0; n < 100; n++) {
      if (previous && this.config.scenario === "micro-precision") {
        const a = this.random() * Math.PI * 2,
          d = 90 + this.random() * 190;
        x = previous.x + Math.cos(a) * d;
        y = previous.y + Math.sin(a) * d;
      } else {
        x = 50 + r + this.random() * (860 - 2 * r);
        y = 50 + r + this.random() * (500 - 2 * r);
      }
      if (x < r + 24 || x > 936 - r || y < r + 24 || y > 576 - r) continue;
      if (
        this.targets.every((t) => Math.hypot(t.x - x, t.y - y) > t.r + r + 20)
      ) {
        this.targets.push({
          x,
          y,
          r,
          born: this.activeMs,
          phase: this.random() * Math.PI * 2,
          hp: 1,
        });
        return;
      }
    } // Bounded rejection with a deterministic grid fallback.
    for (let gy = r + 30; gy < 570 - r; gy += 2 * r + 24)
      for (let gx = r + 30; gx < 930 - r; gx += 2 * r + 24)
        if (
          this.targets.every(
            (t) => Math.hypot(t.x - gx, t.y - gy) > t.r + r + 20,
          )
        ) {
          this.targets.push({
            x: gx,
            y: gy,
            r,
            born: this.activeMs,
            phase: 0,
            hp: 1,
          });
          return;
        }
  }
  protected update(_dt: number) {
    const id = this.config.scenario;
    for (const t of [...this.targets]) {
      if (id === "moving-clicks" || id === "smooth-tracking") {
        const time =
          (((this.activeMs - t.born) / 1000) * this.config.speed) / 100;
        t.x = 480 + Math.sin(time * 0.75 + t.phase) * 330;
        t.y = 300 + Math.sin(time * 1.13 + t.phase) * 185;
      }
      if (
        !isTracking(id) &&
        id !== "reaction-tap" &&
        this.activeMs - t.born > this.config.lifetime
      ) {
        this.targets.splice(this.targets.indexOf(t), 1);
        this.metrics.expired++;
        this.metrics.combo = 0;
        this.spawn(t);
      }
    }
    if (id === "reaction-tap") {
      if (
        this.reactionState === "cue" &&
        this.activeMs - this.feedbackUntil > 1500
      ) {
        this.metrics.timeouts++;
        this.nextTrial();
      }
      if (
        this.reactionState === "feedback" &&
        this.activeMs >= this.feedbackUntil
      ) {
        this.reactionState = "waiting";
        this.nextCue = this.activeMs + 1000 + this.random() * 2500;
      }
    }
  }
  protected override onRun() {
    if (this.config.scenario === "reaction-tap") {
      this.reactionState = "waiting";
      this.nextCue = this.activeMs + 1000 + this.random() * 2500;
      this.cueAt = 0;
    }
  }
  private nextTrial() {
    this.trials++;
    this.reactionState = "feedback";
    this.feedbackUntil = this.activeMs + 500;
    if (this.trials >= this.config.trials) this.finish();
  }
  protected shoot(now: number) {
    const m = this.metrics;
    if (this.config.scenario === "reaction-tap") {
      if (this.reactionState === "waiting") {
        m.falseStarts++;
        this.nextTrial();
        this.audio.play(false);
      } else if (this.reactionState === "cue") {
        const latency = now - this.cueAt;
        if (latency >= 0 && latency <= 1500) {
          this.sample(m.reaction, latency);
          this.audio.play(true);
          this.nextTrial();
        }
      }
      return;
    }
    const hit = this.targets.find(
      (t) => Math.hypot(t.x - this.pointer.x, t.y - this.pointer.y) <= t.r,
    );
    const col = Math.min(11, Math.floor(this.pointer.x / 80)),
      row = Math.min(7, Math.floor(this.pointer.y / 75));
    m.heatmap[row * 12 + col]++;
    if (hit) {
      this.hit(
        Math.hypot(hit.x - this.pointer.x, hit.y - this.pointer.y) / hit.r,
        this.activeMs - hit.born,
      );
      m.completedTargets++;
      this.targets.splice(this.targets.indexOf(hit), 1);
      this.spawn(hit);
    } else this.miss();
  }
  protected intersects() {
    return this.targets.some(
      (t) => Math.hypot(t.x - this.pointer.x, t.y - this.pointer.y) <= t.r,
    );
  }
  protected render(now: number) {
    const c = this.ctx;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = "#101117";
    c.fillRect(0, 0, this.canvas.width, this.canvas.height);
    c.setTransform(this.scale, 0, 0, this.scale, this.ox, this.oy);
    c.save();
    c.beginPath();
    c.rect(0, 0, 960, 600);
    c.clip();
    c.fillStyle = "#171921";
    c.fillRect(0, 0, 960, 600);
    c.strokeStyle = "#232630";
    c.lineWidth = 1;
    for (let x = 0; x <= 960; x += 60) {
      c.beginPath();
      c.moveTo(x, 0);
      c.lineTo(x, 600);
      c.stroke();
    }
    for (let y = 0; y <= 600; y += 60) {
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(960, y);
      c.stroke();
    }
    const color =
      this.config.palette === "cyan"
        ? "#67d5e7"
        : this.config.palette === "amber"
          ? "#f8c46c"
          : "#b3a0fc";
    if (this.config.scenario === "reaction-tap") {
      if (
        this.machine.phase === "running" &&
        this.reactionState === "waiting" &&
        this.activeMs >= this.nextCue
      ) {
        this.reactionState = "cue";
        this.cueAt = now;
        this.feedbackUntil = this.activeMs;
      }
      c.fillStyle = this.reactionState === "cue" ? "#91e1bf" : "#363345";
      c.beginPath();
      c.arc(480, 275, 80, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = this.reactionState === "cue" ? "#153829" : "#c8c4d6";
      c.font = "bold 38px system-ui";
      c.textAlign = "center";
      c.fillText(this.reactionState === "cue" ? "!" : "…", 480, 286);
      c.font = "20px system-ui";
      c.fillStyle = "#e0ddec";
      c.fillText(
        this.reactionState === "cue"
          ? this.reactionLabels.go
          : this.reactionState === "feedback"
            ? this.reactionLabels.done
            : this.reactionLabels.wait,
        480,
        400,
      );
      c.font = "15px system-ui";
      c.fillStyle = "#a7a3b5";
      c.fillText(`${Math.min(10, this.trials + 1)} / 10`, 480, 450);
    } else {
      for (const t of this.targets) {
        c.fillStyle = "#292536";
        c.beginPath();
        c.arc(t.x, t.y, t.r + 6, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = color;
        c.beginPath();
        c.arc(t.x, t.y, t.r, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#ffffffaa";
        c.beginPath();
        c.arc(t.x, t.y, 2, 0, Math.PI * 2);
        c.fill();
      }
      if (isTracking(this.config.scenario) && this.held && this.intersects()) {
        c.strokeStyle = "#b8f3d9";
        c.lineWidth = 3;
        for (const t of this.targets) {
          c.beginPath();
          c.arc(t.x, t.y, t.r + 9, 0, Math.PI * 2);
          c.stroke();
        }
      }
    }
    c.restore();
  }
}
