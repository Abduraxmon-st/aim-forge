import { Select, DatePicker, RadioGroup } from "../../components/controls";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useApp } from "../../storage/store";
import {
  addDays,
  dateInZone,
  ratio,
  median,
  addTotals,
  isTracking,
  isReaction,
} from "../../domain/rules";
import { emptyTotals } from "../../domain/models";
import { Heading, Stat, Empty, SessionTable } from "../../components/ui";
import { num, duration } from "../../i18n";
import { ChartTooltip, chartColors } from "../../components/charts";
export default function Dashboard() {
  const { t } = useTranslation(),
    { db } = useApp(),
    [range, setRange] = useState("week"),
    [input, setInput] = useState("mouse"),
    [key, setKey] = useState(""),
    [metric, setMetric] = useState("score"),
    [from, setFrom] = useState(""),
    [to, setTo] = useState("");
  const today = dateInZone(new Date().toISOString(), db.settings.timezone),
    start =
      range === "day"
        ? today
        : range === "week"
          ? addDays(today, -6)
          : range === "month"
            ? today.slice(0, 7) + "-01"
            : range === "year"
              ? today.slice(0, 4) + "-01-01"
              : from || addDays(today, -30),
    end = range === "custom" ? to || today : today;
  const dates = Object.entries(db.daily).filter(
      ([k]) =>
        k.endsWith(input) && k.slice(0, 10) >= start && k.slice(0, 10) <= end,
    ),
    totals = dates.reduce((a, [, b]) => addTotals(a, b), emptyTotals()),
    sessions = db.sessions.filter(
      (s) =>
        s.config.input === input &&
        s.date >= start &&
        s.date <= end &&
        s.status === "finished",
    ),
    keys = [
      ...new Set(
        sessions.filter((s) => s.eligible).map((s) => s.comparisonKey),
      ),
    ],
    selected = keys.includes(key) ? key : keys[0],
    comparable = sessions.filter(
      (s) => s.comparisonKey === selected && s.eligible,
    ),
    series = comparable.map((s, i) => ({
      run: i + 1,
      value:
        metric === "score"
          ? s.score
          : metric === "accuracy"
            ? isTracking(s.config.scenario)
              ? ratio(s.metrics.onTargetMs, s.metrics.exposureMs)
              : isReaction(s.config.scenario)
                ? null
                : ratio(s.metrics.hits, s.metrics.shots)
            : median(
                isReaction(s.config.scenario)
                  ? s.metrics.reaction
                  : s.metrics.acquisition,
              ),
    })),
    unit =
      metric === "score" ? t("points") : metric === "accuracy" ? "%" : t("ms");
  const bars = dates
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([d, v]) => ({ date: d.slice(5, 10), minutes: v.activeMs / 60000 }));
  const dist = Object.entries(
    sessions.reduce<Record<string, number>>((r, s) => {
      r[s.config.scenario] = (r[s.config.scenario] ?? 0) + s.activeMs / 60000;
      return r;
    }, {}),
  ).map(([id, value]) => ({ name: t(id), value }));
  return (
    <>
      <Heading
        title={t("My progress")}
        eyebrow={t("MEASURE WHAT MATTERS")}
        description={t("Real practice. Measurable progress.")}
        action={
          <Select
            aria-label={t("Input")}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          >
            <option value="mouse">{t("mouse")}</option>
            <option value="touch">{t("touch")}</option>
          </Select>
        }
      />
      <div className="filter-bar">
        <RadioGroup
          label={t("control-dateRange")}
          value={range}
          onValueChange={setRange}
          variant="segmented"
          options={["day", "week", "month", "year", "custom"].map((r) => ({
            value: r,
            label: t(r),
          }))}
        />
        {range === "custom" && (
          <>
            <DatePicker
              aria-label={t("From date")}
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <DatePicker
              aria-label={t("To date")}
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </>
        )}
      </div>
      <div className="stat-grid">
        <Stat label={t("Training time")} value={duration(totals.activeMs)} />
        <Stat label={t("Completed sessions")} value={num(totals.sessions)} />
        <Stat
          label={t("Weighted accuracy")}
          value={
            totals.shots ? num(ratio(totals.hits, totals.shots), 1) + "%" : "—"
          }
          note={t("Total hits divided by total shots")}
        />
        <Stat
          label={t("Tracking")}
          value={
            totals.exposureMs
              ? num(ratio(totals.onTargetMs, totals.exposureMs), 1) + "%"
              : "—"
          }
          note={t("Weighted by target exposure")}
        />
      </div>
      <div className="section-heading">
        <span className="subtle">
          {t("Active days")}:{" "}
          {num(
            new Set(
              dates
                .filter(([, v]) => v.activeMs > 0)
                .map(([k]) => k.slice(0, 10)),
            ).size,
          )}
        </span>
        <span className="subtle">
          {t("Goals completed")}: {num(totals.goals)}
        </span>
      </div>
      {!totals.sessions ? (
        <Empty
          title={t("Your story starts with a session.")}
          description={t("There is no training data in this range.")}
          to="/training"
          label={t("Start training")}
        />
      ) : (
        <>
          <section className="panel chart-panel">
            <div className="section-heading">
              <div>
                <h2>{t("Performance over time")}</h2>
                <p>
                  {t("Only compatible, uninterrupted benchmarks share a line.")}
                </p>
              </div>
              <Select
                aria-label={t("Metric")}
                value={metric}
                onChange={(e) => setMetric(e.target.value)}
              >
                <option value="score">{t("Score")}</option>
                <option value="accuracy">{t("Accuracy / tracking")}</option>
                <option value="response">{t("Response / acquisition")}</option>
              </Select>
            </div>
            <Select
              className="series-picker"
              aria-label={t("Comparable configuration")}
              value={selected ?? ""}
              onChange={(e) => setKey(e.target.value)}
            >
              {keys.map((k, i) => {
                const s = sessions.find((s) => s.comparisonKey === k)!;
                return (
                  <option key={k} value={k}>
                    {t(s.config.scenario)} · {t(s.config.difficulty)} ·{" "}
                    {s.config.duration}s · {t("Configuration")} {i + 1}
                  </option>
                );
              })}
            </Select>
            {series.length ? (
              <div
                className="chart"
                role="img"
                aria-label={t("Trend chart in {{unit}}", { unit })}
              >
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart
                    data={series}
                    margin={{ top: 18, right: 18, bottom: 8, left: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="performance-fill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#af9bf3"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="100%"
                          stopColor="#af9bf3"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      stroke="#30313d"
                      strokeDasharray="3 6"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="run"
                      tick={{ fill: "#85889f", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickMargin={12}
                      tickFormatter={(v) => num(Number(v))}
                      minTickGap={25}
                    />
                    <YAxis
                      tick={{ fill: "#85889f", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickMargin={10}
                      width={58}
                      tickFormatter={(v) => num(Number(v), 3)}
                      domain={
                        metric === "accuracy" ? [0, 100] : ["auto", "auto"]
                      }
                    />
                    <Tooltip
                      cursor={{ stroke: "#81769f", strokeDasharray: "3 4" }}
                      content={(props) => (
                        <ChartTooltip
                          {...props}
                          unit={unit}
                          labelPrefix={t("Run")}
                        />
                      )}
                    />
                    <Area
                      dataKey="value"
                      name={t(
                        metric === "score"
                          ? "Score"
                          : metric === "accuracy"
                            ? "Accuracy / tracking"
                            : "Response / acquisition",
                      )}
                      type="monotone"
                      stroke="#b5a2f8"
                      fill="url(#performance-fill)"
                      strokeWidth={2}
                      dot={
                        series.length === 1
                          ? { r: 4, fill: "#b5a2f8", strokeWidth: 0 }
                          : false
                      }
                      activeDot={{
                        r: 5,
                        fill: "#c1b0ff",
                        stroke: "#191a23",
                        strokeWidth: 3,
                      }}
                      connectNulls={false}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="empty">
                {t("No eligible comparable benchmarks in this range.")}
              </p>
            )}
            <p className="subtle">
              {t(
                "Retained sessions only. Distribution summaries use at most 256 observations.",
              )}
            </p>
            <details>
              <summary>{t("View data table")}</summary>
              <table>
                <thead>
                  <tr>
                    <th>{t("Run")}</th>
                    <th>{unit}</th>
                  </tr>
                </thead>
                <tbody>
                  {series.map((row) => (
                    <tr key={row.run}>
                      <td>{row.run}</td>
                      <td>{num(row.value, 3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </section>
          <div className="two-columns">
            <section className="panel chart-panel">
              <h2>{t("Time invested")}</h2>
              <p>
                {t("min")} · {t("Completed training only")}
              </p>
              <div role="img" aria-label={t("Training minutes by day")}>
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart
                    data={bars}
                    margin={{ top: 24, right: 8, bottom: 8, left: 0 }}
                    barCategoryGap="32%"
                  >
                    <CartesianGrid
                      stroke="#30313d"
                      strokeDasharray="3 6"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#85889f", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickMargin={12}
                      minTickGap={25}
                    />
                    <YAxis
                      tick={{ fill: "#85889f", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={52}
                      tickFormatter={(v) => num(Number(v), 3)}
                    />
                    <Tooltip
                      cursor={{ fill: "#a698d4", fillOpacity: 0.05 }}
                      content={(props) => (
                        <ChartTooltip {...props} unit={t("min")} />
                      )}
                    />
                    <Bar
                      dataKey="minutes"
                      name={t("min")}
                      fill="#a291dd"
                      maxBarSize={36}
                      radius={[5, 5, 0, 0]}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <details>
                <summary>{t("View data table")}</summary>
                {bars.map((d) => (
                  <p key={d.date}>
                    {d.date}: {num(d.minutes, 3)} {t("min")}
                  </p>
                ))}
              </details>
            </section>
            <section className="panel chart-panel">
              <h2>{t("Training mix")}</h2>
              <p>{t("Retained training minutes by scenario")}</p>
              <div role="img" aria-label={t("Training mix")}>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={dist}
                      dataKey="value"
                      innerRadius={65}
                      outerRadius={84}
                      paddingAngle={3}
                      cornerRadius={5}
                      stroke="none"
                      isAnimationActive={false}
                    >
                      {dist.map((d, i) => (
                        <Cell
                          key={d.name}
                          fill={chartColors[i % chartColors.length]}
                        />
                      ))}
                    </Pie>
                    <text
                      x="50%"
                      y="47%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#e1ddec"
                      fontSize={23}
                      fontWeight={600}
                    >
                      {num(
                        dist.reduce((sum, d) => sum + d.value, 0),
                        3,
                      )}
                    </text>
                    <text
                      x="50%"
                      y="59%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#85889f"
                      fontSize={11}
                    >
                      {t("min")}
                    </text>
                    <Tooltip
                      content={(props) => (
                        <ChartTooltip {...props} unit={t("min")} />
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="legend">
                {dist.map((d, i) => (
                  <span key={d.name}>
                    <i
                      style={{
                        background: chartColors[i % chartColors.length],
                      }}
                    />
                    {d.name} · {num(d.value, 3)} {t("min")}
                  </span>
                ))}
              </div>
            </section>
          </div>
        </>
      )}
      <section className="panel activity-panel">
        <div className="section-heading">
          <h2>{t("Show up, at your own pace.")}</h2>
          <span className="subtle">{t("Last 84 days")}</span>
        </div>
        <div className="activity-grid">
          {Array.from({ length: 84 }, (_, i) => {
            const day = addDays(today, i - 83),
              ms = db.daily[day + "|" + input]?.activeMs ?? 0,
              goal = db.dayGoals[day] ?? 180;
            return (
              <div
                key={day}
                className={
                  "activity-cell level-" +
                  (ms >= goal * 1000 ? 3 : ms > 60000 ? 2 : ms > 0 ? 1 : 0)
                }
                tabIndex={0}
                role="img"
                aria-label={`${day}: ${duration(ms)}`}
                title={`${day}: ${duration(ms)}`}
              />
            );
          })}
        </div>
        <p className="subtle">
          {t("Date groups use the timezone frozen at session start.")}{" "}
          {db.settings.timezone}
        </p>
      </section>
      {sessions.length > 0 && (
        <section className="panel recent-panel">
          <h2>{t("Recent sessions")}</h2>
          <SessionTable sessions={sessions.slice(-10)} />
        </section>
      )}
    </>
  );
}
