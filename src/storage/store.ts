"use client";
import { create } from "zustand";
import {
  freshSnapshot,
  type Snapshot,
  type Session,
  type Settings,
} from "../domain/models";
import { repository, transact, patchSettings } from "./repository";
import { achievementCatalog, type AchievementId } from "../domain/achievements";
type Store = {
  db: Snapshot;
  ready: boolean;
  error: string | null;
  unsaved: Session | null;
  achievementNotices: AchievementId[];
  dismissAchievementNotice: (id?: AchievementId) => void;
  hydrate: () => void;
  refresh: () => void;
  save: (s: Session) => Promise<boolean>;
  settings: (s: Partial<Settings>) => Promise<boolean>;
  mutate: (fn: (d: Snapshot) => void) => Promise<void>;
  clearError: () => void;
};
export const useApp = create<Store>((set, get) => ({
  db: freshSnapshot(),
  ready: false,
  error: null,
  unsaved: null,
  achievementNotices: [],
  dismissAchievementNotice: (id) =>
    set((state) => ({
      achievementNotices: id
        ? state.achievementNotices.filter((item) => item !== id)
        : [],
    })),
  hydrate: () => {
    try {
      const db = repository().read();
      if (!repository().raw()) {
        const locale = navigator.languages
          .map((l) => l.split("-")[0])
          .find((l) => ["en", "es", "de", "ru", "uz"].includes(l)) as
          Settings["language"] | undefined;
        db.settings.language = locale ?? "en";
        db.settings.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        void transact(() =>
          repository().raw() ? repository().read() : repository().write(db, 0),
        )
          .then((saved) =>
            set((state) => ({
              db: saved,
              ready: true,
              achievementNotices: state.achievementNotices.filter((id) =>
                saved.achievements.includes(id),
              ),
            })),
          )
          .catch(() => set({ db, ready: true, error: "storageUnavailable" }));
        return;
      }
      set((state) => ({
        db,
        ready: true,
        achievementNotices: state.achievementNotices.filter((id) =>
          db.achievements.includes(id),
        ),
      }));
    } catch (e) {
      set({ ready: true, error: errorKey(e) });
    }
  },
  refresh: () => {
    try {
      const db = repository().read();
      set((state) => ({
        db,
        error: null,
        achievementNotices: state.achievementNotices.filter((id) =>
          db.achievements.includes(id),
        ),
      }));
    } catch (e) {
      set({ error: errorKey(e) });
    }
  },
  save: async (s) => {
    try {
      const { db, awarded } = await transact(() => {
        const before = new Set(repository().read().achievements);
        const db = repository().commit(s);
        return {
          db,
          awarded: achievementCatalog
            .filter(
              (item) =>
                db.achievements.includes(item.id) && !before.has(item.id),
            )
            .map((item) => item.id),
        };
      });
      // Keep actual save events across App route remounts. Hydration/imports do not enqueue awards.
      set((state) => ({
        db,
        unsaved: null,
        error: null,
        achievementNotices: [
          ...new Set([
            ...state.achievementNotices.filter((id) =>
              db.achievements.includes(id),
            ),
            ...awarded,
          ]),
        ].slice(0, 5),
      }));
      return true;
    } catch (e) {
      set({ unsaved: s, error: errorKey(e) });
      return false;
    }
  },
  settings: async (patch) => {
    try {
      const db = await patchSettings(patch);
      set({ db, error: null });
      return true;
    } catch (e) {
      set({ error: errorKey(e) });
      return false;
    }
  },
  mutate: async (fn) => {
    try {
      const db = await transact(() => repository().update(fn));
      set({ db, error: null });
    } catch (e) {
      set({ error: errorKey(e) });
    }
  },
  clearError: () => {
    if (!get().unsaved) set({ error: null });
  },
}));
function errorKey(e: unknown) {
  const code = (e as { code?: string }).code;
  return code === "corrupt"
    ? "storageCorrupt"
    : code === "version"
      ? "storageVersion"
      : code === "full"
        ? "storageFull"
        : code === "conflict"
          ? "storageConflict"
          : "storageUnavailable";
}
