import {
  emptyAchievementStats,
  type AchievementStats,
  type Session,
  type Snapshot,
} from "./models";

type Definition = {
  id: string;
  category: "practice" | "consistency" | "skill" | "discovery";
  secret: boolean;
  target: number;
  unit:
    | "sessions"
    | "minutes"
    | "routines"
    | "days"
    | "wins"
    | "modes"
    | "hits"
    | "percent"
    | "milliseconds"
    | "palettes"
    | "condition";
};

export const achievementCatalog = [
  {
    id: "first",
    category: "practice",
    target: 1,
    unit: "sessions",
    secret: false,
  },
  {
    id: "ten",
    category: "practice",
    target: 10,
    unit: "sessions",
    secret: false,
  },
  {
    id: "fifty",
    category: "practice",
    target: 50,
    unit: "sessions",
    secret: false,
  },
  {
    id: "hundred",
    category: "practice",
    target: 100,
    unit: "sessions",
    secret: false,
  },
  {
    id: "warmup-time",
    category: "practice",
    target: 15,
    unit: "minutes",
    secret: false,
  },
  {
    id: "hour",
    category: "practice",
    target: 60,
    unit: "minutes",
    secret: false,
  },
  {
    id: "five-hours",
    category: "practice",
    target: 300,
    unit: "minutes",
    secret: false,
  },
  {
    id: "routine",
    category: "consistency",
    target: 1,
    unit: "routines",
    secret: false,
  },
  {
    id: "routines-five",
    category: "consistency",
    target: 5,
    unit: "routines",
    secret: false,
  },
  {
    id: "seven",
    category: "consistency",
    target: 7,
    unit: "days",
    secret: false,
  },
  {
    id: "streak-three",
    category: "consistency",
    target: 3,
    unit: "days",
    secret: false,
  },
  {
    id: "streak-seven",
    category: "consistency",
    target: 7,
    unit: "days",
    secret: false,
  },
  {
    id: "first-win",
    category: "skill",
    target: 1,
    unit: "wins",
    secret: false,
  },
  {
    id: "ten-wins",
    category: "skill",
    target: 10,
    unit: "wins",
    secret: false,
  },
  {
    id: "precision",
    category: "skill",
    target: 95,
    unit: "percent",
    secret: false,
  },
  { id: "combo", category: "skill", target: 25, unit: "hits", secret: false },
  {
    id: "tracking",
    category: "skill",
    target: 70,
    unit: "percent",
    secret: false,
  },
  {
    id: "reaction",
    category: "skill",
    target: 300,
    unit: "milliseconds",
    secret: false,
  },
  {
    id: "explorer",
    category: "discovery",
    target: 5,
    unit: "modes",
    secret: false,
  },
  {
    id: "all-modes",
    category: "discovery",
    target: 10,
    unit: "modes",
    secret: false,
  },
  { id: "ghost", category: "skill", target: 30, unit: "hits", secret: true },
  {
    id: "still-water",
    category: "skill",
    target: 10000,
    unit: "milliseconds",
    secret: true,
  },
  {
    id: "second-wind",
    category: "consistency",
    target: 1,
    unit: "condition",
    secret: true,
  },
  {
    id: "parallel-worlds",
    category: "discovery",
    target: 1,
    unit: "condition",
    secret: true,
  },
  {
    id: "prism",
    category: "discovery",
    target: 3,
    unit: "palettes",
    secret: true,
  },
] as const satisfies readonly Definition[];

export type AchievementId = (typeof achievementCatalog)[number]["id"];
export type AchievementProgress = (typeof achievementCatalog)[number] & {
  earned: boolean;
  current: number;
  percent: number;
};

const threeDimensional = new Set([
  "sphere-flick",
  "precision-range",
  "strafe-tracking",
  "reactive-tracking",
  "target-switching",
]);
const completed = (s: Session) => s.status === "finished" && s.activeMs > 0;
const accuracy = (s: Session) =>
  s.metrics.shots > 0 ? (100 * s.metrics.hits) / s.metrics.shots : 0;

/** Only the last archived session is needed to check a comeback across retention. */
export function achievementSessionEvidence(
  s: Session,
): NonNullable<AchievementStats["previousSession"]> {
  return {
    id: s.id,
    startedAt: s.startedAt,
    endedAt: s.endedAt,
    comparisonKey: s.comparisonKey,
    eligibleStandard:
      completed(s) && s.eligible && s.config.kind === "standard",
    won: s.won,
  };
}

function qualifyingDays(db: Snapshot) {
  const days: Record<string, number> = {};
  for (const [key, totals] of Object.entries(db.archiveDays))
    days[key.slice(0, 10)] = (days[key.slice(0, 10)] ?? 0) + totals.activeMs;
  for (const s of db.sessions)
    if (completed(s)) days[s.date] = (days[s.date] ?? 0) + s.activeMs;
  return Object.keys(days).filter(
    (date) => days[date] >= (db.dayGoals[date] ?? 180) * 1000,
  );
}

function collectEvidence(db: Snapshot): AchievementStats {
  const stats = structuredClone(db.achievementStats ?? emptyAchievementStats());
  stats.qualifyingDays = [
    ...new Set([...stats.qualifyingDays, ...qualifyingDays(db)]),
  ]
    .sort()
    .slice(0, 7);
  const modes = new Set(stats.modes),
    palettes = new Set(stats.palettes);
  let previous = stats.previousSession;
  for (const s of [...db.sessions].sort(
    (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
  )) {
    const evidence = achievementSessionEvidence(s);
    if (
      evidence.eligibleStandard &&
      evidence.won &&
      previous?.eligibleStandard &&
      !previous.won &&
      previous.id !== evidence.id &&
      previous.comparisonKey === evidence.comparisonKey &&
      new Date(previous.endedAt).getTime() <=
        new Date(evidence.startedAt).getTime()
    )
      stats.comeback = true;
    previous = evidence;
    if (!completed(s)) continue;
    modes.add(s.config.scenario);
    palettes.add(s.config.palette);
    if (!stats.parallel) {
      const dimension = threeDimensional.has(s.config.scenario) ? "3d" : "2d";
      if (
        stats.dimensionDays[s.date] &&
        stats.dimensionDays[s.date] !== dimension
      )
        stats.parallel = true;
      stats.dimensionDays[s.date] = dimension;
    }
    const tracking = s.config.scenario.includes("tracking");
    const reaction = s.config.scenario === "reaction-tap";
    if (!tracking && !reaction) {
      if (s.metrics.shots >= 50)
        stats.accuracy = Math.max(stats.accuracy, accuracy(s));
      stats.combo = Math.max(stats.combo, s.metrics.bestCombo);
      if (
        s.eligible &&
        s.metrics.hits === s.metrics.shots &&
        s.metrics.expired === 0
      )
        stats.perfectHits = Math.max(stats.perfectHits, s.metrics.hits);
    }
    if (tracking && s.metrics.exposureMs >= 30000) {
      stats.tracking = Math.max(
        stats.tracking,
        Math.min(100, (100 * s.metrics.onTargetMs) / s.metrics.exposureMs),
      );
      stats.continuousTrackingMs = Math.max(
        stats.continuousTrackingMs,
        s.metrics.longestTrackingMs,
      );
    }
    if (
      reaction &&
      s.eligible &&
      s.metrics.reaction.length >= 8 &&
      s.metrics.falseStarts === 0 &&
      s.metrics.timeouts === 0
    ) {
      const values = [...s.metrics.reaction].sort((a, b) => a - b),
        middle = (values.length - 1) / 2;
      const median =
        (values[Math.floor(middle)] + values[Math.ceil(middle)]) / 2;
      stats.reactionMs =
        stats.reactionMs === null ? median : Math.min(stats.reactionMs, median);
    }
  }
  stats.modes = [...modes];
  stats.palettes = [...palettes];
  if (stats.parallel) stats.dimensionDays = {};
  else if (db.archivedThrough) {
    // New commits cannot precede the archive boundary; UTC ±14 h can cross one date.
    const boundary = new Date(db.archivedThrough).getTime();
    if (Number.isFinite(boundary)) {
      const oldestPossibleDate = new Date(boundary - 86400000)
        .toISOString()
        .slice(0, 10);
      for (const day of Object.keys(stats.dimensionDays))
        if (day < oldestPossibleDate) delete stats.dimensionDays[day];
    }
  }
  return stats;
}

function values(
  db: Snapshot,
  stats: AchievementStats,
): Record<AchievementId, number> {
  let sessions = 0,
    activeMs = 0,
    wins = 0;
  for (const aggregate of [
    db.ancient,
    ...Object.values(db.archiveDays),
    ...Object.values(db.archiveMonths),
  ]) {
    sessions += aggregate.sessions;
    activeMs += aggregate.activeMs;
    wins += aggregate.goals;
  }
  for (const s of db.sessions)
    if (completed(s)) {
      sessions++;
      activeMs += s.activeMs;
      if (s.eligible && s.won) wins++;
    }
  return {
    first: sessions,
    ten: sessions,
    fifty: sessions,
    hundred: sessions,
    "warmup-time": activeMs / 60000,
    hour: activeMs / 60000,
    "five-hours": activeMs / 60000,
    routine: db.routinesCompleted,
    "routines-five": db.routinesCompleted,
    seven: stats.qualifyingDays.length,
    "streak-three": db.streaks.longest,
    "streak-seven": db.streaks.longest,
    "first-win": wins,
    "ten-wins": wins,
    explorer: stats.modes.length,
    "all-modes": stats.modes.length,
    precision: stats.accuracy,
    combo: stats.combo,
    tracking: stats.tracking,
    reaction: stats.reactionMs ?? 0,
    ghost: stats.perfectHits,
    "still-water": stats.continuousTrackingMs,
    "second-wind": Number(stats.comeback),
    "parallel-worlds": Number(stats.parallel),
    prism: stats.palettes.length,
  };
}

function progress(
  db: Snapshot,
  stats: AchievementStats,
): AchievementProgress[] {
  const currentValues = values(db, stats);
  return achievementCatalog.map((definition) => {
    const current = currentValues[definition.id];
    const condition =
      definition.id === "reaction"
        ? stats.reactionMs !== null && current <= definition.target
        : current >= definition.target;
    const earned = db.achievements.includes(definition.id) || condition;
    const percent = earned
      ? 100
      : definition.id === "reaction"
        ? stats.reactionMs === null
          ? 0
          : Math.min(100, (100 * definition.target) / current)
        : Math.min(100, (100 * current) / definition.target);
    return { ...definition, earned, current, percent };
  });
}

/** Read-only view; earned IDs survive upgrades even when older detailed evidence has expired. */
export function getAchievementProgress(db: Snapshot): AchievementProgress[] {
  return progress(db, collectEvidence(db));
}

/** Safe to repeat. Run before compaction so detailed skill evidence is never discarded first. */
export function awardAchievements(db: Snapshot) {
  db.achievementStats = collectEvidence(db);
  const earned = new Set(db.achievements);
  for (const achievement of progress(db, db.achievementStats))
    if (achievement.earned) earned.add(achievement.id);
  db.achievements = [...earned];
}
