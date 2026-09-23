"use client";

import { useLayoutEffect } from "react";
import { useApp } from "../storage/store";
import { STORAGE_KEY } from "../storage/repository";

/** Apply the saved preference before enabling motion, including on public pages. */
export function MotionPreferences() {
  const ready = useApp((state) => state.ready);
  const reducedMotion = useApp((state) => state.db.settings.reducedMotion);
  useLayoutEffect(() => {
    let reduced = reducedMotion;
    if (!ready) {
      try {
        reduced =
          JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null")?.settings
            ?.reducedMotion === true;
      } catch {
        // An unreadable profile must not prevent the page from appearing.
      }
    }
    document.documentElement.dataset.motion = reduced ? "reduced" : "normal";
  }, [ready, reducedMotion]);
  return null;
}
