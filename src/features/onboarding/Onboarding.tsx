import { useState } from "react";
import { useTranslation } from "react-i18next";
import { type Settings } from "../../domain/models";
import { useApp } from "../../storage/store";
import { Heading, Field } from "../../components/ui";
import { Link, useNavigate } from "../../components/router";
export default function Onboarding() {
  const { t } = useTranslation(),
    { db, settings } = useApp(),
    nav = useNavigate(),
    [name, setName] = useState(db.settings.nickname),
    [input, setInput] = useState(db.settings.input),
    [goal, setGoal] = useState(db.settings.goal);
  return (
    <div className="onboarding">
      <Heading
        eyebrow={t("WELCOME TO AIMFORGE")}
        title={t("A space for your practice.")}
        description={t("Optional setup. You can change everything later.")}
      />
      <section className="panel">
        <Field label={t("Language")}>
          <select
            value={db.settings.language}
            onChange={(e) =>
              void settings({
                language: e.target.value as Settings["language"],
              })
            }
          >
            {[
              ["en", "English"],
              ["es", "Español"],
              ["de", "Deutsch"],
              ["ru", "Русский"],
              ["uz", "O‘zbekcha"],
            ].map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("Nickname (optional)")}>
          <input
            value={name}
            maxLength={30}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label={t("Preferred input")}>
          <select
            value={input}
            onChange={(e) => setInput(e.target.value as Settings["input"])}
          >
            <option value="mouse">{t("mouse")}</option>
            <option value="touch">{t("touch")}</option>
          </select>
        </Field>
        <Field label={t("Training goal")}>
          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value as Settings["goal"])}
          >
            {["balanced", "precision", "speed", "tracking"].map((x) => (
              <option key={x} value={x}>
                {t(x)}
              </option>
            ))}
          </select>
        </Field>
        <div className="notice">
          <p>{t("localPrivacy")}</p>
        </div>
        <p>{t("help-controlsBody")}</p>
        <div className="action-row">
          <button
            className="button primary"
            onClick={async () => {
              await settings({ nickname: name, input, goal, onboarded: true });
              nav("/setup/flick-burst");
            }}
          >
            {t("Start training")}
          </button>
          <Link className="button" to="/training">
            {t("Skip for now")}
          </Link>
        </div>
      </section>
    </div>
  );
}
