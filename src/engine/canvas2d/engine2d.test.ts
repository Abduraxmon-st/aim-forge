import { beforeEach, afterEach, it, expect, vi } from "vitest";
import { Engine2D } from "./engine2d";
import { defaultSettings, type Config } from "../../domain/models";
import { preset } from "../scenarios/catalog";
class Harness extends Engine2D {
  advance(now: number) {
    this.tick(now);
  }
  fire(now: number) {
    this.shoot(now);
  }
  map(x: number, y: number) {
    return this.point({ clientX: x, clientY: y } as PointerEvent);
  }
}
let ctx: CanvasRenderingContext2D;
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
  const noop = () => {};
  ctx = new Proxy(
    { fillText: vi.fn() } as unknown as CanvasRenderingContext2D,
    {
      get: (o, k) => Reflect.get(o, k) ?? noop,
      set: (o, k, v) => Reflect.set(o, k, v),
    },
  );
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(ctx);
  vi.spyOn(
    HTMLCanvasElement.prototype,
    "getBoundingClientRect",
  ).mockReturnValue({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: 480,
    bottom: 500,
    width: 480,
    height: 500,
    toJSON() {
      return {};
    },
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
function make(id: Config["scenario"]) {
  const settings = { ...defaultSettings(), master: 0 };
  return new Harness(
    document.createElement("canvas"),
    preset(id, settings),
    settings,
    { hud: () => {}, finish: () => {}, error: () => {} },
    { wait: "wait", go: "go", done: "done" },
  );
}
it("maps CSS scaling and letterboxing into the exact logical arena", () => {
  const e = make("flick-burst");
  expect(e.map(240, 250)).toMatchObject({ x: 480, y: 300, inside: true });
  expect(e.map(240, 20).inside).toBe(false);
  e.destroy();
});
it("keeps flick spawns in bounds and non-overlapping over repeated hits", () => {
  const e = make("flick-burst");
  for (let n = 0; n < 100; n++) {
    for (const a of e.targets) {
      expect(a.x - a.r).toBeGreaterThan(0);
      expect(a.x + a.r).toBeLessThan(960);
      expect(a.y - a.r).toBeGreaterThan(0);
      expect(a.y + a.r).toBeLessThan(600);
      for (const b of e.targets)
        if (a !== b)
          expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(a.r + b.r);
    }
    e.pointer = { x: e.targets[0].x, y: e.targets[0].y };
    e.fire(1000 + n);
  }
  expect(e.metrics.hits).toBe(100);
  e.destroy();
});
it("timestamps reaction at the frame that paints the cue", () => {
  const e = make("reaction-tap");
  e.start();
  let now = 10,
    cue = 0;
  for (; now < 10000; now += 16) {
    e.advance(now);
    const calls = vi.mocked(ctx.fillText).mock.calls;
    if (calls.at(-2)?.[0] === "go") {
      cue = now;
      break;
    }
  }
  expect(cue).toBeGreaterThan(3000);
  e.fire(cue + 175);
  expect(e.metrics.reaction).toEqual([175]);
  expect(e.metrics.shots).toBe(0);
  e.destroy();
});
it("blur clears held input and stops active timing", () => {
  const e = make("smooth-tracking");
  e.start();
  for (let n = 10; n < 4000; n += 16) e.advance(n);
  e.held = true;
  window.dispatchEvent(new Event("blur"));
  const active = e.activeMs;
  e.advance(4100);
  expect(e.machine.phase).toBe("paused");
  expect(e.held).toBe(false);
  expect(e.activeMs).toBe(active);
  e.destroy();
});
it("destroy removes pointer listeners and click is never a second shot", () => {
  const e = make("flick-burst");
  e.start();
  for (let n = 10; n < 4000; n += 16) e.advance(n);
  const target = e.targets[0];
  const down = () => {
    const event = new MouseEvent("pointerdown", {
      clientX: target.x * 0.5,
      clientY: 100 + target.y * 0.5,
      button: 0,
    });
    Object.defineProperties(event, {
      isPrimary: { value: true },
      pointerType: { value: "mouse" },
    });
    e.canvas.dispatchEvent(event);
  };
  down();
  expect(e.metrics.shots).toBe(1);
  e.canvas.dispatchEvent(new MouseEvent("click"));
  expect(e.metrics.shots).toBe(1);
  e.destroy();
  down();
  expect(e.metrics.shots).toBe(1);
});
