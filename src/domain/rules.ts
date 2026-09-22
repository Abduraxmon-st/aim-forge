import {
  type Config,
  type Metrics,
  type Session,
  type Snapshot,
  type Totals,
  emptyTotals,
} from "./models";
import { awardAchievements } from "./achievements";
export const ratio = (a: number, b: number) => (b > 0 ? (100 * a) / b : null);
export const median = (values: number[]) => percentile(values, 50);
export function percentile(values: number[], p: number) {
  if (!values.length) return null;
  const a = [...values].sort((a, b) => a - b),
    i = ((a.length - 1) * p) / 100,
    lo = Math.floor(i);
  return a[lo] + (a[Math.ceil(i)] - a[lo]) * (i - lo);
}
export function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
/** Mulberry32 v1. Gameplay uses only this generator. */
export function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function dateInZone(iso: string, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(iso));
  const p = (k: string) => parts.find((x) => x.type === k)!.value;
  return `${p("year")}-${p("month")}-${p("day")}`;
}
export function addDays(day: string, days: number) {
  const d = new Date(day + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export const isTracking = (id: string) => id.includes("tracking");
export const isReaction = (id: string) => id === "reaction-tap";
export const dimension = (id: string): "2d" | "3d" =>
  [
    "sphere-flick",
    "precision-range",
    "strafe-tracking",
    "reactive-tracking",
    "target-switching",
  ].includes(id)
    ? "3d"
    : "2d";
export function comparisonKey(c: Config) {
  const { seed: _seed, sensitivity: _sensitivity, ...scoring } = c;
  return JSON.stringify(scoring);
}
export function score(c: Config, m: Metrics) {
  if (isTracking(c.scenario))
    return Math.round(10 * (ratio(m.onTargetMs, m.exposureMs) ?? 0));
  if (isReaction(c.scenario)) {
    const med = median(m.reaction);
    return med === null
      ? 0
      : Math.max(
          0,
          Math.round(1000 - med - 100 * m.falseStarts - 100 * m.timeouts),
        );
  }
  return Math.max(0, 100 * m.hits - 25 * m.misses);
}
export function winGoal(c: Config) {
  const d = ["beginner", "intermediate", "advanced"].indexOf(c.difficulty);
  if (isTracking(c.scenario))
    return {
      metric: "tracking",
      value: 60 + d * 10,
      min: Math.max(25000, c.duration * 950),
    };
  if (isReaction(c.scenario))
    return { metric: "reaction", value: 450 - d * 70, min: 8 };
  const base =
    c.scenario === "micro-precision"
      ? 35
      : c.scenario === "precision-range"
        ? 30
        : c.scenario === "target-switching"
          ? 45
          : c.scenario === "moving-clicks"
            ? 40
            : 50;
  return {
    metric: "click",
    value: Math.ceil(((base + d * 15) * c.duration) / 60),
    min: 80 + d * 5,
  };
}
export function won(c: Config, m: Metrics) {
  const g = winGoal(c);
  if (g.metric === "tracking")
    return (
      m.exposureMs >= g.min &&
      (ratio(m.onTargetMs, m.exposureMs) ?? 0) >= g.value
    );
  if (g.metric === "reaction")
    return (
      m.reaction.length >= g.min &&
      (median(m.reaction) ?? Infinity) <= g.value &&
      m.falseStarts === 0 &&
      m.timeouts === 0
    );
  return m.hits >= g.value && (ratio(m.hits, m.shots) ?? 0) >= g.min;
}
export function sessionTotals(s: Session): Totals {
  if (s.status !== "finished" || s.activeMs <= 0) return emptyTotals();
  return {
    sessions: 1,
    activeMs: s.activeMs,
    hits: s.metrics.hits,
    shots: s.metrics.shots,
    onTargetMs: s.metrics.onTargetMs,
    exposureMs: s.metrics.exposureMs,
    goals: s.won && s.eligible ? 1 : 0,
  };
}
export function addTotals(a: Totals, b: Totals): Totals {
  return {
    sessions: a.sessions + b.sessions,
    activeMs: a.activeMs + b.activeMs,
    hits: a.hits + b.hits,
    shots: a.shots + b.shots,
    onTargetMs: a.onTargetMs + b.onTargetMs,
    exposureMs: a.exposureMs + b.exposureMs,
    goals: a.goals + b.goals,
  };
}
export function allTotals(db: Snapshot, input?: "mouse" | "touch") {
  let t = input ? emptyTotals() : db.ancient;
  for (const [k, v] of Object.entries(db.archiveDays))
    if (!input || k.endsWith(input)) t = addTotals(t, v);
  for (const [k, v] of Object.entries(db.archiveMonths))
    if (!input || k.endsWith(input)) t = addTotals(t, v);
  for (const s of db.sessions)
    if (!input || s.config.input === input) t = addTotals(t, sessionTotals(s));
  return t;
}
export function dayStreak(days: string[], today: string) {
  const unique = [...new Set(days)].sort();
  let run = 0,
    longest = 0,
    last = "";
  for (const d of unique) {
    run = last && addDays(last, 1) === d ? run + 1 : 1;
    longest = Math.max(longest, run);
    last = d;
  }
  let current = 0,
    cursor = unique.includes(today) ? today : addDays(today, -1);
  const set = new Set(unique);
  while (set.has(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }
  return { current, longest };
}
export function advanceWins(
  state: { current: number; longest: number },
  s: Session,
) {
  if (s.config.kind !== "standard" || s.activeMs <= 0) return state;
  const current =
    s.eligible && s.won && s.status === "finished" ? state.current + 1 : 0;
  return { current, longest: Math.max(state.longest, current) };
}
export function rebuild(
  db: Snapshot,
  now = new Date().toISOString(),
): Snapshot {
  db.daily = structuredClone(db.archiveDays);
  db.monthly = structuredClone(db.archiveMonths);
  let wins = { ...db.archivedWins };
  for (const s of db.sessions) {
    const key = s.date + "|" + s.config.input;
    db.daily[key] = addTotals(db.daily[key] ?? emptyTotals(), sessionTotals(s));
    wins = advanceWins(wins, s);
  }
  for (const [k, v] of Object.entries(db.daily)) {
    const m = k.slice(0, 7) + k.slice(10);
    db.monthly[m] = addTotals(db.monthly[m] ?? emptyTotals(), v);
  }
  const days: Record<string, number> = {};
  for (const [k, t] of Object.entries(db.daily))
    days[k.slice(0, 10)] = (days[k.slice(0, 10)] ?? 0) + t.activeMs;
  const qualifying = Object.keys(days).filter(
    (d) => days[d] >= (db.dayGoals[d] ?? 180) * 1000,
  );
  const streak = dayStreak(qualifying, dateInZone(now, db.settings.timezone));
  db.streaks = {
    current: streak.current,
    longest: Math.max(db.streaks.longest, streak.longest),
    wins: wins.current,
    longestWins: wins.longest,
  };
  awardAchievements(db);
  return db;
}
export function coaching(s: Session, history: Session[]) {
  const comparable = history
    .filter(
      (r) =>
        r.comparisonKey === s.comparisonKey &&
        r.eligible &&
        r.status === "finished",
    )
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  if (comparable.length < 5)
    return { key: "coachNotEnough", count: comparable.length };
  const recent = comparable.slice(-3),
    previous = comparable.slice(-5, -3);
  if (isReaction(s.config.scenario)) {
    const current = median(recent.flatMap((r) => r.metrics.reaction));
    const earlier = median(previous.flatMap((r) => r.metrics.reaction));
    return current !== null && earlier !== null
      ? { key: "coachReaction", count: 5, delta: current - earlier }
      : { key: "coachNotEnough", count: comparable.length };
  }
  const sum = (runs: Session[]) =>
    runs.reduce((t, r) => addTotals(t, sessionTotals(r)), emptyTotals());
  const a = sum(recent),
    b = sum(previous);
  if (
    !isTracking(s.config.scenario) &&
    !isReaction(s.config.scenario) &&
    (ratio(a.hits, a.shots) ?? 100) < winGoal(s.config).min
  )
    return { key: "coachAccuracy", count: 5 };
  return {
    key: "coachWindows",
    count: 5,
    delta: isTracking(s.config.scenario)
      ? (ratio(a.onTargetMs, a.exposureMs) ?? 0) -
        (ratio(b.onTargetMs, b.exposureMs) ?? 0)
      : (ratio(a.hits, a.shots) ?? 0) - (ratio(b.hits, b.shots) ?? 0),
  };
}
