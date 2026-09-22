"use client";
import { create } from "zustand";
import {
  freshSnapshot,
  type Snapshot,
  type Session,
  type Settings,
} from "../domain/models";
import { repository, transact, patchSettings } from "./repository";
type Store = {
  db: Snapshot;
  ready: boolean;
  error: string | null;
  unsaved: Session | null;
  hydrate: () => void;
  refresh: () => void;
  save: (s: Session) => Promise<boolean>;
  settings: (s: Partial<Settings>) => Promise<void>;
  mutate: (fn: (d: Snapshot) => void) => Promise<void>;
  clearError: () => void;
};
export const useApp = create<Store>((set, get) => ({
  db: freshSnapshot(),
  ready: false,
  error: null,
  unsaved: null,
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
          .then((saved) => set({ db: saved, ready: true }))
          .catch(() => set({ db, ready: true, error: "storageUnavailable" }));
        return;
      }
      set({ db, ready: true });
    } catch (e) {
      set({ ready: true, error: errorKey(e) });
    }
  },
  refresh: () => {
    try {
      set({ db: repository().read(), error: null });
    } catch (e) {
      set({ error: errorKey(e) });
    }
  },
  save: async (s) => {
    try {
      const db = await transact(() => repository().commit(s));
      set({ db, unsaved: null, error: null });
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
    } catch (e) {
      set({ error: errorKey(e) });
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
