import { useTranslation } from "react-i18next";
import { Trophy, Check, Lock } from "lucide-react";
import { useApp } from "../../storage/store";
import { Heading, Badge } from "../../components/ui";
export default function Achievements() {
  const { t } = useTranslation(),
    { db } = useApp();
  return (
    <>
      <Heading
        title={t("Achievements")}
        description={t("Small milestones, earned through real practice.")}
      />
      <div className="library-grid">
        {["first", "routine", "seven", "hour", "precision"].map((id) => {
          const earned = db.achievements.includes(id);
          return (
            <section
              className={"panel achievement " + (earned ? "earned" : "")}
              key={id}
            >
              <div className="section-heading">
                <span className="mode-icon">
                  <Trophy size={25} />
                </span>
                <Badge color={earned ? "green" : ""}>
                  {earned ? <Check size={13} /> : <Lock size={13} />}{" "}
                  {t(earned ? "Earned" : "Upcoming")}
                </Badge>
              </div>
              <h2>{t("achievement-" + id)}</h2>
              <p>{t("requirement-" + id)}</p>
            </section>
          );
        })}
      </div>
    </>
  );
}
