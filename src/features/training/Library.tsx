import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Search,
  Star,
  ArrowUpRight,
  MousePointer2,
  Crosshair,
  Move,
  Zap,
} from "lucide-react";
import { useApp } from "../../storage/store";
import { catalog } from "../../engine/scenarios/catalog";
import { Heading, Badge } from "../../components/ui";
import { Link } from "../../components/router";
export default function Library() {
  const { t } = useTranslation(),
    { db, mutate } = useApp(),
    [q, setQ] = useState(""),
    [dim, setDim] = useState("all"),
    [skill, setSkill] = useState("all"),
    [difficulty, setDifficulty] = useState("beginner"),
    [favorites, setFavorites] = useState(false);
  const items = catalog.filter(
    (s) =>
      (dim === "all" || s.dimension === dim) &&
      (skill === "all" || s.skill === skill) &&
      (!favorites || db.favorites.includes(s.id)) &&
      (t(s.id) + " " + t(s.id + "Desc"))
        .toLowerCase()
        .includes(q.toLowerCase()),
  );
  return (
    <>
      <Heading
        eyebrow={t("YOUR TRAINING SPACE")}
        title={t("Training library")}
        description={t("Choose a skill. Find your rhythm.")}
      />
      <div className="filter-bar">
        <label className="search">
          <Search size={18} />
          <input
            aria-label={t("Search scenarios")}
            placeholder={t("Search scenarios")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <select
          aria-label={t("Dimension")}
          value={dim}
          onChange={(e) => setDim(e.target.value)}
        >
          <option value="all">{t("All dimensions")}</option>
          <option value="2d">2D</option>
          <option value="3d">3D</option>
        </select>
        <select
          aria-label={t("Skill")}
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
        >
          <option value="all">{t("All skills")}</option>
          {["flicking", "tracking", "precision", "reaction", "switching"].map(
            (x) => (
              <option key={x} value={x}>
                {t(x)}
              </option>
            ),
          )}
        </select>
        <select
          aria-label={t("Difficulty")}
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        >
          {["beginner", "intermediate", "advanced"].map((x) => (
            <option key={x} value={x}>
              {t(x)}
            </option>
          ))}
        </select>
        <button
          className={"button " + (favorites ? "selected" : "")}
          aria-pressed={favorites}
          onClick={() => setFavorites(!favorites)}
        >
          <Star size={16} />
          {t("Favorites")}
        </button>
      </div>
      <div className="section-heading">
        <p>{t("scenarioCount", { count: items.length })}</p>
        <small>{t("All results are local and unverified.")}</small>
      </div>
      <div className="library-grid">
        {items.map((s) => {
          const I =
            s.skill === "tracking"
              ? Move
              : s.skill === "flicking"
                ? Zap
                : Crosshair;
          return (
            <article
              key={s.id}
              className={
                "mode-card " +
                (s.dimension === "3d"
                  ? "blue"
                  : s.skill === "precision"
                    ? "orange"
                    : "violet")
              }
            >
              <div className="card-top">
                <span className="mode-icon">
                  <I size={27} />
                </span>
                <button
                  className="icon-button"
                  aria-label={t("Favorite scenario", { scenario: t(s.id) })}
                  aria-pressed={db.favorites.includes(s.id)}
                  onClick={() =>
                    void mutate((d) => {
                      d.favorites = d.favorites.includes(s.id)
                        ? d.favorites.filter((x) => x !== s.id)
                        : [...d.favorites, s.id];
                    })
                  }
                >
                  <Star
                    size={18}
                    fill={db.favorites.includes(s.id) ? "currentColor" : "none"}
                  />
                </button>
              </div>
              <div className="badges">
                <Badge>{s.dimension.toUpperCase()}</Badge>
                <Badge>{t(s.skill)}</Badge>
                <Badge>{t(difficulty)}</Badge>
              </div>
              <h3>{t(s.id)}</h3>
              <p>{t(s.id + "Desc")}</p>
              <Link
                className="card-footer"
                to={"/setup/" + s.id + "/?difficulty=" + difficulty}
              >
                <span>
                  <MousePointer2 size={14} />
                  {t("Open scenario")}
                </span>
                <ArrowUpRight size={18} />
              </Link>
            </article>
          );
        })}
      </div>
      {!items.length && (
        <div className="empty panel">
          <p>{t("No matching scenarios.")}</p>
          <button
            className="button"
            onClick={() => {
              setQ("");
              setDim("all");
              setSkill("all");
              setFavorites(false);
            }}
          >
            {t("Clear filters")}
          </button>
        </div>
      )}
    </>
  );
}
