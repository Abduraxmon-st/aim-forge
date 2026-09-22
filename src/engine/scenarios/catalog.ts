import { type Config, type Settings, scenarioIds } from "../../domain/models";
import { dimension, hash } from "../../domain/rules";
export const catalog = scenarioIds.map((id, i) => ({
  id,
  dimension: dimension(id),
  skill:
    i === 3 || i === 7 || i === 8
      ? "tracking"
      : i === 4
        ? "reaction"
        : i === 1 || i === 6
          ? "precision"
          : i === 9
            ? "switching"
            : "flicking",
  version: 1,
}));
export function preset(
  id: Config["scenario"],
  settings: Settings,
  difficulty: Config["difficulty"] = "beginner",
  duration: Config["duration"] = 60,
): Config {
  const d = ["beginner", "intermediate", "advanced"].indexOf(difficulty);
  return {
    scenario: id,
    version: 1,
    scoringVersion: 1,
    difficulty,
    duration,
    trials: 10,
    radius: id === "micro-precision" ? 18 - d * 4 : 34 - d * 7,
    count:
      id === "flick-burst" || id === "sphere-flick"
        ? 3
        : id === "target-switching"
          ? 4
          : 1,
    speed: 100 + d * 65,
    lifetime: 6000 - d * 1300,
    fov: settings.fov,
    distance: id === "precision-range" ? 18 : 14,
    input: dimension(id) === "3d" ? "mouse" : settings.input,
    palette: settings.palette,
    sensitivity: settings.sensitivity,
    smoothing: settings.smoothing,
    kind: "standard",
    seed: hash(new Date().toISOString()),
  };
}
export function dailyConfig(
  dim: "2d" | "3d",
  utcDate: string,
  settings: Settings,
): Config {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(utcDate) ||
    new Date(utcDate + "T00:00:00Z").toISOString().slice(0, 10) !== utcDate
  )
    throw new Error("Invalid challenge link.");
  const seed = hash("daily-v1" + utcDate + dim),
    choices =
      dim === "2d"
        ? ([
            "flick-burst",
            "micro-precision",
            "moving-clicks",
            "smooth-tracking",
          ] as const)
        : ([
            "sphere-flick",
            "precision-range",
            "strafe-tracking",
            "reactive-tracking",
            "target-switching",
          ] as const);
  const c = preset(choices[seed % choices.length], settings);
  return {
    ...c,
    input: dim === "3d" ? "mouse" : settings.input,
    fov: 75,
    palette: "violet",
    smoothing: false,
    kind: "daily",
    seed,
    challengeId: "daily-v1-" + utcDate + "-" + dim,
  };
}
