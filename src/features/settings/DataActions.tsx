"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Archive,
  ArrowDownToLine,
  Check,
  ChevronRight,
  Database,
  FileJson,
  FileSpreadsheet,
  FolderOpen,
  History,
  LoaderCircle,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { freshSnapshot, type Snapshot } from "../../domain/models";
import { allTotals } from "../../domain/rules";
import {
  compact,
  parseBackup,
  repository,
  transact,
} from "../../storage/repository";
import { useApp } from "../../storage/store";
import { useRouteLocale } from "../../components/router";
import { num } from "../../i18n";
import { download, sessionsCSV } from "../sharing/share";
import "../../styles/data-actions.css";

const actions = {
  json: {
    title: "Export JSON backup",
    description: "data-jsonDescription",
    icon: FileJson,
  },
  csv: {
    title: "Export CSV",
    description: "data-csvDescription",
    icon: FileSpreadsheet,
  },
  import: {
    title: "Import backup",
    description: "data-importDescription",
    icon: Upload,
  },
  compact: {
    title: "Compact older details",
    description: "data-compactDescription",
    icon: Archive,
  },
  clear: {
    title: "Clear training history",
    description: "data-clearDescription",
    icon: Trash2,
  },
  reset: {
    title: "Reset all data",
    description: "data-resetDescription",
    icon: RotateCcw,
  },
  recovery: {
    title: "Export recovery data",
    description: "data-recoveryDescription",
    icon: History,
  },
} as const;
type Action = keyof typeof actions;
const isExport = (action: Action) =>
  ["json", "csv", "recovery"].includes(action);
const destructive = (action: Action) =>
  action === "clear" || action === "reset";

function errorKey(error: unknown) {
  const code = (error as { code?: string })?.code;
  return code === "full"
    ? "storageFull"
    : code === "conflict"
      ? "storageConflict"
      : code === "corrupt"
        ? "storageCorrupt"
        : code === "version"
          ? "storageVersion"
          : "data-actionFailed";
}

export default function DataActions({
  onReplaced,
  onMessage,
}: {
  onReplaced: () => void;
  onMessage: (message: string) => void;
}) {
  const { t } = useTranslation(),
    routeLocale = useRouteLocale();
  const [action, setAction] = useState<Action | null>(null);
  const [review, setReview] = useState<Snapshot | null>(null);
  const [imported, setImported] = useState<Snapshot | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const importButton = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);
  const busyRef = useRef(false);
  const backdropPressed = useRef(false);
  const headingId = useId(),
    descriptionId = useId();

  useEffect(() => {
    if (!action) return;
    const element = dialog.current;
    if (!element?.open) element?.showModal();
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = oldOverflow;
    };
  }, [action]);

  function close() {
    if (busyRef.current) return;
    dialog.current?.close();
    setAction(null);
    setImported(null);
    setError("");
    restoreFocus.current?.focus({ preventScroll: true });
  }

  function open(next: Action, trigger?: HTMLElement | null) {
    if (busyRef.current) return;
    restoreFocus.current = trigger ?? importButton.current;
    setError("");
    setImported(null);
    setFileName(
      next === "json"
        ? `aimforge-backup-${new Date().toISOString().slice(0, 10)}.json`
        : next === "csv"
          ? "aimforge-sessions.csv"
          : next === "recovery"
            ? "aimforge-recovery.json"
            : "",
    );
    setReview(null);
    if (next !== "recovery" && next !== "import") {
      try {
        setReview(repository().read());
      } catch (failure) {
        setError(errorKey(failure));
      }
    }
    onMessage("");
    setAction(next);
  }

  async function chooseFile(file?: File) {
    if (!file || busyRef.current) return;
    if (action !== "import") open("import");
    busyRef.current = true;
    setBusy(true);
    setError("");
    setImported(null);
    setFileName(file.name);
    try {
      if (file.size > 6 * 1024 * 1024) throw new Error("oversized");
      const validated = parseBackup(await file.text());
      setImported(validated);
    } catch {
      setError("Invalid or unsupported backup. Existing data was not changed.");
    } finally {
      busyRef.current = false;
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  async function execute() {
    if (!action || busyRef.current || (action === "import" && !imported))
      return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    let replacement: Snapshot | undefined;
    let success = "";
    try {
      if (action === "json") {
        // Read again at the point of export: another tab may have saved during review.
        const current = repository().read();
        download(
          new Blob([JSON.stringify(current, null, 2)], {
            type: "application/json",
          }),
          fileName,
        );
        success = "data-downloadStarted";
      } else if (action === "csv") {
        download(sessionsCSV(repository().read().sessions), fileName);
        success = "data-downloadStarted";
      } else if (action === "recovery") {
        const raw = repository().recovery() || repository().raw();
        if (!raw) {
          setError("data-noRecovery");
          return;
        }
        download(new Blob([raw], { type: "application/json" }), fileName);
        success = "data-downloadStarted";
      } else if (action === "import") {
        replacement = await transact(() => repository().replace(imported!));
        success = "Backup restored.";
      } else if (action === "compact") {
        await transact(() =>
          repository().update((current) => {
            compact(current, 100);
          }),
        );
        success = "data-compacted";
      } else if (action === "clear") {
        await transact(() =>
          repository().update((current) => {
            const { revision, settings, routines, favorites } = current;
            Object.assign(current, freshSnapshot(), {
              revision,
              settings,
              routines,
              favorites,
            });
          }, true),
        );
        success = "data-cleared";
      } else {
        replacement = await transact(() =>
          repository().replace(freshSnapshot()),
        );
        success = "data-reset";
      }
      if (!isExport(action)) {
        useApp.getState().refresh();
        if (replacement) onReplaced();
      }
    } catch (failure) {
      setError(
        action === "import"
          ? "Import failed. Existing data was preserved."
          : errorKey(failure),
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
    if (success) {
      close();
      onMessage(success);
      if (
        replacement &&
        routeLocale &&
        replacement.settings.language !== routeLocale
      )
        window.location.assign(`/${replacement.settings.language}/settings/`);
    }
  }

  const selected = action ? actions[action] : null;
  const Icon = selected?.icon ?? Database;
  const preview = action === "import" ? imported : review;
  const danger = action ? destructive(action) : false;
  const actionButton = (id: Action) => {
    const definition = actions[id],
      ButtonIcon = definition.icon;
    return (
      <button
        key={id}
        ref={id === "import" ? importButton : undefined}
        type="button"
        className={"button" + (destructive(id) ? " danger" : "")}
        data-data-action={id}
        onClick={(event) => open(id, event.currentTarget)}
      >
        <ButtonIcon size={16} aria-hidden="true" />
        {t(definition.title)}
      </button>
    );
  };

  return (
    <>
      <section className="panel data-panel data-management-panel">
        <div className="section-heading">
          <div>
            <h2>{t("Your data, in your hands.")}</h2>
            <p>{t("localPrivacy")}</p>
          </div>
          <ShieldCheck size={27} />
        </div>
        <div className="action-row">
          {(["json", "csv", "import", "compact"] as const).map(actionButton)}
        </div>
        <p className="subtle">{t("retentionSummary")}</p>
        <div className="action-row data-management-secondary">
          {(["clear", "reset", "recovery"] as const).map(actionButton)}
        </div>
      </section>
      <dialog
        ref={dialog}
        className={"data-action-dialog" + (danger ? " is-destructive" : "")}
        aria-labelledby={headingId}
        aria-describedby={descriptionId}
        aria-busy={busy}
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onPointerDown={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect();
          backdropPressed.current =
            event.target === event.currentTarget &&
            (event.clientX < bounds.left ||
              event.clientX > bounds.right ||
              event.clientY < bounds.top ||
              event.clientY > bounds.bottom);
        }}
        onClick={(event) => {
          if (backdropPressed.current && event.target === event.currentTarget)
            close();
          backdropPressed.current = false;
        }}
      >
        <input
          ref={input}
          className="sr-only"
          tabIndex={-1}
          type="file"
          accept="application/json,.json"
          aria-label={t("Import backup")}
          onChange={(event) => void chooseFile(event.target.files?.[0])}
        />
        <div className="data-modal-heading">
          <span className="data-modal-icon">
            <Icon size={25} strokeWidth={1.55} aria-hidden="true" />
          </span>
          <span className="eyebrow">{t("data-review")}</span>
          <button
            type="button"
            className="data-modal-close"
            aria-label={t("data-close")}
            disabled={busy}
            onClick={close}
          >
            <X size={19} />
          </button>
        </div>
        <div className="data-modal-body">
          <h2 id={headingId}>{selected ? t(selected.title) : ""}</h2>
          <p id={descriptionId} className="data-modal-description">
            {selected ? t(selected.description) : ""}
          </p>
          {action === "import" && (
            <div className={"data-file-picker" + (imported ? " has-file" : "")}>
              <span className="data-file-icon">
                {imported ? <Check size={24} /> : <FolderOpen size={25} />}
              </span>
              <div>
                <strong>
                  {imported ? t("data-validBackup") : t("data-fileHelp")}
                </strong>
                {fileName && <span className="data-file-name">{fileName}</span>}
              </div>
              <button
                className="button"
                type="button"
                disabled={busy}
                onClick={() => input.current?.click()}
              >
                <Upload size={15} />
                {t("data-chooseFile")}
              </button>
            </div>
          )}
          {preview && (
            <div className="data-profile-preview">
              <div className="data-profile-name">
                <span>
                  <Database size={15} />
                  {t("data-profile")}
                </span>
                <strong>
                  {preview.settings.nickname || t("data-localProfile")}
                </strong>
              </div>
              <dl className="data-summary-grid">
                <div>
                  <dt>{t("data-retained")}</dt>
                  <dd>{num(preview.sessions.length)}</dd>
                </div>
                <div>
                  <dt>{t("data-completed")}</dt>
                  <dd>{num(allTotals(preview).sessions)}</dd>
                </div>
                <div>
                  <dt>{t("Achievements")}</dt>
                  <dd>{num(preview.achievements.length)}</dd>
                </div>
                <div>
                  <dt>{t("Routines")}</dt>
                  <dd>{num(preview.routines.length)}</dd>
                </div>
              </dl>
            </div>
          )}
          {action && isExport(action) && (
            <dl className="data-export-format">
              <div>
                <dt>{t("data-format")}</dt>
                <dd>{action === "csv" ? "CSV" : "JSON"}</dd>
              </div>
              <div>
                <dt>{t("data-file")}</dt>
                <dd>{fileName}</dd>
              </div>
            </dl>
          )}
          {action === "import" && imported && (
            <div className="data-modal-note">
              <History size={18} />
              <p>{t("data-replaceNotice")}</p>
            </div>
          )}
          {action === "compact" && (
            <div className="data-modal-note">
              <Archive size={18} />
              <p>{t("data-detailNotice")}</p>
            </div>
          )}
          {danger && (
            <div className="data-modal-note">
              <History size={18} />
              <p>
                {t("A recovery snapshot of your current data will be kept.")}
              </p>
            </div>
          )}
          {error && (
            <p className="data-modal-error" role="alert">
              {t(error)}
            </p>
          )}
        </div>
        <div className="data-modal-actions">
          <button
            type="button"
            className="button"
            disabled={busy}
            onClick={close}
          >
            {t("Cancel")}
          </button>
          <button
            type="button"
            className={
              "button primary" + (danger ? " data-confirm-danger" : "")
            }
            disabled={busy || !action || (action === "import" && !imported)}
            onClick={() => void execute()}
          >
            {busy ? (
              <LoaderCircle size={16} className="spin" />
            ) : action && isExport(action) ? (
              <ArrowDownToLine size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
            {t(
              busy
                ? "data-working"
                : action && isExport(action)
                  ? "data-download"
                  : action === "import"
                    ? "Confirm replacement"
                    : (selected?.title ?? ""),
            )}
          </button>
        </div>
      </dialog>
    </>
  );
}
