import { useTranslation } from "react-i18next";
import { Heading } from "../../components/ui";
import { Link } from "../../components/router";
export default function Help() {
  const { t } = useTranslation();
  return (
    <>
      <Heading
        title={t("Help & privacy")}
        description={t("Know your tools. Own your progress.")}
      />
      <div className="help-content">
        {[
          "controls",
          "metrics",
          "comparisons",
          "streaks",
          "privacy",
          "retention",
          "browser",
          "offline",
          "accessibility",
        ].map((section) => (
          <section className="panel" key={section}>
            <h2>{t("help-" + section)}</h2>
            <p>{t("help-" + section + "Body")}</p>
          </section>
        ))}
        <div className="action-row">
          <Link className="button primary" to="/setup/flick-burst">
            {t("Try 2D practice")}
          </Link>
          <Link className="button" to="/settings">
            {t("Settings")}
          </Link>
        </div>
      </div>
    </>
  );
}
