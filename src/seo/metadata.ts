import type { Metadata } from "next";
import { scenarioIds, type Config } from "../domain/models";
import { getSiteOrigin } from "./config";
import {
  getGameCopy,
  getSeoCopy,
  supportedLocales,
  type Locale,
} from "./content";

type ScenarioId = Config["scenario"];
export type PublicPageKind = "home" | "training" | "help" | "game";

const socialLocales: Record<Locale, string> = {
  en: "en_US",
  es: "es_ES",
  de: "de_DE",
  ru: "ru_RU",
  uz: "uz_UZ",
};

function gameId(id?: ScenarioId): ScenarioId {
  if (!id || !scenarioIds.includes(id))
    throw new Error("A known scenario is required for game SEO metadata.");
  return id;
}

function suffix(kind: PublicPageKind, id?: ScenarioId): string {
  return kind === "home" ? "" : kind === "game" ? `games/${gameId(id)}` : kind;
}

export function localizedPublicPath(
  locale: Locale,
  kind: PublicPageKind,
  id?: ScenarioId,
): string {
  const path = suffix(kind, id);
  return `/${locale}/${path ? path + "/" : ""}`;
}

/** Absolute, reciprocal language alternatives are emitted only after setup. */
export function languageAlternates(
  pathSuffix = "",
): Record<string, string> | undefined {
  const origin = getSiteOrigin();
  if (!origin) return undefined;
  const path = pathSuffix.replace(/^\/+|\/+$/g, "");
  const tail = path ? path + "/" : "";
  return {
    ...Object.fromEntries(
      supportedLocales.map((locale) => [locale, `${origin}/${locale}/${tail}`]),
    ),
    "x-default": `${origin}/en/${tail}`,
  };
}

export function publicMetadata(
  locale: Locale,
  kind: PublicPageKind,
  id?: ScenarioId,
): Metadata {
  const origin = getSiteOrigin();
  const copy =
    kind === "game"
      ? getGameCopy(locale, gameId(id))
      : getSeoCopy(locale)[kind];
  const path = localizedPublicPath(locale, kind, id);
  const imagePath = `/training/${kind === "game" ? gameId(id) : "sphere-flick"}-1.jpg`;
  const images = origin
    ? [{ url: origin + imagePath, alt: copy.title }]
    : undefined;
  return {
    title: { absolute: copy.title },
    description: copy.description,
    applicationName: "AimForge",
    ...(origin
      ? {
          metadataBase: new URL(origin),
          alternates: {
            canonical: origin + path,
            languages: languageAlternates(suffix(kind, id)),
          },
        }
      : {}),
    robots: {
      index: Boolean(origin),
      follow: true,
      ...(origin ? { "max-image-preview": "large" as const } : {}),
    },
    openGraph: {
      type: "website",
      title: copy.title,
      description: copy.description,
      siteName: "AimForge",
      locale: socialLocales[locale],
      alternateLocale: supportedLocales
        .filter((language) => language !== locale)
        .map((language) => socialLocales[language]),
      ...(origin ? { url: origin + path, images } : {}),
    },
    twitter: {
      card: origin ? "summary_large_image" : "summary",
      title: copy.title,
      description: copy.description,
      ...(images ? { images } : {}),
    },
  };
}

/** Personal/session screens remain noindex even on a public deployment. */
export function privateMetadata(locale: Locale, title: string): Metadata {
  return {
    title: { absolute: `${title} | AimForge` },
    description: getSeoCopy(locale).home.description,
    robots: { index: false, follow: true },
    alternates: null,
    openGraph: null,
    twitter: null,
  };
}

type StructuredNode = Record<string, unknown>;

/**
 * Only public, visible product information belongs in this graph. Ratings,
 * player statistics, personal progress, and claimed search features are absent.
 * Local exports omit identifiers and URLs rather than inventing a public host.
 */
export function publicStructuredData(
  locale: Locale,
  kind: PublicPageKind,
  id?: ScenarioId,
): { "@context": string; "@graph": StructuredNode[] } {
  const origin = getSiteOrigin();
  const copy = getSeoCopy(locale);
  const pageCopy =
    kind === "game" ? getGameCopy(locale, gameId(id)) : copy[kind];
  const pagePath = localizedPublicPath(locale, kind, id);
  const pageUrl = origin ? origin + pagePath : undefined;
  const siteId = origin ? `${origin}/#website` : undefined;
  const nodes: StructuredNode[] = [
    {
      "@type": "WebSite",
      name: "AimForge",
      inLanguage: [...supportedLocales],
      ...(origin ? { "@id": siteId, url: `${origin}/en/` } : {}),
    },
  ];
  const page: StructuredNode = {
    "@type": kind === "training" ? "CollectionPage" : "WebPage",
    name: pageCopy.title,
    description: pageCopy.description,
    inLanguage: locale,
    ...(pageUrl
      ? {
          "@id": `${pageUrl}#webpage`,
          url: pageUrl,
          isPartOf: { "@id": siteId },
        }
      : {}),
  };

  if (kind === "training") {
    page.mainEntity = {
      "@type": "ItemList",
      numberOfItems: scenarioIds.length,
      itemListElement: scenarioIds.map((scenario, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: getGameCopy(locale, scenario).name,
        ...(origin
          ? { url: origin + localizedPublicPath(locale, "game", scenario) }
          : {}),
      })),
    };
  }

  if (kind === "game") {
    const scenario = gameId(id);
    const game: StructuredNode = {
      "@type": ["VideoGame", "WebApplication"],
      name: getGameCopy(locale, scenario).name,
      description: pageCopy.description,
      inLanguage: locale,
      applicationCategory: "GameApplication",
      gamePlatform: "Web browser",
      playMode: "https://schema.org/SinglePlayer",
      numberOfPlayers: { "@type": "QuantitativeValue", value: 1 },
      isAccessibleForFree: true,
      ...(pageUrl
        ? {
            "@id": `${pageUrl}#game`,
            url: pageUrl,
            mainEntityOfPage: { "@id": `${pageUrl}#webpage` },
            image: `${origin}/training/${scenario}-1.jpg`,
            screenshot: [1, 2].map(
              (frame) => `${origin}/training/${scenario}-${frame}.jpg`,
            ),
          }
        : {}),
    };
    page.mainEntity = pageUrl ? { "@id": `${pageUrl}#game` } : game;
    if (pageUrl) nodes.push(game);
  }

  if (origin && kind !== "home") {
    const crumbs = [
      { name: "AimForge", path: localizedPublicPath(locale, "home") },
      ...(kind === "game"
        ? [
            {
              name: copy.training.title,
              path: localizedPublicPath(locale, "training"),
            },
            { name: getGameCopy(locale, gameId(id)).name, path: pagePath },
          ]
        : [{ name: pageCopy.title, path: pagePath }]),
    ];
    page.breadcrumb = { "@id": `${pageUrl}#breadcrumb` };
    nodes.push({
      "@type": "BreadcrumbList",
      "@id": `${pageUrl}#breadcrumb`,
      itemListElement: crumbs.map((crumb, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: crumb.name,
        item: origin + crumb.path,
      })),
    });
  }

  nodes.push(page);
  return { "@context": "https://schema.org", "@graph": nodes };
}
