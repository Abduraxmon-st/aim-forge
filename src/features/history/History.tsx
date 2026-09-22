import { Select, DatePicker } from "../../components/controls";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../storage/store";
import { Heading, Empty, SessionTable } from "../../components/ui";
import { catalog } from "../../engine/scenarios/catalog";
export default function History() {
  const { t } = useTranslation(),
    { db } = useApp(),
    [scenario, setScenario] = useState("all"),
    [input, setInput] = useState("all"),
    [kind, setKind] = useState("all"),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [page, setPage] = useState(0);
  const rows = db.sessions.filter(
      (s) =>
        (scenario === "all" || s.config.scenario === scenario) &&
        (input === "all" || s.config.input === input) &&
        (kind === "all" || s.config.kind === kind) &&
        (!from || s.date >= from) &&
        (!to || s.date <= to),
    ),
    slice = rows.slice(
      Math.max(0, rows.length - (page + 1) * 20),
      rows.length - page * 20,
    );
  return (
    <>
      <Heading
        title={t("Session history")}
        description={t("Every retained round, with its original settings.")}
      />
      <div className="filter-bar">
        <Select
          aria-label={t("Scenario")}
          value={scenario}
          onChange={(e) => {
            setScenario(e.target.value);
            setPage(0);
          }}
        >
          <option value="all">{t("All scenarios")}</option>
          {catalog.map((s) => (
            <option key={s.id} value={s.id}>
              {t(s.id)}
            </option>
          ))}
        </Select>
        <Select
          aria-label={t("Input")}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setPage(0);
          }}
        >
          <option value="all">{t("All inputs")}</option>
          <option value="mouse">{t("mouse")}</option>
          <option value="touch">{t("touch")}</option>
        </Select>
        <Select
          aria-label={t("Run type")}
          value={kind}
          onChange={(e) => {
            setKind(e.target.value);
            setPage(0);
          }}
        >
          {["all", "standard", "practice", "daily", "custom"].map((k) => (
            <option key={k} value={k}>
              {t(k === "all" ? "All run types" : k)}
            </option>
          ))}
        </Select>
        <DatePicker
          aria-label={t("From date")}
          value={from}
          onChange={(e) => {
            setFrom(e.target.value);
            setPage(0);
          }}
        />
        <DatePicker
          aria-label={t("To date")}
          value={to}
          onChange={(e) => {
            setTo(e.target.value);
            setPage(0);
          }}
        />
      </div>
      {rows.length ? (
        <section className="panel">
          <SessionTable sessions={slice} />
          <div className="pagination">
            <button
              className="button"
              disabled={!page}
              onClick={() => setPage((p) => p - 1)}
            >
              {t("Newer")}
            </button>
            <span>
              {page + 1} / {Math.ceil(rows.length / 20)}
            </span>
            <button
              className="button"
              disabled={(page + 1) * 20 >= rows.length}
              onClick={() => setPage((p) => p + 1)}
            >
              {t("Older")}
            </button>
          </div>
        </section>
      ) : (
        <Empty
          title={t("No sessions here yet.")}
          description={t("Complete a round or adjust your filters.")}
          to="/training"
          label={t("Start training")}
        />
      )}
      <p className="retention-note">{t("retentionSummary")}</p>
    </>
  );
}
