import {
  configSchema,
  type Config,
  type Session,
  type Settings,
} from "../../domain/models";
import {
  dimension,
  isTracking,
  isReaction,
  ratio,
  median,
} from "../../domain/rules";
import i18n, { num } from "../../i18n";
export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function challengeLink(c: Config) {
  const payload = btoa(
    JSON.stringify({
      v: 1,
      config: { ...c, kind: "practice", challengeId: undefined },
    }),
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return location.origin + "/setup/" + c.scenario + "/?challenge=" + payload;
}
export function decodeChallenge(text: string, settings: Settings): Config {
  if (text.length > 2400 || !/^[\w-]+$/.test(text))
    throw new Error("Invalid challenge link.");
  const raw = JSON.parse(atob(text.replace(/-/g, "+").replace(/_/g, "/"))) as {
    v: unknown;
    config: unknown;
  };
  if (raw.v !== 1) throw new Error("Invalid challenge link.");
  const c = configSchema.parse(raw.config);
  return {
    ...c,
    kind: "practice",
    input: dimension(c.scenario) === "3d" ? "mouse" : settings.input,
    sensitivity: settings.sensitivity,
    challengeId: undefined,
  };
}
export function resultText(s: Session, nickname = "") {
  const t = i18n.t.bind(i18n),
    value = isTracking(s.config.scenario)
      ? `${num(ratio(s.metrics.onTargetMs, s.metrics.exposureMs), 1)}% ${t("Tracking")}`
      : isReaction(s.config.scenario)
        ? `${num(median(s.metrics.reaction))} ${t("ms")} ${t("Median reaction")}`
        : `${num(ratio(s.metrics.hits, s.metrics.shots), 1)}% ${t("Accuracy")}`;
  return [
    "AimForge",
    nickname,
    t(s.config.scenario) + " · " + t(s.config.difficulty),
    `${t("Score")}: ${num(s.score)} · ${value}`,
    s.config.challengeId,
    t("All results are local and unverified."),
  ]
    .filter(Boolean)
    .join("\n");
}
export async function resultImage(s: Session, nickname = "") {
  const c = document.createElement("canvas");
  c.width = 1200;
  c.height = 630;
  const x = c.getContext("2d")!;
  x.fillStyle = "#14151c";
  x.fillRect(0, 0, 1200, 630);
  x.fillStyle = "#a995f2";
  x.fillRect(54, 50, 5, 530);
  x.fillStyle = "#eeeaf7";
  x.font = "bold 32px system-ui";
  x.fillText("AimForge", 90, 100);
  x.fillStyle = "#a995f2";
  x.font = "bold 48px system-ui";
  x.fillText(i18n.t(s.config.scenario), 90, 190);
  x.fillStyle = "#f5f2fc";
  x.font = "bold 112px system-ui";
  x.fillText(num(s.score), 90, 340);
  x.fillStyle = "#a5a2b6";
  x.font = "26px system-ui";
  const lines = resultText(s, nickname).split("\n").slice(1);
  let y = 400;
  for (const line of lines) {
    x.fillText(line, 90, y, 1030);
    y += 36;
  }
  return new Promise<Blob>((resolve, reject) =>
    c.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Export failed."))),
      "image/png",
    ),
  );
}
export function sessionsCSV(sessions: Session[]) {
  const header = [
    "started_utc",
    "training_date",
    "timezone",
    "scenario",
    "difficulty",
    "input",
    "kind",
    "status",
    "eligible",
    "active_seconds",
    "score",
    "hits",
    "shots",
    "misses",
    "exposure_ms",
    "on_target_ms",
    "median_reaction_ms",
    "median_acquisition_ms",
  ];
  const q = (s: unknown) => '"' + String(s ?? "").replace(/"/g, '""') + '"';
  const rows = sessions.map((s) =>
    [
      s.startedAt,
      s.date,
      s.timezone,
      s.config.scenario,
      s.config.difficulty,
      s.config.input,
      s.config.kind,
      s.status,
      s.eligible,
      s.activeMs / 1000,
      s.score,
      s.metrics.hits,
      s.metrics.shots,
      s.metrics.misses,
      s.metrics.exposureMs,
      s.metrics.onTargetMs,
      median(s.metrics.reaction),
      median(s.metrics.acquisition),
    ]
      .map(q)
      .join(","),
  );
  return new Blob(["\uFEFF" + [header.join(","), ...rows].join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });
}
