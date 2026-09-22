import { describe, it, expect } from "vitest";
import {
  ratio,
  median,
  percentile,
  score,
  won,
  comparisonKey,
  rng,
  dateInZone,
  addDays,
  dayStreak,
  advanceWins,
  addTotals,
  sessionTotals,
  coaching,
  rebuild,
} from "./rules";
import { defaultSettings, emptyMetrics, freshSnapshot } from "./models";
import { preset, dailyConfig } from "../engine/scenarios/catalog";
import { session } from "../test/fixtures";
describe("measured metrics", () => {
  it("handles empty denominators", () => {
    expect(ratio(0, 0)).toBeNull();
    expect(median([])).toBeNull();
    expect(percentile([], 90)).toBeNull();
  });
  it("weights accuracy by shots", () => {
    const a = session({ metrics: { ...emptyMetrics(), hits: 1, shots: 1 } }),
      b = session({
        metrics: { ...emptyMetrics(), hits: 10, shots: 100, misses: 90 },
      });
    const sum = addTotals(sessionTotals(a), sessionTotals(b));
    expect(ratio(sum.hits, sum.shots)).toBeCloseTo((100 * 11) / 101);
  });
  it("defines click, tracking and reaction scores", () => {
    const c = preset("flick-burst", defaultSettings());
    expect(score(c, { ...emptyMetrics(), hits: 4, misses: 2, shots: 6 })).toBe(
      350,
    );
    expect(score(c, { ...emptyMetrics(), misses: 10, shots: 10 })).toBe(0);
    expect(
      score(
        { ...c, scenario: "smooth-tracking" },
        { ...emptyMetrics(), onTargetMs: 15000, exposureMs: 60000 },
      ),
    ).toBe(250);
    expect(
      score(
        { ...c, scenario: "reaction-tap" },
        { ...emptyMetrics(), reaction: [200, 300, 400] },
      ),
    ).toBe(700);
  });
  it("computes exact bounded percentiles", () => {
    expect(median([4, 1, 3, 2])).toBe(2.5);
    expect(percentile([100, 200, 300], 90)).toBe(280);
  });
  it("uses explicit goals and minimum exposure", () => {
    const c = preset("flick-burst", defaultSettings());
    expect(won(c, { ...emptyMetrics(), hits: 50, shots: 60, misses: 10 })).toBe(
      true,
    );
    expect(
      won(
        { ...c, scenario: "smooth-tracking" },
        { ...emptyMetrics(), onTargetMs: 100, exposureMs: 100 },
      ),
    ).toBe(false);
  });
  it("requires five comparable sessions for coaching", () => {
    const s = session();
    expect(coaching(s, [s, s, s, s]).key).toBe("coachNotEnough");
    expect(coaching(s, [s, s, s, s, s]).count).toBe(5);
  });
});
describe("comparison and determinism", () => {
  it("separates daily, standard, practice and custom categories", () => {
    const c = preset("flick-burst", defaultSettings());
    expect(
      new Set(
        ["standard", "daily", "practice", "custom"].map((kind) =>
          comparisonKey({ ...c, kind: kind as typeof c.kind }),
        ),
      ).size,
    ).toBe(4);
  });
  it("separates input, geometry, scoring, FOV and timing", () => {
    const c = preset("flick-burst", defaultSettings());
    for (const edit of [
      { input: "touch" as const },
      { radius: 20 },
      { duration: 120 as const },
      { fov: 90 },
      { smoothing: true },
    ])
      expect(comparisonKey(c)).not.toBe(comparisonKey({ ...c, ...edit }));
    expect(comparisonKey(c)).toBe(
      comparisonKey({ ...c, seed: 99, sensitivity: 0.2 }),
    );
  });
  it("replays the exact seeded sequence", () => {
    const a = rng(123),
      b = rng(123);
    expect(Array.from({ length: 100 }, a)).toEqual(
      Array.from({ length: 100 }, b),
    );
  });
  it("daily configuration is independent of language", () => {
    const settings = defaultSettings(),
      a = dailyConfig("2d", "2026-09-22", settings),
      b = dailyConfig("2d", "2026-09-22", { ...settings, language: "uz" });
    expect(a).toEqual(b);
    expect(dailyConfig("2d", "2026-09-23", settings).seed).not.toBe(a.seed);
  });
});
describe("calendar grouping and streaks", () => {
  it("uses calendar arithmetic through leap day and year boundaries", () => {
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
    expect(addDays("2024-02-29", 1)).toBe("2024-03-01");
    expect(addDays("2025-12-31", 1)).toBe("2026-01-01");
  });
  it("handles midnight and timezone changes without rewriting history", () => {
    const start = "2026-09-21T23:30:00.000Z";
    expect(dateInZone(start, "Asia/Tashkent")).toBe("2026-09-22");
    expect(dateInZone(start, "America/New_York")).toBe("2026-09-21");
    const db = freshSnapshot();
    db.sessions = [session({ startedAt: start, timezone: "Asia/Tashkent" })];
    db.settings.timezone = "America/New_York";
    expect(rebuild(db).sessions[0].date).toBe("2026-09-22");
  });
  it("survives DST and unfinished today", () => {
    expect(dateInZone("2026-03-08T07:30:00Z", "America/New_York")).toBe(
      "2026-03-08",
    );
    expect(dayStreak(["2026-03-07", "2026-03-08"], "2026-03-09")).toEqual({
      current: 2,
      longest: 2,
    });
    expect(dayStreak(["2026-03-07", "2026-03-08"], "2026-03-10").current).toBe(
      0,
    );
  });
  it("resets challenge wins for failures and abandonment, ignores practice", () => {
    const s = session(),
      state = { current: 3, longest: 4 };
    expect(advanceWins(state, s).current).toBe(4);
    expect(advanceWins(state, { ...s, won: false }).current).toBe(0);
    expect(
      advanceWins(state, { ...s, status: "aborted", eligible: false }).current,
    ).toBe(0);
    expect(
      advanceWins(state, { ...s, config: { ...s.config, kind: "practice" } }),
    ).toEqual(state);
    expect(
      advanceWins(state, { ...s, status: "aborted", activeMs: 0 }),
    ).toEqual(state);
  });
});
