import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Crosshair, ChevronRight, ArrowUpRight } from "lucide-react";
import { Link } from "./router";
import type { Config, Session, Settings } from "../domain/models";
import {
  isReaction,
  isTracking,
  median,
  ratio,
  winGoal,
} from "../domain/rules";
import { num, duration, dateLabel } from "../i18n";
export function Heading({
  title,
  description,
  eyebrow,
  action,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading heading-row">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function Empty({
  title,
  description,
  to,
  label,
}: {
  title: string;
  description?: string;
  to?: string;
  label?: string;
}) {
  return (
    <div className="empty panel">
      <Crosshair size={32} />
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {to && (
        <Link className="button primary" to={to}>
          {label}
          <ChevronRight size={16} />
        </Link>
      )}
    </div>
  );
}
export function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: ReactNode;
  note?: string;
}) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </div>
  );
}
export function Badge({
  children,
  color = "",
}: {
  children: ReactNode;
  color?: string;
}) {
  return <span className={"badge " + color}>{children}</span>;
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function Goal({ config }: { config: Config }) {
  const { t } = useTranslation(),
    g = winGoal(config);
  return (
    <>
      {g.metric === "tracking"
        ? t("goalTracking", { percent: g.value })
        : g.metric === "reaction"
          ? t("goalReaction", { ms: g.value, trials: g.min })
          : t("goalClicks", { hits: g.value, accuracy: g.min })}
    </>
  );
}
export function CrosshairPreview({ value }: { value: Settings["crosshair"] }) {
  const { shape, size, thickness, gap, color, opacity, outline } = value;
  return (
    <svg
      className="crosshair"
      aria-hidden="true"
      width="100"
      height="100"
      viewBox="-50 -50 100 100"
      style={{
        color,
        opacity,
        filter: outline
          ? "drop-shadow(0 1px 1px #000) drop-shadow(1px 0 1px #000)"
          : undefined,
      }}
    >
      {shape === "dot" ? (
        <circle r={thickness + 1} fill="currentColor" />
      ) : shape === "circle" ? (
        <circle
          r={size}
          fill="none"
          stroke="currentColor"
          strokeWidth={thickness}
        />
      ) : (
        <g stroke="currentColor" strokeWidth={thickness}>
          <path
            d={`M ${-gap - size} 0 H ${-gap} M ${gap} 0 H ${gap + size} M 0 ${-gap - size} V ${-gap} M 0 ${gap} V ${gap + size}`}
          />
        </g>
      )}
    </svg>
  );
}
export function SessionTable({ sessions }: { sessions: Session[] }) {
  const { t } = useTranslation();
  return (
    <div className="table-scroll">
      <table>
        <caption className="sr-only">{t("Session history")}</caption>
        <thead>
          <tr>
            <th>{t("Scenario")}</th>
            <th>{t("Date")}</th>
            <th>{t("Score")}</th>
            <th>{t("Performance")}</th>
            <th>{t("Training time")}</th>
            <th>{t("Run type")}</th>
          </tr>
        </thead>
        <tbody>
          {[...sessions].reverse().map((s) => (
            <tr key={s.id}>
              <td>
                <Link className="table-link" to={"/results/?id=" + s.id}>
                  {t(s.config.scenario)}
                  <ArrowUpRight size={14} />
                </Link>
                <small>
                  {t(s.config.difficulty)} · {t(s.config.input)}
                </small>
              </td>
              <td>{dateLabel(s.date)}</td>
              <td>{num(s.score)}</td>
              <td>
                {isTracking(s.config.scenario)
                  ? num(ratio(s.metrics.onTargetMs, s.metrics.exposureMs), 1) +
                    "%"
                  : isReaction(s.config.scenario)
                    ? num(median(s.metrics.reaction)) + " " + t("ms")
                    : num(ratio(s.metrics.hits, s.metrics.shots), 1) + "%"}
              </td>
              <td>{duration(s.activeMs)}</td>
              <td>
                <Badge color={s.eligible ? "green" : ""}>
                  {t(s.status === "aborted" ? "aborted" : s.config.kind)}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
