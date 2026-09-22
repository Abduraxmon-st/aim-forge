import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { Engine, type EngineCallbacks } from "./engine";
import { defaultSettings, type Config } from "../../domain/models";
import { preset } from "../scenarios/catalog";
import { canTransition } from "./state";
class Harness extends Engine {
  distance = 0;
  constructor(c: Config, cb: EngineCallbacks) {
    super(
      document.createElement("canvas"),
      c,
      { ...defaultSettings(), master: 0 },
      cb,
    );
    this.ready();
  }
  resize() {}
  protected update(dt: number) {
    this.distance += dt * 0.1;
  }
  protected render() {}
  protected shoot() {
    this.hit(0, 100);
  }
  protected intersects() {
    return true;
  }
  advance(now: number) {
    this.tick(now);
  }
}
beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.stubGlobal("requestAnimationFrame", () => 1);
  vi.stubGlobal("cancelAnimationFrame", () => {});
});
afterEach(() => vi.unstubAllGlobals());
describe("simulation lifecycle", () => {
  it("allows only documented state transitions", () => {
    expect(canTransition("ready", "countdown")).toBe(true);
    expect(canTransition("running", "finished")).toBe(true);
    expect(canTransition("finished", "running")).toBe(false);
  });
  it("equivalent 60 and 144 Hz runs accrue the same time, movement and tracking", () => {
    function run(hz: number) {
      const finish = vi.fn(),
        e = new Harness(
          preset("smooth-tracking", defaultSettings(), "beginner", 30),
          { finish, hud: () => {}, error: () => {} },
        );
      e.start();
      let now = 10;
      e.advance(now);
      for (let i = 0; i < hz * 34; i++) {
        now += 1000 / hz;
        e.held = true;
        e.advance(now);
      }
      e.destroy();
      expect(finish).toHaveBeenCalledTimes(1);
      return { distance: e.distance, result: finish.mock.calls[0][0] };
    }
    const a = run(60),
      b = run(144);
    expect(a.distance).toBeCloseTo(b.distance, 6);
    expect(a.result.activeMs).toBeCloseTo(30000, 5);
    expect(a.result.metrics.onTargetMs).toBeCloseTo(
      b.result.metrics.onTargetMs,
      5,
    );
    expect(a.result.score).toBe(1000);
  });
  it("pauses immediately on long gaps and never awards unobserved time", () => {
    const e = new Harness(preset("smooth-tracking", defaultSettings()), {
      finish: () => {},
      hud: () => {},
      error: () => {},
    });
    e.start();
    for (let n = 10; n < 4000; n += 16) e.advance(n);
    const before = e.activeMs;
    e.advance(9000);
    expect(e.machine.phase).toBe("paused");
    expect(e.activeMs).toBe(before);
    e.advance(10000);
    expect(e.activeMs).toBe(before);
    e.destroy();
  });
  it("button release does not shrink tracking denominator", () => {
    const e = new Harness(preset("smooth-tracking", defaultSettings()), {
      finish: () => {},
      hud: () => {},
      error: () => {},
    });
    e.start();
    for (let n = 10; n < 6000; n += 16) {
      e.held = n < 4000;
      e.advance(n);
    }
    expect(e.metrics.exposureMs).toBeGreaterThan(2900);
    expect(e.metrics.onTargetMs).toBeLessThan(1100);
    e.destroy();
  });
  it("an aborted session can emit only once", () => {
    const finish = vi.fn(),
      e = new Harness(preset("flick-burst", defaultSettings()), {
        finish,
        hud: () => {},
        error: () => {},
      });
    e.start();
    for (let n = 10; n < 4000; n += 16) e.advance(n);
    e.abort();
    e.abort();
    e.destroy();
    expect(finish).toHaveBeenCalledTimes(1);
    expect(finish.mock.calls[0][0].eligible).toBe(false);
  });
});
