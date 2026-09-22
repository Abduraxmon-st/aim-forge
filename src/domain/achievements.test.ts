import { describe, expect, it } from "vitest";
import { achievementCatalog, getAchievementProgress } from "./achievements";
import {
  defaultSettings,
  emptyMetrics,
  freshSnapshot,
  scenarioIds,
  type Config,
  type Session,
} from "./models";
import { rebuild } from "./rules";
import { preset } from "../engine/scenarios/catalog";
import { session } from "../test/fixtures";
import { compact, migrate } from "../storage/repository";

const config = (
  id: Config["scenario"] = "flick-burst",
  patch: Partial<Config> = {},
) => ({ ...preset(id, defaultSettings()), ...patch });
const state = (...sessions: Session[]) =>
  rebuild({ ...freshSnapshot(), sessions });
const item = (db: ReturnType<typeof freshSnapshot>, id: string) =>
  getAchievementProgress(db).find((a) => a.id === id)!;
const clicks = (hits: number, misses = 0, patch: Partial<Session> = {}) =>
  session({
    metrics: {
      ...emptyMetrics(),
      hits,
      shots: hits + misses,
      misses,
      bestCombo: hits,
    },
    ...patch,
  });
const tracking = (
  onTargetMs: number,
  exposureMs: number,
  longestTrackingMs = 0,
  patch: Partial<Session> = {},
) =>
  session({
    config: config("smooth-tracking"),
    metrics: { ...emptyMetrics(), onTargetMs, exposureMs, longestTrackingMs },
    ...patch,
  });
const reaction = (ms: number, count = 8, patch: Partial<Session> = {}) =>
  session({
    config: config("reaction-tap"),
    metrics: { ...emptyMetrics(), reaction: Array(count).fill(ms) },
    ...patch,
  });

describe("achievement catalogue and progress", () => {
  it("has 20 ordinary and exactly five secret milestones while preserving every existing ID", () => {
    expect(achievementCatalog).toHaveLength(25);
    expect(new Set(achievementCatalog.map((a) => a.id)).size).toBe(25);
    expect(achievementCatalog.filter((a) => a.secret).map((a) => a.id)).toEqual(
      ["ghost", "still-water", "second-wind", "parallel-worlds", "prism"],
    );
    expect(achievementCatalog.map((a) => a.id)).toEqual(
      expect.arrayContaining([
        "first",
        "routine",
        "seven",
        "hour",
        "precision",
      ]),
    );
    expect(
      getAchievementProgress(freshSnapshot()).every(
        (a) => !a.earned && a.percent === 0,
      ),
    ).toBe(true);
  });
  it("counts completed active sessions and time, excluding abandoned and empty sessions", () => {
    const db = state(
      ...Array.from({ length: 9 }, () => session()),
      session({ status: "aborted", eligible: false, won: false }),
      session({ activeMs: 0 }),
    );
    expect(item(db, "ten")).toMatchObject({
      current: 9,
      percent: 90,
      earned: false,
    });
    expect(item(db, "warmup-time").current).toBe(9);
    db.sessions.push(session());
    rebuild(db);
    expect(item(db, "ten").earned).toBe(true);
    expect(
      item(
        state(session({ status: "aborted", eligible: false, won: false })),
        "first",
      ).earned,
    ).toBe(false);
  });
  it("backfills retained sessions, historical totals, and routine completions without double-counting", () => {
    const db = freshSnapshot();
    db.ancient = {
      ...db.ancient,
      sessions: 99,
      activeMs: 299 * 60000,
      goals: 9,
    };
    db.sessions = [session()];
    db.routinesCompleted = 5;
    rebuild(db);
    for (const id of ["hundred", "five-hours", "routines-five", "ten-wins"])
      expect(item(db, id).earned).toBe(true);
    const before = getAchievementProgress(db);
    rebuild(rebuild(db));
    expect(getAchievementProgress(db)).toEqual(before);
  });
  it("counts distinct qualifying training days and distinguishes consecutive streaks", () => {
    const db = state(
      ...Array.from({ length: 7 }, (_, i) =>
        session({
          startedAt: `2026-09-${String(1 + i * 2).padStart(2, "0")}T10:00:00.000Z`,
          activeMs: 180000,
        }),
      ),
    );
    expect(item(db, "seven").earned).toBe(true);
    expect(item(db, "streak-three").earned).toBe(false);
    const streak = state(
      ...Array.from({ length: 7 }, (_, i) =>
        session({
          startedAt: `2026-09-${String(1 + i).padStart(2, "0")}T10:00:00.000Z`,
          activeMs: 180000,
        }),
      ),
    );
    expect(item(streak, "streak-seven").earned).toBe(true);
  });
  it("requires actual completed modes and palettes, regardless of selected settings", () => {
    const db = freshSnapshot();
    db.settings.palette = "amber";
    db.sessions = scenarioIds.map((id, index) =>
      session({
        config: config(id, {
          palette: (["violet", "cyan", "amber"] as const)[index % 3],
        }),
      }),
    );
    rebuild(db);
    expect(item(db, "all-modes")).toMatchObject({ earned: true, current: 10 });
    expect(item(db, "prism").earned).toBe(true);
    const aborted = state(
      ...db.sessions.map((s) => ({ ...s, status: "aborted" as const })),
    );
    expect(item(aborted, "all-modes").current).toBe(0);
    expect(item(aborted, "prism").current).toBe(0);
  });
  it("only counts wins from eligible completed active sessions", () => {
    const db = state(
      session({ eligible: false }),
      session({ status: "aborted" }),
      session({ activeMs: 0 }),
    );
    expect(item(db, "first-win").earned).toBe(false);
    db.sessions.push(session());
    rebuild(db);
    expect(item(db, "first-win").earned).toBe(true);
  });
});

describe("skill qualification", () => {
  it("requires 50 shots for accuracy and 25 consecutive hits for combo", () => {
    expect(item(state(clicks(49)), "precision")).toMatchObject({
      earned: false,
      current: 0,
    });
    expect(item(state(clicks(47, 3)), "precision").earned).toBe(false);
    expect(item(state(clicks(95, 5)), "precision").earned).toBe(true);
    expect(item(state(clicks(24)), "combo").earned).toBe(false);
    expect(item(state(clicks(25)), "combo").earned).toBe(true);
  });
  it("requires 30 seconds of tracking exposure for both tracking milestones", () => {
    const short = state(tracking(29999, 29999, 20000));
    expect(item(short, "tracking")).toMatchObject({
      earned: false,
      current: 0,
    });
    expect(item(short, "still-water")).toMatchObject({
      earned: false,
      current: 0,
    });
    expect(item(state(tracking(20999, 30000)), "tracking").earned).toBe(false);
    expect(item(state(tracking(21000, 30000, 9999)), "tracking").earned).toBe(
      true,
    );
    expect(
      item(state(tracking(21000, 30000, 9999)), "still-water").earned,
    ).toBe(false);
    expect(
      item(state(tracking(21000, 30000, 10000)), "still-water").earned,
    ).toBe(true);
  });
  it("only reports qualifying clean reaction samples and handles lower-is-better progress", () => {
    expect(item(state(reaction(250, 7)), "reaction")).toMatchObject({
      current: 0,
      percent: 0,
      earned: false,
    });
    expect(
      item(state(reaction(250, 8, { eligible: false })), "reaction").current,
    ).toBe(0);
    const falseStart = reaction(250);
    falseStart.metrics.falseStarts = 1;
    const timeout = reaction(250);
    timeout.metrics.timeouts = 1;
    expect(item(state(falseStart, timeout), "reaction").earned).toBe(false);
    expect(item(state(reaction(400)), "reaction")).toMatchObject({
      current: 400,
      percent: 75,
      earned: false,
    });
    expect(item(state(reaction(300)), "reaction")).toMatchObject({
      current: 300,
      percent: 100,
      earned: true,
    });
  });
  it("keeps percentage evidence valid within the engine's floating-point tolerance", () => {
    const db = state(tracking(30000.001, 30000));
    expect(item(db, "tracking").current).toBe(100);
    expect(
      migrate(JSON.parse(JSON.stringify(db))).achievementStats.tracking,
    ).toBe(100);
  });
  it("requires a clean eligible perfect click round for Ghost", () => {
    expect(item(state(clicks(29)), "ghost").earned).toBe(false);
    expect(item(state(clicks(30, 1)), "ghost").earned).toBe(false);
    expect(
      item(state(clicks(30, 0, { eligible: false })), "ghost").earned,
    ).toBe(false);
    const expired = clicks(30);
    expired.metrics.expired = 1;
    expect(item(state(expired), "ghost").earned).toBe(false);
    expect(item(state(clicks(30)), "ghost").earned).toBe(true);
  });
  it("requires a same-configuration standard comeback in chronological order", () => {
    const loss = clicks(10),
      win = session({ startedAt: "2026-09-22T10:02:00.000Z" });
    expect(item(state(loss, win), "second-wind").earned).toBe(true);
    expect(
      item(
        state(win, clicks(10, 0, { startedAt: "2026-09-22T10:04:00.000Z" })),
        "second-wind",
      ).earned,
    ).toBe(false);
    expect(
      item(state(loss, { ...win, eligible: false }), "second-wind").earned,
    ).toBe(false);
    expect(
      item(
        state(
          loss,
          session({
            config: config("flick-burst", { duration: 30 }),
            startedAt: win.startedAt,
          }),
        ),
        "second-wind",
      ).earned,
    ).toBe(false);
    expect(
      item(
        state(loss, session({ startedAt: "2026-09-22T10:00:30.000Z" })),
        "second-wind",
      ).earned,
    ).toBe(false);
    const middle = session({
      config: config("micro-precision"),
      startedAt: "2026-09-22T10:01:00.000Z",
    });
    expect(item(state(loss, middle, win), "second-wind").earned).toBe(false);
  });
  it("uses frozen local dates for Parallel worlds, not the currently selected timezone", () => {
    const two = session({
      startedAt: "2026-09-21T23:30:00.000Z",
      timezone: "Asia/Tashkent",
    });
    const three = session({
      config: config("sphere-flick"),
      startedAt: "2026-09-22T10:00:00.000Z",
    });
    const db = state(two, three);
    db.settings.timezone = "America/New_York";
    rebuild(db);
    expect(item(db, "parallel-worlds").earned).toBe(true);
    expect(
      item(
        state(session({ startedAt: "2026-09-21T10:00:00.000Z" }), three),
        "parallel-worlds",
      ).earned,
    ).toBe(false);
  });
});

describe("achievement retention", () => {
  it("does not mutate stored evidence when merely rendering achievement progress", () => {
    const db = freshSnapshot();
    db.sessions = [clicks(30)];
    const before = structuredClone(db);
    expect(item(db, "ghost").earned).toBe(true);
    expect(db).toEqual(before);
  });
  it("keeps earned and partial skill evidence after every detailed session expires", () => {
    const db = state(clicks(24), tracking(20000, 30000, 9000), reaction(400));
    const before = getAchievementProgress(db);
    compact(db, 0, "2035-09-22T00:00:00.000Z");
    expect(db.sessions).toHaveLength(0);
    expect(
      getAchievementProgress(migrate(JSON.parse(JSON.stringify(db)))),
    ).toEqual(before);
  });
  it("captures legacy qualifying days before the daily archive and its goals expire", () => {
    const db = freshSnapshot();
    for (let i = 1; i <= 6; i++) {
      const date = `2018-01-0${i}`;
      db.archiveDays[`${date}|mouse`] = {
        ...db.ancient,
        sessions: 1,
        activeMs: 60000,
      };
      db.dayGoals[date] = 60;
    }
    compact(db, 0, "2026-09-22T00:00:00.000Z");
    expect(item(db, "seven")).toMatchObject({ current: 6, earned: false });
    db.sessions.push(session({ activeMs: 180000 }));
    rebuild(db);
    expect(item(db, "seven").earned).toBe(true);
  });
  it("retains the loss at the archive boundary for a future comeback", () => {
    const db = state(clicks(10));
    compact(db, 0);
    db.sessions.push(session({ startedAt: "2026-09-22T10:02:00.000Z" }));
    rebuild(db);
    expect(item(db, "second-wind").earned).toBe(true);
  });
  it("retains same-day dimension evidence across compaction", () => {
    const db = state(session());
    compact(db, 0);
    db.sessions.push(
      session({
        config: config("sphere-flick"),
        startedAt: "2026-09-22T10:02:00.000Z",
      }),
    );
    rebuild(db);
    expect(item(db, "parallel-worlds").earned).toBe(true);
  });
  it("preserves earned legacy IDs even when old detailed metrics are unavailable", () => {
    const legacy = {
      ...freshSnapshot(),
      achievements: ["first", "routine", "seven", "hour", "precision"],
    };
    const raw = JSON.parse(JSON.stringify(legacy));
    delete raw.achievementStats;
    const upgraded = migrate(raw);
    expect(upgraded.achievementStats).toBeDefined();
    for (const id of legacy.achievements)
      expect(item(upgraded, id)).toMatchObject({ earned: true, percent: 100 });
    expect(item(upgraded, "explorer").current).toBe(0);
  });
});
