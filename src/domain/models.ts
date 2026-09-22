import { z } from "zod";
export const scenarioIds = [
  "flick-burst",
  "micro-precision",
  "moving-clicks",
  "smooth-tracking",
  "reaction-tap",
  "sphere-flick",
  "precision-range",
  "strafe-tracking",
  "reactive-tracking",
  "target-switching",
] as const;
export const scenarioId = z.enum(scenarioIds);
export const difficultySchema = z.enum([
  "beginner",
  "intermediate",
  "advanced",
]);
export const inputSchema = z.enum(["mouse", "touch"]);
export const configSchema = z
  .object({
    scenario: scenarioId,
    version: z.literal(1),
    scoringVersion: z.literal(1),
    difficulty: difficultySchema,
    duration: z.union([z.literal(30), z.literal(60), z.literal(120)]),
    trials: z.literal(10),
    radius: z.number().min(8).max(50),
    count: z.number().int().min(1).max(6),
    speed: z.number().min(30).max(400),
    lifetime: z.number().min(600).max(10000),
    fov: z.number().min(45).max(110),
    distance: z.number().min(8).max(30),
    input: inputSchema,
    palette: z.enum(["violet", "cyan", "amber"]),
    sensitivity: z.number().min(0.005).max(0.5),
    smoothing: z.boolean(),
    kind: z.enum(["standard", "practice", "daily", "custom"]),
    seed: z.number().int().min(0).max(4294967295),
    challengeId: z.string().max(90).optional(),
  })
  .strict();
export type Config = z.infer<typeof configSchema>;
export const crosshairSchema = z.object({
  shape: z.enum(["cross", "dot", "circle"]),
  size: z.number().min(2).max(30),
  thickness: z.number().min(1).max(6),
  gap: z.number().min(0).max(15),
  color: z.string().regex(/^#[\da-f]{6}$/i),
  opacity: z.number().min(0.2).max(1),
  outline: z.boolean(),
});
export const settingsSchema = z.object({
  language: z.enum(["en", "es", "de", "ru", "uz"]),
  input: inputSchema,
  nickname: z.string().max(30),
  goal: z.enum(["balanced", "precision", "speed", "tracking"]),
  timezone: z
    .string()
    .max(80)
    .refine((v) => {
      try {
        new Intl.DateTimeFormat("en", { timeZone: v });
        return true;
      } catch {
        return false;
      }
    }),
  sensitivity: z.number().min(0.005).max(0.5),
  dpi: z.number().int().min(100).max(32000).nullable(),
  fov: z.number().min(45).max(110),
  smoothing: z.boolean(),
  unadjusted: z.boolean(),
  quality: z.enum(["low", "medium", "high"]),
  palette: z.enum(["violet", "cyan", "amber"]),
  master: z.number().min(0).max(1),
  hitVolume: z.number().min(0).max(1),
  missVolume: z.number().min(0).max(1),
  dailyGoal: z.number().int().min(60).max(3600),
  weeklyGoal: z.number().int().min(300).max(36000),
  breakReminder: z.boolean(),
  performance: z.boolean(),
  reducedMotion: z.boolean(),
  onboarded: z.boolean(),
  crosshair: crosshairSchema,
});
export type Settings = z.infer<typeof settingsSchema>;
export function defaultSettings(): Settings {
  return {
    language: "en",
    input: "mouse",
    nickname: "",
    goal: "balanced",
    timezone: "UTC",
    sensitivity: 0.08,
    dpi: null,
    fov: 75,
    smoothing: false,
    unadjusted: false,
    quality: "medium",
    palette: "violet",
    master: 0.35,
    hitVolume: 0.65,
    missVolume: 0.25,
    dailyGoal: 180,
    weeklyGoal: 1800,
    breakReminder: true,
    performance: false,
    reducedMotion: false,
    onboarded: false,
    crosshair: {
      shape: "cross",
      size: 9,
      thickness: 2,
      gap: 4,
      color: "#ffffff",
      opacity: 0.9,
      outline: true,
    },
  };
}
const nonneg = z.number().finite().min(0).max(1e12);
export const metricsSchema = z
  .object({
    shots: nonneg.int(),
    hits: nonneg.int(),
    misses: nonneg.int(),
    expired: nonneg.int(),
    bestCombo: nonneg.int(),
    combo: nonneg.int(),
    exposureMs: nonneg,
    onTargetMs: nonneg,
    longestTrackingMs: nonneg,
    falseStarts: nonneg.int(),
    timeouts: nonneg.int(),
    completedTargets: nonneg.int(),
    switches: nonneg.int(),
    centerErrorSum: nonneg,
    centerErrorCount: nonneg.int(),
    acquisition: z.array(nonneg).max(256),
    reaction: z.array(nonneg).max(256),
    switchTimes: z.array(nonneg).max(256),
    heatmap: z.array(nonneg.int()).length(96),
  })
  .refine(
    (m) => m.hits + m.misses === m.shots && m.onTargetMs <= m.exposureMs + 0.01,
    "Inconsistent metric counts",
  );
export type Metrics = z.infer<typeof metricsSchema>;
export const emptyMetrics = (): Metrics => ({
  shots: 0,
  hits: 0,
  misses: 0,
  expired: 0,
  bestCombo: 0,
  combo: 0,
  exposureMs: 0,
  onTargetMs: 0,
  longestTrackingMs: 0,
  falseStarts: 0,
  timeouts: 0,
  completedTargets: 0,
  switches: 0,
  centerErrorSum: 0,
  centerErrorCount: 0,
  acquisition: [],
  reaction: [],
  switchTimes: [],
  heatmap: Array(96).fill(0),
});
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const sessionSchema = z
  .object({
    id: z.string().uuid(),
    startedAt: z.string().datetime(),
    endedAt: z.string().datetime(),
    date: dateKey,
    month: z.string().regex(/^\d{4}-\d{2}$/),
    timezone: z.string().max(80),
    config: configSchema,
    comparisonKey: z.string().max(1500),
    status: z.enum(["finished", "aborted"]),
    eligible: z.boolean(),
    interruption: z.enum([
      "none",
      "pause",
      "blur",
      "hidden",
      "pointer",
      "context",
      "gap",
      "exit",
      "input",
      "coordination",
    ]),
    activeMs: nonneg.max(180000),
    dayGoal: z.number().int().min(60).max(3600),
    score: nonneg,
    won: z.boolean(),
    metrics: metricsSchema,
    environment: z.object({
      width: nonneg,
      height: nonneg,
      dpr: z.number().min(0.1).max(10),
      quality: z.enum(["low", "medium", "high"]),
      fps: nonneg,
      rawInput: z.boolean(),
    }),
    routineId: z.string().max(80).optional(),
    routineStep: z.number().int().min(0).max(1000).optional(),
  })
  .strict();
export type Session = z.infer<typeof sessionSchema>;
export const totalSchema = z.object({
  sessions: nonneg,
  activeMs: nonneg,
  hits: nonneg,
  shots: nonneg,
  onTargetMs: nonneg,
  exposureMs: nonneg,
  goals: nonneg,
});
export type Totals = z.infer<typeof totalSchema>;
export const emptyTotals = (): Totals => ({
  sessions: 0,
  activeMs: 0,
  hits: 0,
  shots: 0,
  onTargetMs: 0,
  exposureMs: 0,
  goals: 0,
});
export const routineSchema = z.object({
  id: z.string().max(80),
  name: z.string().min(1).max(60),
  steps: z
    .array(
      z.object({
        scenario: scenarioId,
        duration: z.union([z.literal(30), z.literal(60), z.literal(120)]),
        rounds: z.number().int().min(1).max(10),
        rest: z.number().int().min(0).max(120),
      }),
    )
    .min(1)
    .max(20),
});
export type Routine = z.infer<typeof routineSchema>;
export const routinePresets: Routine[] = [
  {
    id: "warmup",
    name: "warmup",
    steps: [
      { scenario: "flick-burst", duration: 60, rounds: 2, rest: 10 },
      { scenario: "smooth-tracking", duration: 60, rounds: 2, rest: 10 },
      { scenario: "micro-precision", duration: 60, rounds: 1, rest: 0 },
    ],
  },
  {
    id: "balanced",
    name: "balancedRoutine",
    steps: [
      { scenario: "flick-burst", duration: 120, rounds: 1, rest: 15 },
      { scenario: "moving-clicks", duration: 120, rounds: 1, rest: 15 },
      { scenario: "sphere-flick", duration: 120, rounds: 1, rest: 15 },
      { scenario: "strafe-tracking", duration: 120, rounds: 1, rest: 15 },
      { scenario: "micro-precision", duration: 120, rounds: 1, rest: 0 },
    ],
  },
  {
    id: "precision",
    name: "precisionRoutine",
    steps: [
      { scenario: "micro-precision", duration: 60, rounds: 3, rest: 15 },
      { scenario: "precision-range", duration: 60, rounds: 2, rest: 15 },
    ],
  },
];
/** Compact, monotonic evidence for milestones whose original sessions can expire. */
export const achievementStatsSchema = z.object({
  modes: z.array(scenarioId).max(10),
  palettes: z.array(z.enum(["violet", "cyan", "amber"])).max(3),
  qualifyingDays: z.array(dateKey).max(7),
  accuracy: nonneg.max(100),
  combo: nonneg.int(),
  tracking: nonneg.max(100),
  reactionMs: nonneg.nullable(),
  perfectHits: nonneg.int(),
  continuousTrackingMs: nonneg,
  comeback: z.boolean(),
  parallel: z.boolean(),
  dimensionDays: z
    .record(dateKey, z.enum(["2d", "3d"]))
    .refine((days) => Object.keys(days).length <= 1000),
  previousSession: z
    .object({
      id: z.string().uuid(),
      startedAt: z.string().datetime(),
      endedAt: z.string().datetime(),
      comparisonKey: z.string().max(1500),
      eligibleStandard: z.boolean(),
      won: z.boolean(),
    })
    .nullable(),
});
export type AchievementStats = z.infer<typeof achievementStatsSchema>;
export const emptyAchievementStats = (): AchievementStats => ({
  modes: [],
  palettes: [],
  qualifyingDays: [],
  accuracy: 0,
  combo: 0,
  tracking: 0,
  reactionMs: null,
  perfectHits: 0,
  continuousTrackingMs: 0,
  comeback: false,
  parallel: false,
  dimensionDays: {},
  previousSession: null,
});
export const snapshotSchema = z
  .object({
    schema: z.literal(2),
    revision: nonneg.int(),
    settings: settingsSchema,
    sessions: z.array(sessionSchema).max(500),
    archiveDays: z.record(
      z.string().regex(/^\d{4}-\d{2}(?:-\d{2})?\|(mouse|touch)$/),
      totalSchema,
    ),
    archiveMonths: z.record(
      z.string().regex(/^\d{4}-\d{2}(?:-\d{2})?\|(mouse|touch)$/),
      totalSchema,
    ),
    ancient: totalSchema,
    archivedThrough: z.string(),
    records: z.record(
      z.string().max(1500),
      z.object({
        score: nonneg,
        id: z.string(),
        date: dateKey,
        scenario: scenarioId,
      }),
    ),
    dayGoals: z.record(dateKey, nonneg),
    favorites: z.array(scenarioId).max(10),
    routines: z.array(routineSchema).max(50),
    routineProgress: z
      .object({
        routineId: z.string().max(80),
        step: nonneg.int().max(1000),
        completed: nonneg.int(),
        activeMs: nonneg,
        restUntil: nonneg,
      })
      .nullable(),
    routinesCompleted: nonneg.int(),
    achievements: z.array(z.string().max(40)).max(100),
    achievementStats: achievementStatsSchema.default(emptyAchievementStats),
    dailyBest: z.record(
      z.string().max(1600),
      z.object({ score: nonneg, id: z.string(), won: z.boolean() }),
    ),
    archivedWins: z.object({ current: nonneg.int(), longest: nonneg.int() }),
    streaks: z.object({
      current: nonneg.int(),
      longest: nonneg.int(),
      wins: nonneg.int(),
      longestWins: nonneg.int(),
    }),
    daily: z.record(
      z.string().regex(/^\d{4}-\d{2}(?:-\d{2})?\|(mouse|touch)$/),
      totalSchema,
    ),
    monthly: z.record(
      z.string().regex(/^\d{4}-\d{2}(?:-\d{2})?\|(mouse|touch)$/),
      totalSchema,
    ),
    lastScenario: scenarioId.nullable(),
  })
  .strict();
export type Snapshot = z.infer<typeof snapshotSchema>;
export function freshSnapshot(): Snapshot {
  return {
    schema: 2,
    revision: 0,
    settings: defaultSettings(),
    sessions: [],
    archiveDays: {},
    archiveMonths: {},
    ancient: emptyTotals(),
    archivedThrough: "",
    records: {},
    dayGoals: {},
    favorites: [],
    routines: structuredClone(routinePresets),
    routineProgress: null,
    routinesCompleted: 0,
    achievements: [],
    achievementStats: emptyAchievementStats(),
    dailyBest: {},
    archivedWins: { current: 0, longest: 0 },
    streaks: { current: 0, longest: 0, wins: 0, longestWins: 0 },
    daily: {},
    monthly: {},
    lastScenario: null,
  };
}
