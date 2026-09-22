import { useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { num } from "../../i18n";
export default function Calibration({ sensitivity }: { sensitivity: number }) {
  const { t } = useTranslation(),
    box = useRef<HTMLDivElement>(null),
    [counts, setCounts] = useState(0),
    [locked, setLocked] = useState(false),
    [error, setError] = useState(false);
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (document.pointerLockElement === box.current)
        setCounts((n) => n + e.movementX);
    };
    const change = () => setLocked(document.pointerLockElement === box.current);
    document.addEventListener("mousemove", move);
    document.addEventListener("pointerlockchange", change);
    return () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("pointerlockchange", change);
      if (document.pointerLockElement === box.current)
        document.exitPointerLock();
    };
  }, []);
  return (
    <div className="calibration" ref={box}>
      <p>{t("calibrationInstructions")}</p>
      <strong>{num(counts * sensitivity, 1)}°</strong>
      <div
        className="calibration-dial"
        style={{ transform: `rotate(${counts * sensitivity}deg)` }}
      >
        ↑
      </div>
      <button
        className="button"
        disabled={locked}
        onClick={() => {
          setCounts(0);
          setError(false);
          try {
            const p = box.current?.requestPointerLock();
            void p?.catch(() => setError(true));
          } catch {
            setError(true);
          }
        }}
      >
        {t(locked ? "Press Escape to release" : "Start calibration")}
      </button>
      {error && <p>{t("pointerDenied")}</p>}
    </div>
  );
}
