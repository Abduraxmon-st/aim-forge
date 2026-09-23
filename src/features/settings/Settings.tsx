import { Select } from "../../components/controls";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
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
  settingsSchema,
} from "../../domain/models";
import { Heading, Field, CrosshairPreview } from "../../components/ui";
import { prepareOffline, offlineStatus } from "./offline";
import Calibration from "./Calibration";
import DataActions from "./DataActions";
import { num, decimal } from "../../i18n";
import { useRouteLocale } from "../../components/router";
import { splitLocalizedPath } from "../../i18n/languages";
import { notify } from "../../components/notifications";
export default function Settings() {
  const routeLocale = useRouteLocale();
  const { t } = useTranslation(),
    { db, settings } = useApp(),
    [overrides, setOverrides] = useState<Partial<SettingsType>>({}),
    [saving, setSaving] = useState(false),
    [offline, setOffline] = useState(false),
    [busy, setBusy] = useState(false),
    [update, setUpdate] = useState<ServiceWorkerRegistration | null>(null),
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
  async function persist(
    p: Partial<SettingsType>,
    redirect?: string,
    immediate = false,
  ) {
    const sequence = ++writeSequence.current;
    const completeDraftValid = settingsSchema.safeParse({
      ...useApp.getState().db.settings,
      ...overrides,
      ...p,
    }).success;
    setSaving(true);
    notify.loading("settings-saving", {
      id: "settings-save",
      icon: "settings",
    });
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
      const options = {
        id: "settings-save",
        icon: "settings" as const,
        description: "toast-localSaved",
      };
      if (!saved)
        notify.error(useApp.getState().error ?? "storageUnavailable", {
          id: "settings-save",
        });
      else if (redirect)
        notify.afterNavigation("Settings saved.", redirect, options);
      else if (!completeDraftValid)
        notify.info("settings-unsaved", {
          id: "settings-save",
          description: "Check the settings values and timezone.",
        });
      else if (immediate) notify.success("Settings saved.", options);
      else notify.saved("Settings saved.", options);
    }
    return saved;
  }
  const patch = (p: Partial<SettingsType>) => {
    ++writeSequence.current;
    setOverrides((current) => ({ ...current, ...p }));
    // Save valid fields immediately. An unfinished timezone or number must not
    // discard other changes or replace the last valid value in storage.
    if (
      settingsSchema.safeParse({ ...useApp.getState().db.settings, ...p })
        .success
    )
      void persist(p);
    else {
      notify.dismiss("settings-save");
      setSaving(false);
    }
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
  async function save() {
    const parsed = settingsSchema.safeParse(draft);
    if (!parsed.success) {
      notify.error("Check the settings values and timezone.", {
        id: "settings-save",
      });
      return;
    }
    await persist(overrides, undefined, true);
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
              onChange={async (e) => {
                const language = e.target.value as SettingsType["language"];
                if (routeLocale && language !== routeLocale) {
                  setOverrides((current) => ({ ...current, language }));
                  const path = splitLocalizedPath(
                    window.location.pathname,
                  ).path;
                  const href = `/${language}${path === "/" ? "/" : path + "/"}${window.location.search}`;
                  if (await persist({ language }, href))
                    window.location.assign(href);
                  return;
                }
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
      <DataActions onReplaced={() => setOverrides({})} />
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
            notify.loading("Preparing…", { id: "offline-preparation" });
            try {
              await prepareOffline();
              setOffline(true);
              notify.success("Offline preparation complete.", {
                id: "offline-preparation",
                icon: "download",
              });
            } catch {
              notify.error("offlineFailed", { id: "offline-preparation" });
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
              if (!update.waiting) return;
              notify.loading("Preparing…", { id: "app-update" });
              navigator.serviceWorker.addEventListener(
                "controllerchange",
                () => {
                  notify.afterNavigation(
                    "toast-updateInstalled",
                    location.pathname,
                  );
                  location.reload();
                },
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
          aria-disabled={saving}
          onClick={() => {
            if (!saving) void save();
          }}
        >
          <Save size={16} />
          {t("Save settings")}
        </button>
      </div>
    </>
  );
}
