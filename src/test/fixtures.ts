import { defaultSettings, emptyMetrics, type Session } from "../domain/models";
import { preset } from "../engine/scenarios/catalog";
import { comparisonKey, dateInZone, score, won } from "../domain/rules";
export function session(overrides: Partial<Session> = {}): Session {
  const config = overrides.config ?? preset("flick-burst", defaultSettings());
  const metrics = overrides.metrics ?? {
    ...emptyMetrics(),
    shots: 60,
    hits: 50,
    misses: 10,
    bestCombo: 10,
  };
  const startedAt = overrides.startedAt ?? "2026-09-22T10:00:00.000Z",
    timezone = overrides.timezone ?? "UTC",
    date = dateInZone(startedAt, timezone);
  return {
    id: crypto.randomUUID(),
    startedAt,
    endedAt: new Date(new Date(startedAt).getTime() + 60000).toISOString(),
    date,
    month: date.slice(0, 7),
    timezone,
    config,
    comparisonKey: comparisonKey(config),
    status: "finished",
    eligible: true,
    interruption: "none",
    activeMs: 60000,
    dayGoal: 180,
    score: score(config, metrics),
    won: won(config, metrics),
    metrics,
    environment: {
      width: 960,
      height: 600,
      dpr: 1,
      quality: "medium",
      fps: 60,
      rawInput: false,
    },
    ...overrides,
  };
}
export class MemoryStorage {
  values = new Map<string, string>();
  fail = false;
  getItem(k: string) {
    return this.values.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    if (this.fail) throw new DOMException("full", "QuotaExceededError");
    this.values.set(k, v);
  }
  removeItem(k: string) {
    this.values.delete(k);
  }
}
