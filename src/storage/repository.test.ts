import { describe, it, expect } from "vitest";
import {
  Repository,
  STORAGE_KEY,
  parseBackup,
  compact,
  migrate,
  BACKUP_KEY,
} from "./repository";
import { session, MemoryStorage } from "../test/fixtures";
import { allTotals, rebuild } from "../domain/rules";
import { freshSnapshot } from "../domain/models";
describe("repository safety", () => {
  it("explicit replacement can recover corrupt data without discarding the original", () => {
    const m = new MemoryStorage(),
      r = new Repository(m);
    m.setItem(STORAGE_KEY, "{damaged");
    r.replace(freshSnapshot());
    expect(r.read().schema).toBe(2);
    expect(m.getItem(BACKUP_KEY)).toBe("{damaged");
  });
  it("freezes the session start goal even when settings change before saving", () => {
    const r = new Repository(new MemoryStorage());
    r.update((d) => {
      d.settings.dailyGoal = 600;
    });
    const s = session({ dayGoal: 180 });
    r.commit(s);
    expect(r.read().dayGoals[s.date]).toBe(180);
  });
  it("saves, validates and restores a result", () => {
    const memory = new MemoryStorage(),
      repo = new Repository(memory),
      s = session();
    repo.commit(s);
    expect(repo.read().sessions[0]).toEqual(s);
    expect(repo.read().achievements).toContain("first");
  });
  it("is idempotent across duplicate commits", () => {
    const repo = new Repository(new MemoryStorage()),
      s = session();
    repo.commit(s);
    repo.commit(s);
    expect(repo.read().sessions).toHaveLength(1);
    expect(repo.read().streaks.wins).toBe(1);
  });
  it("preserves valid data when a write fails", () => {
    const memory = new MemoryStorage(),
      repo = new Repository(memory);
    repo.commit(session());
    const before = memory.getItem(STORAGE_KEY);
    memory.fail = true;
    expect(() => repo.commit(session())).toThrow();
    expect(memory.getItem(STORAGE_KEY)).toBe(before);
  });
  it("never silently resets corrupt or unknown data", () => {
    const m = new MemoryStorage(),
      repo = new Repository(m);
    m.setItem(STORAGE_KEY, "{broken");
    expect(() => repo.read()).toThrow();
    expect(m.getItem(STORAGE_KEY)).toBe("{broken");
    expect(() => migrate({ schema: 999 })).toThrow();
  });
  it("rejects stale revisions", () => {
    const repo = new Repository(new MemoryStorage()),
      stale = repo.read();
    repo.commit(session());
    expect(() => repo.write(stale, 0)).toThrow("conflict");
  });
  it("round-trips imports and keeps recovery before replacement", () => {
    const m = new MemoryStorage(),
      repo = new Repository(m);
    repo.commit(session());
    const original = JSON.stringify(repo.read());
    const backup = parseBackup(original);
    repo.replace(backup);
    expect(repo.read().sessions).toHaveLength(1);
    expect(JSON.parse(m.getItem(BACKUP_KEY)!).sessions).toHaveLength(1);
  });
  it("rejects malformed, oversized and inconsistent imports", () => {
    expect(() => parseBackup("{}")).toThrow();
    expect(() => parseBackup("x".repeat(6 * 1024 * 1024 + 1))).toThrow();
    const db = freshSnapshot();
    db.sessions = [session({ score: 999 })];
    expect(() => parseBackup(JSON.stringify(db))).toThrow();
  });
  it("compacts without losing or double-counting totals and records", () => {
    const db = freshSnapshot();
    for (let i = 0; i < 530; i++)
      db.sessions.push(
        session({
          startedAt: new Date(Date.UTC(2026, 8, 1) + i * 120000).toISOString(),
        }),
      );
    const before = allTotals(db);
    compact(db);
    expect(db.sessions).toHaveLength(500);
    expect(allTotals(db)).toEqual(before);
    expect(allTotals(rebuild(rebuild(db)))).toEqual(before);
  });
  it("carries historical totals across retention windows", () => {
    const db = freshSnapshot();
    db.sessions = [
      session({ startedAt: "2018-01-01T10:00:00.000Z" }),
      session({ startedAt: "2023-01-01T10:00:00.000Z" }),
      session(),
    ];
    const before = allTotals(db);
    compact(db, 1, "2026-09-22T00:00:00Z");
    expect(allTotals(db)).toEqual(before);
    expect(db.ancient.sessions).toBe(1);
    expect(Object.keys(db.archiveMonths)).toHaveLength(1);
  });
  it("excludes abandoned active time from completed totals", () => {
    const db = freshSnapshot();
    db.sessions = [session({ status: "aborted", eligible: false, won: false })];
    expect(allTotals(db).activeMs).toBe(0);
  });
});
