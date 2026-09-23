"use client";

import {
  createContext,
  useContext,
  useEffect,
  type CSSProperties,
} from "react";
import { useTranslation } from "react-i18next";
import { Toaster, toast } from "sonner";
import {
  ArrowDownToLine,
  ArrowUpRight,
  Check,
  CircleAlert,
  Info,
  ListVideo,
  LoaderCircle,
  Settings2,
  Star,
  X,
} from "lucide-react";
import { Link } from "./router";
import { useApp } from "../storage/store";
import { type Locale } from "../i18n/languages";
import { type AchievementId } from "../domain/achievements";
import {
  AchievementEmblem,
  achievementArt,
} from "../features/achievements/Artwork";
import "../i18n";
import "../styles/notifications.css";

type Kind = "success" | "error" | "info" | "loading" | "achievement";
type IconName = "check" | "settings" | "download" | "favorite" | "routine";
type Options = {
  id?: string;
  description?: string;
  icon?: IconName;
  scope?: string;
  duration?: number;
  achievement?: AchievementId;
  onDismiss?: () => void;
};
const icons = {
  check: Check,
  settings: Settings2,
  download: ArrowDownToLine,
  favorite: Star,
  routine: ListVideo,
};
const ToastLocale = createContext<Locale>("en");
const delayed = new Map<string, ReturnType<typeof setTimeout>>();
const flashKey = "aimforge:toast-flash:v1";

function cancelDelayed(id?: string) {
  if (!id) return;
  clearTimeout(delayed.get(id));
  delayed.delete(id);
}

function ToastCard({
  id,
  kind,
  title,
  options,
}: {
  id: string | number;
  kind: Kind;
  title: string;
  options: Options;
}) {
  const language = useContext(ToastLocale);
  const { t } = useTranslation(undefined, { lng: language });
  const achievement = options.achievement;
  const Icon =
    kind === "loading"
      ? LoaderCircle
      : kind === "error"
        ? CircleAlert
        : kind === "info"
          ? Info
          : icons[options.icon ?? "check"];
  const close = () => {
    options.onDismiss?.();
    toast.dismiss(id);
  };
  const Tag = achievement ? "aside" : "div";
  return (
    <Tag
      className="aimforge-toast"
      data-kind={kind}
      data-achievement={achievement}
      role={achievement ? undefined : kind === "error" ? "alert" : "status"}
      aria-label={achievement ? t("achievements-celebration") : undefined}
      style={
        achievement
          ? ({
              "--toast-accent": achievementArt[achievement].color,
            } as CSSProperties)
          : undefined
      }
    >
      {achievement ? (
        <AchievementEmblem id={achievement} earned small />
      ) : (
        <span className="toast-symbol" aria-hidden="true">
          <Icon
            size={20}
            className={kind === "loading" ? "toast-spinner" : undefined}
          />
        </span>
      )}
      <div className="toast-copy">
        <div role={achievement ? "status" : undefined}>
          {achievement && (
            <span className="toast-eyebrow">
              {t("achievements-celebration")}
            </span>
          )}
          <strong>{t(title)}</strong>
          {options.description && <p>{t(options.description)}</p>}
        </div>
        {achievement && (
          <Link
            to="/achievements/"
            className="toast-link"
            onClick={() => {
              close();
              useApp.getState().dismissAchievementNotice();
            }}
          >
            {t("achievements-view-collection")}
            <ArrowUpRight size={13} />
          </Link>
        )}
      </div>
      {kind !== "loading" && (
        <button
          className="toast-close"
          type="button"
          aria-label={t("toast-dismiss")}
          onClick={close}
        >
          <X size={16} />
        </button>
      )}
    </Tag>
  );
}

function show(kind: Kind, title: string, options: Options = {}) {
  cancelDelayed(options.id);
  return toast.custom(
    (id) => <ToastCard id={id} kind={kind} title={title} options={options} />,
    {
      id: options.id,
      toasterId: options.scope,
      duration:
        options.duration ??
        (kind === "loading"
          ? Infinity
          : kind === "error"
            ? 7000
            : kind === "achievement"
              ? 8000
              : 4200),
      dismissible: kind !== "loading",
      onDismiss: options.onDismiss,
      onAutoClose: options.onDismiss,
    },
  );
}

/** Shared feedback for completed actions. Titles and descriptions are translation keys. */
export const notify = {
  success: (title: string, options?: Options) =>
    show("success", title, options),
  error: (title: string, options?: Options) => show("error", title, options),
  info: (title: string, options?: Options) => show("info", title, options),
  loading: (title: string, options?: Options) =>
    show("loading", title, options),
  dismiss: (id: string) => {
    cancelDelayed(id);
    toast.dismiss(id);
  },
  saved: (title: string, options: Options & { id: string }) => {
    cancelDelayed(options.id);
    delayed.set(
      options.id,
      setTimeout(() => show("success", title, options), 500),
    );
  },
  /** Carry one non-sensitive success message through a same-tab language change or reload. */
  afterNavigation: (
    title: string,
    path: string,
    options: Pick<Options, "id" | "icon"> = {},
  ) => {
    cancelDelayed(options.id);
    try {
      sessionStorage.setItem(
        flashKey,
        JSON.stringify({
          title,
          path: new URL(path, location.origin).pathname,
          options,
          expires: Date.now() + 15000,
        }),
      );
    } catch {
      /* Navigation and the successful save still work with session storage disabled. */
    }
  },
};

/** Use a scoped viewport inside a native dialog to keep its feedback in the top layer. */
export function ToastViewport({
  scope,
  locale,
}: {
  scope?: string;
  locale?: Locale;
}) {
  const language = useApp((state) => state.db.settings.language);
  const reducedMotion = useApp((state) => state.db.settings.reducedMotion);
  const { t } = useTranslation(undefined, { lng: locale ?? language });
  return (
    <ToastLocale.Provider value={locale ?? language}>
      <div data-motion={reducedMotion ? "reduced" : undefined}>
        <Toaster
          id={scope}
          theme="dark"
          position="bottom-right"
          className={"aimforge-toaster" + (scope ? " is-modal" : "")}
          visibleToasts={scope ? 1 : 3}
          gap={12}
          offset={24}
          mobileOffset={16}
          expand
          containerAriaLabel={t("toast-notifications")}
          toastOptions={{ unstyled: true }}
        />
      </div>
    </ToastLocale.Provider>
  );
}

export function AppToasts({ locale }: { locale?: Locale }) {
  const ready = useApp((state) => state.ready);
  const current = useApp((state) => state.achievementNotices[0]);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(flashKey);
      if (!raw) return;
      sessionStorage.removeItem(flashKey);
      const flash = JSON.parse(raw);
      if (
        typeof flash.title === "string" &&
        flash.title.length < 200 &&
        flash.expires > Date.now() &&
        flash.path === location.pathname
      ) {
        notify.success(flash.title, {
          id: "navigation-result",
          icon: Object.hasOwn(icons, flash.options?.icon ?? "")
            ? flash.options.icon
            : "check",
        });
      }
    } catch {
      /* Feedback is optional; malformed or unavailable session storage cannot block the app. */
    }
  }, []);
  useEffect(() => {
    if (!ready || !current) return;
    const id = `achievement-${current}`;
    show("achievement", `achievement-${current}`, {
      id,
      achievement: current,
      onDismiss: () => useApp.getState().dismissAchievementNotice(current),
    });
    return () => {
      toast.dismiss(id);
    };
  }, [current, ready]);
  return <ToastViewport locale={locale} />;
}
