import type { ReactNode } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  ChevronRight,
  CircleHelp,
  Crosshair,
  Gamepad2,
  Globe2,
  History,
  LayoutDashboard,
  ListVideo,
  Play,
  Settings,
  Trophy,
} from "lucide-react";
import { catalog } from "../engine/scenarios/catalog";
import type { Config } from "../domain/models";
import { resources } from "../i18n/resources";
import { localeNames, supportedLocales, type Locale } from "../i18n/languages";
import GamePreview from "../features/training/GamePreview";
import { getGameCopy, getSeoCopy } from "./content";
import { publicStructuredData, type PublicPageKind } from "./metadata";
import { PublicLibrary } from "./LocalizedRuntime";

function StructuredData({
  locale,
  kind,
  id,
}: {
  locale: Locale;
  kind: PublicPageKind;
  id?: Config["scenario"];
}) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(publicStructuredData(locale, kind, id)).replace(
          /</g,
          "\\u003c",
        ),
      }}
    />
  );
}

function PublicShell({
  locale,
  path = "",
  children,
}: {
  locale: Locale;
  path?: string;
  children: ReactNode;
}) {
  const copy = getSeoCopy(locale),
    dictionary = resources[locale].translation as Record<string, string>;
  const nav = [
    ["", copy.nav.home, LayoutDashboard],
    ["training/", copy.nav.training, Gamepad2],
    ["dashboard/", dictionary["My progress"], BarChart3],
    ["history/", dictionary["Session history"], History],
    ["challenges/", dictionary["Daily challenges"], CalendarDays],
    ["routines/", dictionary["Routines"], ListVideo],
    ["achievements/", dictionary["Achievements"], Trophy],
  ] as const;
  return (
    <div className="app-shell public-shell">
      <a className="skip-link" href="#content">
        {dictionary["Skip to content"]}
      </a>
      <aside className="sidebar">
        <a className="brand" href={`/${locale}/`}>
          <span className="brand-symbol">
            <Crosshair size={24} />
          </span>
          AimForge<span className="brand-dot">.</span>
        </a>
        <span className="nav-caption">{dictionary["YOUR TRAINING SPACE"]}</span>
        <nav aria-label={dictionary["Main navigation"]}>
          {nav.map(([suffix, label, Icon]) => {
            const active =
              path === suffix ||
              (suffix === "training/" && path.startsWith("games/"));
            return (
              <a
                key={suffix}
                href={`/${locale}/${suffix}`}
                className={active ? "active" : undefined}
                aria-current={path === suffix ? "page" : undefined}
              >
                <Icon size={19} />
                {label}
              </a>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <a href={`/${locale}/settings/`}>
            <Settings size={18} />
            {dictionary["Settings"]}
          </a>
          <a
            href={`/${locale}/help/`}
            className={path === "help/" ? "active" : undefined}
            aria-current={path === "help/" ? "page" : undefined}
          >
            <CircleHelp size={18} />
            {copy.nav.help}
          </a>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar public-topbar">
          <span>{dictionary["YOUR PERSONAL TRAINING GROUND"]}</span>
          <nav className="language-links" aria-label={copy.labels.language}>
            <Globe2 size={15} aria-hidden="true" />
            {supportedLocales.map((language) => (
              <a
                key={language}
                href={`/${language}/${path}`}
                lang={language}
                hrefLang={language}
                title={localeNames[language]}
                aria-label={localeNames[language]}
                aria-current={language === locale ? "page" : undefined}
              >
                {language.toUpperCase()}
              </a>
            ))}
          </nav>
        </header>
        <main id="content" className="public-content">
          <div className="page-transition" key={path}>
            {children}
          </div>
          <footer>
            <a href={`/${locale}/training/`}>
              {dictionary["Built for focused practice."]}
            </a>
            <a href={`/${locale}/help/`}>{copy.nav.help}</a>
          </footer>
        </main>
      </div>
    </div>
  );
}

function GameLinks({
  locale,
  ids,
}: {
  locale: Locale;
  ids: Config["scenario"][];
}) {
  const copy = getSeoCopy(locale);
  return (
    <div className="public-game-links">
      {ids.map((id) => {
        const game = getGameCopy(locale, id),
          scenario = catalog.find((s) => s.id === id)!;
        return (
          <a
            href={`/${locale}/games/${id}/`}
            className="public-game-link"
            key={id}
          >
            <img
              src={`/training/${id}-1.jpg`}
              alt={game.name}
              width={1018}
              height={637}
              loading="lazy"
              decoding="async"
            />
            <span>
              <small>
                {scenario.dimension.toUpperCase()} ·{" "}
                {copy.skills[scenario.skill as keyof typeof copy.skills]}
              </small>
              <strong>{game.name}</strong>
            </span>
            <ArrowUpRight size={18} />
          </a>
        );
      })}
    </div>
  );
}

export function PublicHome({ locale }: { locale: Locale }) {
  const copy = getSeoCopy(locale);
  return (
    <PublicShell locale={locale}>
      <StructuredData locale={locale} kind="home" />
      <section className="public-home-hero">
        <div>
          <span className="eyebrow">AIMFORGE / 2D + 3D</span>
          <h1>{copy.home.heading}</h1>
          <p>{copy.home.intro}</p>
          <a className="button primary" href={`/${locale}/training/`}>
            {copy.labels.allGames}
            <ArrowUpRight size={17} />
          </a>
        </div>
        <div className="public-hero-preview">
          <GamePreview scenario="sphere-flick" dimension="3d" eager />
        </div>
      </section>
      <div className="public-features">
        {copy.home.features.map((feature, index) => (
          <section key={feature.title}>
            <span className="eyebrow">0{index + 1}</span>
            <h2>{feature.title}</h2>
            <p>{feature.body}</p>
          </section>
        ))}
      </div>
      <section className="public-section">
        <div className="public-section-title">
          <h2>{copy.nav.training}</h2>
          <a href={`/${locale}/training/`}>
            {copy.labels.allGames}
            <ArrowUpRight size={16} />
          </a>
        </div>
        <GameLinks locale={locale} ids={catalog.map((s) => s.id)} />
      </section>
    </PublicShell>
  );
}

export function PublicTraining({ locale }: { locale: Locale }) {
  const copy = getSeoCopy(locale);
  return (
    <PublicShell locale={locale} path="training/">
      <StructuredData locale={locale} kind="training" />
      <PublicLibrary />
      <section className="public-library-intro">
        <h2>{copy.training.heading}</h2>
        <p>{copy.training.intro}</p>
      </section>
    </PublicShell>
  );
}

export function PublicHelp({ locale }: { locale: Locale }) {
  const copy = getSeoCopy(locale);
  return (
    <PublicShell locale={locale} path="help/">
      <StructuredData locale={locale} kind="help" />
      <header className="page-heading">
        <span className="eyebrow">AIMFORGE / {copy.nav.help}</span>
        <h1>{copy.help.heading}</h1>
        <p>{copy.help.intro}</p>
      </header>
      <div className="help-layout public-help">
        <nav className="help-nav" aria-label={copy.nav.help}>
          {copy.help.sections.map((section) => (
            <a href={`#${section.id}`} key={section.id}>
              {section.title}
              <ChevronRight size={15} />
            </a>
          ))}
        </nav>
        <div className="public-help-sections">
          {copy.help.sections.map((section) => (
            <section
              id={section.id}
              key={section.id}
              className="public-guide-section"
            >
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </PublicShell>
  );
}

export function GamePage({
  locale,
  id,
}: {
  locale: Locale;
  id: Config["scenario"];
}) {
  const copy = getSeoCopy(locale),
    game = getGameCopy(locale, id),
    scenario = catalog.find((s) => s.id === id)!;
  const skill = copy.skills[scenario.skill as keyof typeof copy.skills];
  const related = [
    ...catalog.filter((s) => s.id !== id && s.skill === scenario.skill),
    ...catalog.filter((s) => s.id !== id && s.skill !== scenario.skill),
  ].slice(0, 3);
  const facts = [
    [copy.labels.skill, skill],
    [
      copy.labels.duration,
      id === "reaction-tap" ? copy.facts.reaction : copy.facts.timed,
    ],
    [
      copy.labels.devices,
      scenario.dimension === "2d"
        ? copy.facts.mouseTouch
        : copy.facts.desktopMouse,
    ],
    [copy.labels.difficulty, copy.facts.difficulties],
  ];
  return (
    <PublicShell locale={locale} path={`games/${id}/`}>
      <StructuredData locale={locale} kind="game" id={id} />
      <nav
        className="public-breadcrumbs"
        aria-label={copy.labels.backToLibrary}
      >
        <a href={`/${locale}/`}>{copy.nav.home}</a>
        <ChevronRight size={13} />
        <a href={`/${locale}/training/`}>{copy.nav.training}</a>
        <ChevronRight size={13} />
        <span aria-current="page">{game.name}</span>
      </nav>
      <header className="public-game-heading">
        <div>
          <span className="eyebrow">
            {scenario.dimension.toUpperCase()} / {skill}
          </span>
          <h1>{game.name}</h1>
        </div>
        <a className="button primary" href={`/${locale}/setup/${id}/`}>
          <Play size={17} />
          {copy.labels.play}
        </a>
      </header>
      <div className="public-game-hero">
        <section
          className="public-game-gallery"
          aria-label={copy.labels.screenshots}
        >
          <GamePreview scenario={id} dimension={scenario.dimension} eager />
        </section>
        <section className="public-game-summary">
          <h2>{copy.labels.quickFacts}</h2>
          <p>{game.intro}</p>
          <dl>
            {facts.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
      <div className="public-guide-grid">
        <div>
          <section className="public-guide-section">
            <h2>{copy.labels.howTo}</h2>
            <ol className="public-steps">
              {game.howTo.map((step, index) => (
                <li key={step}>
                  <span aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p>{step}</p>
                </li>
              ))}
            </ol>
          </section>
          <section className="public-guide-section">
            <h2>{copy.labels.scoring}</h2>
            <p>{game.scoring}</p>
          </section>
          <section className="public-guide-section">
            <h2>{copy.labels.faq}</h2>
            <div className="public-faq">
              {game.faq.map((item) => (
                <details key={item.question}>
                  <summary>
                    {item.question}
                    <ChevronRight size={16} />
                  </summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
        <aside className="public-guide-aside">
          <section className="public-guide-section">
            <h2>{copy.labels.controls}</h2>
            <p>{game.controls}</p>
          </section>
          <section className="public-guide-section">
            <h2>{copy.labels.tips}</h2>
            <ul>
              {game.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </section>
          <section className="public-guide-section">
            <h2>{copy.labels.requirements}</h2>
            <p>{game.requirements}</p>
          </section>
        </aside>
      </div>
      <section className="public-section">
        <div className="public-section-title">
          <h2>{copy.labels.relatedGames}</h2>
          <a href={`/${locale}/training/`}>
            <ArrowLeft size={16} />
            {copy.labels.allGames}
          </a>
        </div>
        <GameLinks locale={locale} ids={related.map((s) => s.id)} />
      </section>
    </PublicShell>
  );
}
