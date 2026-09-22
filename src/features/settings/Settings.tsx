import { Select } from "../../components/controls";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Download,
  Upload,
  ShieldCheck,
  WifiOff,
  Save,
  Check,
  LoaderCircle,
  UserRound,
  MousePointer2,
  Crosshair,
  SlidersHorizontal,
} from "lucide-react";
import { useApp } from "../../storage/store";
import {
  type Settings as SettingsType,
  type Snapshot,
  settingsSchema,
  freshSnapshot,
} from "../../domain/models";
import {
  repository,
  transact,
  parseBackup,
  compact,
} from "../../storage/repository";
import { Heading, Field, CrosshairPreview } from "../../components/ui";
import { download, sessionsCSV } from "../sharing/share";
import { prepareOffline, offlineStatus } from "./offline";
import Calibration from "./Calibration";
import { num, decimal } from "../../i18n";
export default function Settings() {
  const { t } = useTranslation(),
    { db, settings, refresh, mutate } = useApp(),
    [overrides, setOverrides] = useState<Partial<SettingsType>>({}),
    [saving, setSaving] = useState(false),
    [message, setMessage] = useState(""),
    [imported, setImported] = useState<Snapshot | null>(null),
    [offline, setOffline] = useState(false),
    [busy, setBusy] = useState(false),
    [update, setUpdate] = useState<ServiceWorkerRegistration | null>(null),
    input = useRef<HTMLInputElement>(null),
    writeSequence = useRef(0);
  const draft = { ...db.settings, ...overrides };
  const validation = settingsSchema.safeParse(draft);
  const dirty = JSON.stringify(draft) !== JSON.stringify(db.settings);
  useEffect(() => {
    void offlineStatus().then(setOffline);
    void navigator.serviceWorker?.getRegistration().then((r) => {
      if (r?.waiting) setUpdate(r);
    });
  }, []);
  async function persist(p: Partial<SettingsType>) {
    const sequence = ++writeSequence.current;
    setSaving(true);
    const saved = await settings(p);
    if (saved)
      setOverrides((current) => {
        const next = { ...current };
        for (const key of Object.keys(p) as (keyof SettingsType)[])
          if (JSON.stringify(next[key]) === JSON.stringify(p[key]))
            delete next[key];
        return next;
      });
    if (sequence === writeSequence.current) {
      setSaving(false);
      setMessage(
        saved ? "" : (useApp.getState().error ?? "storageUnavailable"),
      );
    }
    return saved;
  }
  const patch = (p: Partial<SettingsType>) => {
    setOverrides((current) => ({ ...current, ...p }));
    // Save valid fields immediately. An unfinished timezone or number must not
    // discard other changes or replace the last valid value in storage.
    if (
      settingsSchema.safeParse({ ...useApp.getState().db.settings, ...p })
        .success
    )
      void persist(p);
  };
  const check = (key: keyof SettingsType, label: string) => (
    <label className="check">
      <input
        type="checkbox"
        checked={Boolean(draft[key])}
        onChange={(e) => patch({ [key]: e.target.checked })}
      />
      {t(label)}
    </label>
  );
  function backup() {
    download(
      new Blob([JSON.stringify(db, null, 2)], { type: "application/json" }),
      "aimforge-backup-" + new Date().toISOString().slice(0, 10) + ".json",
    );
  }
  async function save() {
    const parsed = settingsSchema.safeParse(draft);
    if (!parsed.success) {
      setMessage("Check the settings values and timezone.");
      return;
    }
    if (await persist(overrides)) setMessage("Settings saved.");
  }
  return (
    <>
      <Heading
        eyebrow={t("settings-eyebrow")}
        title={t("Settings")}
        description={t("Make this space your own.")}
        action={
          <span
            className={
              "settings-save-state " + (saving || dirty ? "pending" : "")
            }
            role="status"
          >
            {saving ? (
              <LoaderCircle size={15} className="spin" />
            ) : (
              <Check size={15} />
            )}
            {t(
              saving
                ? "settings-saving"
                : dirty
                  ? "settings-unsaved"
                  : "settings-saved",
            )}
          </span>
        }
      />
      {message && (
        <div className="notice" role="status">
          {t(message)}
        </div>
      )}
      <div className="settings-intro">
        <ShieldCheck size={16} />
        <span>{t("settings-autosave")}</span>
      </div>
      {!validation.success && (
        <p className="notice error-text" role="alert">
          {t("Check the settings values and timezone.")}
        </p>
      )}
      <div className="settings-grid">
        <section className="panel">
          <div className="settings-section-heading">
            <span>
              <UserRound size={20} />
            </span>
            <div>
              <h2>{t("Profile & language")}</h2>
              <p>{t("settings-profileDescription")}</p>
            </div>
          </div>
          <Field label={t("Nickname (optional)")}>
            <input
              maxLength={30}
              value={draft.nickname}
              onChange={(e) => patch({ nickname: e.target.value })}
            />
          </Field>
          <Field label={t("Language")}>
            <Select
              value={draft.language}
              onChange={(e) => {
                const language = e.target.value as SettingsType["language"];
                patch({ language });
              }}
            >
              {[
                ["en", "English"],
                ["es", "Español"],
                ["de", "Deutsch"],
                ["ru", "Русский"],
                ["uz", "O‘zbekcha"],
              ].map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label={t("Training timezone")}
            hint={t("Timezone changes apply to future sessions only.")}
          >
            <input
              value={draft.timezone}
              onChange={(e) => patch({ timezone: e.target.value })}
            />
          </Field>
          <Field
            label={t("Daily goal (seconds)")}
            hint={t("A day’s goal is frozen when training starts.")}
          >
            <input
              type="number"
              min={60}
              max={3600}
              value={draft.dailyGoal}
              onChange={(e) => patch({ dailyGoal: Number(e.target.value) })}
            />
          </Field>
          <Field label={t("Weekly goal (minutes)")}>
            <input
              type="number"
              min={5}
              max={600}
              value={decimal(draft.weeklyGoal / 60)}
              onChange={(e) =>
                patch({ weeklyGoal: Math.round(Number(e.target.value) * 60) })
              }
            />
          </Field>
        </section>
        <section className="panel">
          <div className="settings-section-heading">
            <span>
              <MousePointer2 size={20} />
            </span>
            <div>
              <h2>{t("Input & camera")}</h2>
              <p>{t("settings-inputDescription")}</p>
            </div>
          </div>
          <Field label={t("Preferred input")}>
            <Select
              value={draft.input}
              onChange={(e) =>
                patch({ input: e.target.value as SettingsType["input"] })
              }
            >
              <option value="mouse">{t("mouse")}</option>
              <option value="touch">{t("touch")}</option>
            </Select>
          </Field>
          <Field label={t("Sensitivity")} hint={t("Degrees per mouse count")}>
            <input
              type="number"
              min={0.005}
              max={0.5}
              step={0.005}
              value={decimal(draft.sensitivity)}
              onChange={(e) =>
                patch({ sensitivity: decimal(Number(e.target.value)) })
              }
            />
          </Field>
          <Field
            label={t("DPI note (optional)")}
            hint={t(
              "DPI is not detected. No game-matching conversion is assumed.",
            )}
          >
            <input
              type="number"
              min={100}
              max={32000}
              value={draft.dpi ?? ""}
              onChange={(e) =>
                patch({ dpi: e.target.value ? Number(e.target.value) : null })
              }
            />
          </Field>
          <Field label={t("Vertical field of view")}>
            <input
              type="range"
              min={45}
              max={110}
              value={draft.fov}
              onChange={(e) => patch({ fov: Number(e.target.value) })}
            />
            <output>{num(draft.fov, 3)}°</output>
          </Field>
          {check("smoothing", "Optional mouse smoothing")}
          {check("unadjusted", "Request unadjusted movement when supported")}
          <details>
            <summary>{t("Manual calibration")}</summary>
            <Calibration sensitivity={draft.sensitivity} />
          </details>
        </section>
        <section className="panel">
          <div className="settings-section-heading">
            <span>
              <Crosshair size={20} />
            </span>
            <div>
              <h2>{t("Crosshair")}</h2>
              <p>{t("settings-crosshairDescription")}</p>
            </div>
          </div>
          <div className="crosshair-preview">
            <CrosshairPreview value={draft.crosshair} />
          </div>
          <Field label={t("Shape")}>
            <Select
              value={draft.crosshair.shape}
              onChange={(e) =>
                patch({
                  crosshair: {
                    ...draft.crosshair,
                    shape: e.target.value as SettingsType["crosshair"]["shape"],
                  },
                })
              }
            >
              {["cross", "dot", "circle"].map((s) => (
                <option key={s} value={s}>
                  {t(s)}
                </option>
              ))}
            </Select>
          </Field>
          {(["size", "thickness", "gap", "opacity"] as const).map((k) => (
            <Field key={k} label={t(k === "gap" ? "settings-crosshairGap" : k)}>
              <input
                type="range"
                min={
                  k === "opacity"
                    ? 0.2
                    : k === "gap"
                      ? 0
                      : k === "thickness"
                        ? 1
                        : 2
                }
                max={
                  k === "size"
                    ? 30
                    : k === "gap"
                      ? 15
                      : k === "thickness"
                        ? 6
                        : 1
                }
                step={k === "opacity" ? 0.1 : 1}
                value={draft.crosshair[k]}
                onChange={(e) =>
                  patch({
                    crosshair: {
                      ...draft.crosshair,
                      [k]: Number(e.target.value),
                    },
                  })
                }
              />
              <output>{num(draft.crosshair[k], 3)}</output>
            </Field>
          ))}
          <Field label={t("Color")}>
            <input
              type="color"
              value={draft.crosshair.color}
              onChange={(e) =>
                patch({
                  crosshair: { ...draft.crosshair, color: e.target.value },
                })
              }
            />
          </Field>
          <label className="check">
            <input
              type="checkbox"
              checked={draft.crosshair.outline}
              onChange={(e) =>
                patch({
                  crosshair: { ...draft.crosshair, outline: e.target.checked },
                })
              }
            />
            {t("Outline")}
          </label>
        </section>
        <section className="panel">
          <div className="settings-section-heading">
            <span>
              <SlidersHorizontal size={20} />
            </span>
            <div>
              <h2>{t("Appearance & audio")}</h2>
              <p>{t("settings-appearanceDescription")}</p>
            </div>
          </div>
          <Field label={t("Target palette")}>
            <Select
              value={draft.palette}
              onChange={(e) =>
                patch({ palette: e.target.value as SettingsType["palette"] })
              }
            >
              {["violet", "cyan", "amber"].map((p) => (
                <option key={p} value={p}>
                  {t(p)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("Render quality")}>
            <Select
              value={draft.quality}
              onChange={(e) =>
                patch({ quality: e.target.value as SettingsType["quality"] })
              }
            >
              {["low", "medium", "high"].map((p) => (
                <option key={p} value={p}>
                  {t(p)}
                </option>
              ))}
            </Select>
          </Field>
          {(["master", "hitVolume", "missVolume"] as const).map((k) => (
            <Field key={k} label={t(k)}>
              <input
                type="range"
                min="0"
                max="1"
                step=".05"
                value={draft[k]}
                onChange={(e) => patch({ [k]: Number(e.target.value) })}
              />
              <output>{Math.round(draft[k] * 100)}%</output>
            </Field>
          ))}
          {check("performance", "Show measured FPS / frame time")}
          {check("reducedMotion", "Reduce interface motion")}
          {check("breakReminder", "Break reminders between rounds")}
        </section>
      </div>
      <section className="panel data-panel">
        <div className="section-heading">
          <div>
            <h2>{t("Your data, in your hands.")}</h2>
            <p>{t("localPrivacy")}</p>
          </div>
          <ShieldCheck size={27} />
        </div>
        <div className="action-row">
          <button className="button" onClick={backup}>
            <Download size={16} />
            {t("Export JSON backup")}
          </button>
          <button
            className="button"
            onClick={() =>
              download(sessionsCSV(db.sessions), "aimforge-sessions.csv")
            }
          >
            <Download size={16} />
            {t("Export CSV")}
          </button>
          <button className="button" onClick={() => input.current?.click()}>
            <Upload size={16} />
            {t("Import backup")}
          </button>
          <button
            className="button"
            onClick={() =>
              void mutate((d) => {
                compact(d, 100);
              })
            }
          >
            {t("Compact older details")}
          </button>
        </div>
        <input
          className="sr-only"
          ref={input}
          type="file"
          accept="application/json,.json"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              if (file.size > 6 * 1024 * 1024) throw new Error();
              setImported(parseBackup(await file.text()));
              setMessage("");
            } catch {
              setMessage(
                "Invalid or unsupported backup. Existing data was not changed.",
              );
            }
            e.target.value = "";
          }}
        />
        <p className="subtle">{t("retentionSummary")}</p>
        {imported && (
          <div className="import-preview">
            <h3>{t("Import preview")}</h3>
            <p>
              {t(
                "{{count}} retained sessions. This will replace current data.",
                { count: imported.sessions.length },
              )}
            </p>
            <p>{t("A recovery snapshot of your current data will be kept.")}</p>
            <div className="action-row">
              <button className="button" onClick={backup}>
                {t("Export current data first")}
              </button>
              <button
                className="button primary"
                onClick={async () => {
                  if (!confirm(t("Replace all current data with this backup?")))
                    return;
                  try {
                    await transact(() => repository().replace(imported));
                    refresh();
                    setOverrides({});
                    setImported(null);
                    setMessage("Backup restored.");
                  } catch {
                    setMessage("Import failed. Existing data was preserved.");
                  }
                }}
              >
                {t("Confirm replacement")}
              </button>
              <button className="button" onClick={() => setImported(null)}>
                {t("Cancel")}
              </button>
            </div>
          </div>
        )}
        <div className="action-row">
          <button
            className="button danger"
            onClick={() => {
              if (
                confirm(t("Clear all training history? Export a backup first."))
              )
                void transact(() =>
                  repository().update((d) => {
                    const fresh = freshSnapshot();
                    Object.assign(d, {
                      ...fresh,
                      revision: d.revision,
                      settings: d.settings,
                      routines: d.routines,
                      favorites: d.favorites,
                    });
                  }, true),
                )
                  .then(refresh)
                  .catch(() => setMessage("storageUnavailable"));
            }}
          >
            {t("Clear training history")}
          </button>
          <button
            className="button danger"
            onClick={() => {
              if (confirm(t("Reset all local data, including settings?")))
                void transact(() => repository().replace(freshSnapshot()))
                  .then(() => {
                    refresh();
                    setOverrides({});
                  })
                  .catch(() => setMessage("storageUnavailable"));
            }}
          >
            {t("Reset all data")}
          </button>
          <button
            className="button"
            onClick={() => {
              const raw = repository().recovery() || repository().raw();
              download(
                new Blob([raw], { type: "application/json" }),
                "aimforge-recovery.json",
              );
            }}
          >
            {t("Export recovery data")}
          </button>
        </div>
      </section>
      <section className="panel data-panel">
        <div className="section-heading">
          <div>
            <h2>{t("Take your training offline.")}</h2>
            <p>
              {t(
                offline
                  ? "Both engines are available offline."
                  : "Offline resources have not been prepared.",
              )}
            </p>
          </div>
          <WifiOff size={24} />
        </div>
        <p className="subtle">{t("offlineExplanation")}</p>
        <button
          className="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await prepareOffline();
              setOffline(true);
              setMessage("Offline preparation complete.");
            } catch {
              setMessage("offlineFailed");
            } finally {
              setBusy(false);
            }
          }}
        >
          {t(busy ? "Preparing…" : "Prepare both engines offline")}
        </button>
        {update && (
          <button
            className="button primary"
            onClick={() => {
              navigator.serviceWorker.addEventListener(
                "controllerchange",
                () => location.reload(),
                { once: true },
              );
              update.waiting?.postMessage({ type: "ACTIVATE" });
            }}
          >
            {t("Install update and reload")}
          </button>
        )}
      </section>
      <div className="settings-save-bar">
        <div>
          <strong>{t(dirty ? "settings-unsaved" : "settings-saved")}</strong>
          <p>{t("settings-autosave")}</p>
        </div>
        <button
          className="button primary"
          disabled={saving}
          onClick={() => void save()}
        >
          <Save size={16} />
          {t("Save settings")}
        </button>
      </div>
    </>
  );
}
