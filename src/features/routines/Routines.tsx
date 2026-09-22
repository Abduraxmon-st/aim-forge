import { Select } from "../../components/controls";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Play,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Pencil,
  CheckCircle2,
} from "lucide-react";
import { useApp } from "../../storage/store";
import { type Routine, routineSchema } from "../../domain/models";
import { expandRoutine } from "../../storage/repository";
import { catalog } from "../../engine/scenarios/catalog";
import { Heading, Field, Badge, Stat } from "../../components/ui";
import { useNavigate } from "../../components/router";
import { num, duration } from "../../i18n";
export default function Routines() {
  const { t } = useTranslation(),
    { db, mutate } = useApp(),
    nav = useNavigate(),
    [editing, setEditing] = useState<Routine | null>(null),
    [error, setError] = useState(""),
    [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const progress = db.routineProgress,
    active = progress && db.routines.find((r) => r.id === progress.routineId),
    steps = active ? expandRoutine(active) : [],
    finished = !!progress && progress.step >= steps.length;
  async function launch(r: Routine, step = 0) {
    await mutate((d) => {
      if (step === 0)
        d.routineProgress = {
          routineId: r.id,
          step: 0,
          completed: 0,
          activeMs: 0,
          restUntil: 0,
        };
    });
    const s = expandRoutine(r)[step];
    if (s)
      nav(
        "/setup/" +
          s.scenario +
          "/?routine=" +
          r.id +
          "&step=" +
          step +
          "&duration=" +
          s.duration,
      );
  }
  function reorder(index: number, dir: number) {
    if (!editing) return;
    const a = [...editing.steps],
      to = index + dir;
    if (to < 0 || to >= a.length) return;
    [a[index], a[to]] = [a[to], a[index]];
    setEditing({ ...editing, steps: a });
  }
  return (
    <>
      <Heading
        title={t("Routines")}
        description={t("Less deciding. More deliberate practice.")}
        action={
          <button
            className="button primary"
            onClick={() =>
              setEditing({
                id: crypto.randomUUID(),
                name: "",
                steps: [
                  {
                    scenario: "flick-burst",
                    duration: 60,
                    rounds: 1,
                    rest: 10,
                  },
                ],
              })
            }
          >
            <Plus size={17} />
            {t("Create routine")}
          </button>
        }
      />
      {active && progress && (
        <section className="panel routine-progress">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                {t(finished ? "ROUTINE COMPLETE" : "YOUR CURRENT ROUTINE")}
              </span>
              <h2>{t(active.name)}</h2>
            </div>
            {finished ? (
              <CheckCircle2 size={25} />
            ) : (
              <Badge>
                {progress.step + 1} / {steps.length}
              </Badge>
            )}
          </div>
          {finished ? (
            <>
              <p>{t("A focused session, well spent.")}</p>
              <div className="stat-grid">
                <Stat
                  label={t("Completed sessions")}
                  value={progress.completed}
                />
                <Stat
                  label={t("Training time")}
                  value={duration(progress.activeMs)}
                />
              </div>
            </>
          ) : (
            <>
              <p>
                {t("Next up")}: {t(steps[progress.step].scenario)}
              </p>
              <p className="subtle">
                {t("Rest time never counts as training.")}
              </p>
              <button
                className="button primary"
                disabled={now < progress.restUntil}
                onClick={() => void launch(active, progress.step)}
              >
                <Play size={16} />
                {now < progress.restUntil
                  ? t("Rest {{seconds}} s", {
                      seconds: Math.ceil((progress.restUntil - now) / 1000),
                    })
                  : t("Continue routine")}
              </button>
            </>
          )}
        </section>
      )}
      <div className="library-grid">
        {db.routines.map((r) => {
          const total = r.steps.reduce((n, s) => n + s.duration * s.rounds, 0);
          return (
            <article className="panel routine-card" key={r.id}>
              <div className="section-heading">
                <Badge>
                  {num(total / 60)} {t("min")}
                </Badge>
                <div className="inline">
                  <button
                    className="icon-button"
                    aria-label={t("Edit routine")}
                    onClick={() => setEditing(structuredClone(r))}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label={t("Delete routine")}
                    onClick={() => {
                      if (confirm(t("Delete this routine?")))
                        void mutate((d) => {
                          d.routines = d.routines.filter((x) => x.id !== r.id);
                          if (d.routineProgress?.routineId === r.id)
                            d.routineProgress = null;
                        });
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <h2>{t(r.name)}</h2>
              <ol className="routine-steps">
                {r.steps.map((s, i) => (
                  <li key={i}>
                    <span>{t(s.scenario)}</span>
                    <small>
                      {s.rounds} × {s.duration}
                      {t("s")}
                    </small>
                  </li>
                ))}
              </ol>
              <button className="button full" onClick={() => void launch(r)}>
                <Play size={16} />
                {t("Start routine")}
              </button>
            </article>
          );
        })}
      </div>
      {editing && (
        <section className="panel builder">
          <Heading title={t("Routine builder")} />
          <Field label={t("Routine name")}>
            <input
              maxLength={60}
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            />
          </Field>
          <div className="builder-steps">
            {editing.steps.map((s, i) => (
              <div className="builder-step" key={i}>
                <span className="step-number">{i + 1}</span>
                <Field label={t("Scenario")}>
                  <Select
                    value={s.scenario}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        steps: editing.steps.map((x, j) =>
                          i === j
                            ? {
                                ...x,
                                scenario: e.target.value as typeof s.scenario,
                              }
                            : x,
                        ),
                      })
                    }
                  >
                    {catalog.map((x) => (
                      <option key={x.id} value={x.id}>
                        {t(x.id)}
                      </option>
                    ))}
                  </Select>
                </Field>
                {(["duration", "rounds", "rest"] as const).map((key) => (
                  <Field
                    key={key}
                    label={t(
                      key === "duration"
                        ? "Duration"
                        : key === "rounds"
                          ? "Rounds"
                          : "Rest (s)",
                    )}
                  >
                    {key === "duration" ? (
                      <Select
                        value={s[key]}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            steps: editing.steps.map((x, j) =>
                              i === j
                                ? {
                                    ...x,
                                    duration: Number(e.target.value) as
                                      30 | 60 | 120,
                                  }
                                : x,
                            ),
                          })
                        }
                      >
                        {[30, 60, 120].map((n) => (
                          <option key={n} value={n}>
                            {n} {t("s")}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <input
                        type="number"
                        min={key === "rounds" ? 1 : 0}
                        max={key === "rounds" ? 10 : 120}
                        value={s[key]}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            steps: editing.steps.map((x, j) =>
                              i === j
                                ? { ...x, [key]: Number(e.target.value) }
                                : x,
                            ),
                          })
                        }
                      />
                    )}
                  </Field>
                ))}
                <div className="inline">
                  <button
                    className="icon-button"
                    aria-label={t("Move up")}
                    disabled={i === 0}
                    onClick={() => reorder(i, -1)}
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label={t("Move down")}
                    disabled={i === editing.steps.length - 1}
                    onClick={() => reorder(i, 1)}
                  >
                    <ArrowDown size={16} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label={t("Remove step")}
                    disabled={editing.steps.length === 1}
                    onClick={() =>
                      setEditing({
                        ...editing,
                        steps: editing.steps.filter((_, j) => j !== i),
                      })
                    }
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="action-row">
            <button
              className="button"
              disabled={editing.steps.length >= 20}
              onClick={() =>
                setEditing({
                  ...editing,
                  steps: [
                    ...editing.steps,
                    {
                      scenario: "micro-precision",
                      duration: 60,
                      rounds: 1,
                      rest: 10,
                    },
                  ],
                })
              }
            >
              <Plus size={16} />
              {t("Add step")}
            </button>
            <button
              className="button primary"
              onClick={() => {
                const valid = routineSchema.safeParse(editing);
                if (!valid.success) {
                  setError("Check the routine name and step values.");
                  return;
                }
                void mutate((d) => {
                  const i = d.routines.findIndex((r) => r.id === editing.id);
                  if (i >= 0) d.routines[i] = editing;
                  else d.routines.push(editing);
                  if (d.routineProgress?.routineId === editing.id)
                    d.routineProgress = null;
                });
                setEditing(null);
              }}
            >
              {t("Save routine")}
            </button>
            <button className="button" onClick={() => setEditing(null)}>
              {t("Cancel")}
            </button>
          </div>
          {error && <p role="alert">{t(error)}</p>}
        </section>
      )}
      <p className="retention-note">
        {t(
          "Routine rounds are practice. Component sessions count once in your statistics.",
        )}
      </p>
    </>
  );
}
