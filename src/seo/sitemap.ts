import type { MetadataRoute } from "next";
import { scenarioIds } from "../domain/models";
import { getSiteOrigin } from "./config";
import { supportedLocales } from "./content";
import { languageAlternates, localizedPublicPath } from "./metadata";

/** Only canonical public documents belong here; profiles and runs never do. */
export function buildSitemap(): MetadataRoute.Sitemap {
  const origin = getSiteOrigin();
  if (!origin) return [];
  return supportedLocales.flatMap((locale) => [
    ...(["home", "training", "help"] as const).map((kind) => ({
      url: origin + localizedPublicPath(locale, kind),
      alternates: {
        languages: languageAlternates(kind === "home" ? "" : kind),
      },
    })),
    ...scenarioIds.map((id) => ({
      url: origin + localizedPublicPath(locale, "game", id),
      alternates: { languages: languageAlternates(`games/${id}`) },
      images: [1, 2].map((frame) => `${origin}/training/${id}-${frame}.jpg`),
    })),
  ]);
}
