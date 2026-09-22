import {
  freshSnapshot,
  snapshotSchema,
  sessionSchema,
  type Snapshot,
  type Session,
  type Settings,
  emptyTotals,
  type Routine,
} from "../domain/models";
import {
  addTotals,
  rebuild,
  sessionTotals,
  advanceWins,
  comparisonKey,
  score,
  won,
  dateInZone,
} from "../domain/rules";
export const STORAGE_KEY = "aimforge:data:v2",
  BACKUP_KEY = "aimforge:recovery:v2";
const SOFT_BUDGET = 3 * 1024 * 1024;
export interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
export class StorageFault extends Error {
  constructor(
    public code:
      "corrupt" | "version" | "unavailable" | "full" | "conflict" | "old",
    message: string = code,
  ) {
    super(message);
  }
}
export function migrate(raw: unknown): Snapshot {
  if (!raw || typeof raw !== "object") throw new StorageFault("corrupt");
  const r = raw as Record<string, unknown>;
  if (r.schema !== 2) throw new StorageFault("version");
  const parsed = snapshotSchema.safeParse(raw);
  if (!parsed.success) throw new StorageFault("corrupt");
  validateConsistency(parsed.data);
  return rebuild(parsed.data);
}
export function validateConsistency(db: Snapshot) {
  const ids = new Set<string>();
  for (const s of db.sessions) {
    if (ids.has(s.id)) throw new StorageFault("corrupt");
    ids.add(s.id);
    if (
      s.comparisonKey !== comparisonKey(s.config) ||
      s.score !== score(s.config, s.metrics) ||
      s.won !== (s.status === "finished" && won(s.config, s.metrics)) ||
      s.month !== s.date.slice(0, 7) ||
      s.date !== dateInZone(s.startedAt, s.timezone) ||
      new Date(s.endedAt) < new Date(s.startedAt) ||
      s.metrics.exposureMs > s.activeMs + 1
    )
      throw new StorageFault("corrupt");
  }
  if (
    Object.keys(db.archiveDays).length > 3000 ||
    Object.keys(db.archiveMonths).length > 200 ||
    Object.keys(db.records).length > 2500 ||
    Object.keys(db.dayGoals).length > 3000 ||
    Object.keys(db.dailyBest).length > 2000
  )
    throw new StorageFault("corrupt");
}
export function parseBackup(text: string) {
  if (new Blob([text]).size > 6 * 1024 * 1024)
    throw new StorageFault("corrupt", "importTooLarge");
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new StorageFault("corrupt");
  }
  return migrate(raw);
}
/** Archived buckets and retained sessions are disjoint source sets. Caches are never added back as source data. */
export function compact(
  db: Snapshot,
  limit = 500,
  now = new Date().toISOString(),
): Snapshot {
  while (db.sessions.length > limit) {
    const s = db.sessions.shift()!;
    const key = s.date + "|" + s.config.input;
    db.archiveDays[key] = addTotals(
      db.archiveDays[key] ?? emptyTotals(),
      sessionTotals(s),
    );
    db.archivedWins = advanceWins(db.archivedWins, s);
    db.archivedThrough = [db.archivedThrough, s.startedAt].sort().at(-1)!;
  }
  for (let i = 0; i < db.sessions.length - 20; i++)
    db.sessions[i].metrics.heatmap = Array(96).fill(0);
  const current = new Date(now),
    dailyCut = new Date(
      Date.UTC(current.getUTCFullYear(), current.getUTCMonth() - 24, 1),
    )
      .toISOString()
      .slice(0, 10),
    monthlyCut = new Date(
      Date.UTC(current.getUTCFullYear(), current.getUTCMonth() - 60, 1),
    )
      .toISOString()
      .slice(0, 7);
  for (const [k, v] of Object.entries(db.archiveDays))
    if (k.slice(0, 10) < dailyCut) {
      const m = k.slice(0, 7) + k.slice(10);
      db.archiveMonths[m] = addTotals(db.archiveMonths[m] ?? emptyTotals(), v);
      delete db.archiveDays[k];
    }
  for (const [k, v] of Object.entries(db.archiveMonths))
    if (k.slice(0, 7) < monthlyCut) {
      db.ancient = addTotals(db.ancient, v);
      delete db.archiveMonths[k];
    }
  for (const d of Object.keys(db.dayGoals))
    if (d < dailyCut) delete db.dayGoals[d];
  const challenges = Object.keys(db.dailyBest).sort();
  for (const k of challenges.slice(0, -1460)) delete db.dailyBest[k];
  return rebuild(db, now);
}
export class Repository {
  constructor(private storage: StoragePort) {}
  read(): Snapshot {
    let text: string | null;
    try {
      text = this.storage.getItem(STORAGE_KEY);
    } catch {
      throw new StorageFault("unavailable");
    }
    if (!text) return freshSnapshot();
    try {
      return migrate(JSON.parse(text));
    } catch (e) {
      if (e instanceof StorageFault) throw e;
      throw new StorageFault("corrupt");
    }
  }
  raw() {
    return this.storage.getItem(STORAGE_KEY) ?? "";
  }
  recovery() {
    return this.storage.getItem(BACKUP_KEY) ?? "";
  }
  write(next: Snapshot, expected: number, preserve = false) {
    const existing = this.storage.getItem(STORAGE_KEY);
    if (existing) {
      const old = migrate(JSON.parse(existing));
      if (old.revision !== expected) throw new StorageFault("conflict");
    }
    next.revision = expected + 1;
    compact(next);
    let payload = JSON.stringify(next);
    while (
      (payload.length + (existing?.length ?? 0)) * 2 > SOFT_BUDGET &&
      next.sessions.length > 20
    ) {
      compact(next, Math.max(20, next.sessions.length - 50));
      payload = JSON.stringify(next);
    }
    if ((payload.length + (existing?.length ?? 0)) * 2 > SOFT_BUDGET)
      throw new StorageFault("full");
    try {
      if (preserve && existing) this.storage.setItem(BACKUP_KEY, existing);
      else this.storage.removeItem(BACKUP_KEY);
      this.storage.setItem(STORAGE_KEY, payload);
    } catch {
      throw new StorageFault("full");
    }
    return next;
  }
  update(fn: (d: Snapshot) => void, preserve = false) {
    const d = this.read(),
      revision = d.revision;
    fn(d);
    return this.write(rebuild(d), revision, preserve);
  }
  commit(session: Session) {
    sessionSchema.parse(session);
    return this.update((db) => {
      if (db.sessions.some((s) => s.id === session.id)) return;
      if (db.archivedThrough && session.startedAt <= db.archivedThrough)
        throw new StorageFault("old");
      db.sessions.push(session);
      db.sessions.sort((a, b) => a.startedAt.localeCompare(b.startedAt));
      db.lastScenario = session.config.scenario;
      db.dayGoals[session.date] ??= session.dayGoal;
      if (session.eligible && session.status === "finished") {
        const key = session.comparisonKey,
          prev = db.records[key];
        if (!prev || session.score > prev.score)
          db.records[key] = {
            score: session.score,
            id: session.id,
            date: session.date,
            scenario: session.config.scenario,
          };
        if (session.config.kind === "daily" && session.config.challengeId) {
          const k = session.config.challengeId + "|" + key,
            old = db.dailyBest[k];
          if (!old || session.score > old.score)
            db.dailyBest[k] = {
              score: session.score,
              id: session.id,
              won: session.won,
            };
        }
      }
      if (
        session.status === "finished" &&
        session.routineId &&
        db.routineProgress?.routineId === session.routineId &&
        session.routineStep === db.routineProgress.step
      ) {
        const routine = db.routines.find((r) => r.id === session.routineId);
        if (routine) {
          const steps = expandRoutine(routine);
          db.routineProgress.step++;
          db.routineProgress.completed++;
          db.routineProgress.activeMs += session.activeMs;
          db.routineProgress.restUntil =
            Date.now() + steps[session.routineStep!].rest * 1000;
          if (db.routineProgress.step >= steps.length) db.routinesCompleted++;
        }
      }
    });
  }
  replace(next: Snapshot) {
    const clean = migrate(next);
    let old: Snapshot;
    try {
      old = this.read();
    } catch (e) {
      if (
        !(e instanceof StorageFault) ||
        !["corrupt", "version"].includes(e.code)
      )
        throw e;
      const existing = this.raw();
      clean.revision = 1;
      const payload = JSON.stringify(clean);
      if ((existing.length + payload.length) * 2 > SOFT_BUDGET)
        throw new StorageFault("full");
      try {
        this.storage.setItem(BACKUP_KEY, existing);
        this.storage.setItem(STORAGE_KEY, payload);
      } catch {
        throw new StorageFault("full");
      }
      return clean;
    }
    clean.revision = old.revision;
    return this.write(rebuild(clean), old.revision, true);
  }
}
export const expandRoutine = (r: Routine) =>
  r.steps.flatMap((s) =>
    Array.from({ length: s.rounds }, () => ({ ...s, rounds: 1 })),
  );
let singleton: Repository | undefined;
export function repository() {
  return (singleton ??= new Repository(window.localStorage));
}
export async function transact<T>(fn: () => T): Promise<T> {
  if (typeof navigator !== "undefined" && navigator.locks)
    return navigator.locks.request("aimforge:write", () => fn());
  return fn();
}
export const patchSettings = (patch: Partial<Settings>) =>
  transact(() =>
    repository().update((db) => {
      db.settings = { ...db.settings, ...patch };
    }),
  );
/** Web Locks are held for the life of a round. The lease fallback is checked continuously and fails closed on conflict. */
export async function acquireTraining(onLost: () => void): Promise<() => void> {
  const token = crypto.randomUUID();
  if (navigator.locks) {
    return new Promise((resolve, reject) => {
      let release: () => void;
      const done = new Promise<void>((r) => {
        release = r;
      });
      navigator.locks
        .request("aimforge:training", { ifAvailable: true }, async (lock) => {
          if (!lock) {
            reject(new StorageFault("conflict"));
            return;
          }
          resolve(() => release());
          await done;
        })
        .catch(reject);
    });
  }
  const key = "aimforge:training-lease";
  const read = () => {
    try {
      return JSON.parse(localStorage.getItem(key) ?? "null") as {
        token: string;
        until: number;
      } | null;
    } catch {
      return null;
    }
  };
  const existing = read();
  if (existing && existing.until > Date.now())
    throw new StorageFault("conflict");
  localStorage.setItem(
    key,
    JSON.stringify({ token, until: Date.now() + 5000 }),
  );
  await new Promise((r) => setTimeout(r, 80));
  if (read()?.token !== token) throw new StorageFault("conflict");
  const timer = setInterval(() => {
    if (read()?.token !== token) {
      clearInterval(timer);
      onLost();
    } else
      localStorage.setItem(
        key,
        JSON.stringify({ token, until: Date.now() + 5000 }),
      );
  }, 1000);
  return () => {
    clearInterval(timer);
    if (read()?.token === token) localStorage.removeItem(key);
  };
}
