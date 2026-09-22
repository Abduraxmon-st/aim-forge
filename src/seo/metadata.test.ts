import { afterEach, describe, expect, it, vi } from "vitest";
import robots from "../app/robots";
import { scenarioIds } from "../domain/models";
import { getSiteOrigin, parseSiteOrigin } from "./config";
import { getGameCopy, supportedLocales } from "./content";
import {
  languageAlternates,
  localizedPublicPath,
  privateMetadata,
  publicMetadata,
  publicStructuredData,
} from "./metadata";
import { buildSitemap } from "./sitemap";

const testOrigin = "https://aimforge.test";
afterEach(() => vi.unstubAllEnvs());

describe("deployment origin", () => {
  it("has no implicit public domain and normalizes an explicit origin", () => {
    expect(parseSiteOrigin(undefined)).toBeUndefined();
    expect(parseSiteOrigin("  ")).toBeUndefined();
    expect(parseSiteOrigin("https://AIMFORGE.test/")).toBe(testOrigin);
    vi.stubEnv("SITE_URL", "");
    expect(getSiteOrigin()).toBeUndefined();
  });

  it("rejects ambiguous, insecure or non-origin deployment values", () => {
    for (const value of [
      "aimforge.test",
      "http://aimforge.test",
      "http://127.0.0.1:4173",
      "ftp://aimforge.test",
      "https://aimforge.test/app",
      "https://aimforge.test/path/..",
      "https://aimforge.test?",
      "https://aimforge.test?preview=1",
      "https://aimforge.test#",
      "https://aimforge.test#top",
      "https://user:password@aimforge.test",
      "https://aimforge.test\\path",
      "https://aimforge.\ntest",
    ]) {
      expect(() => parseSiteOrigin(value), value).toThrow("SITE_URL");
    }
  });
});

describe("public multilingual metadata", () => {
  it("keeps an unconfigured local export out of search and omits invented URLs", () => {
    vi.stubEnv("SITE_URL", "");
    for (const locale of supportedLocales) {
      const metadata = publicMetadata(locale, "game", "flick-burst");
      expect(metadata.robots).toMatchObject({ index: false, follow: true });
      expect(metadata.alternates).toBeUndefined();
      expect(metadata.metadataBase).toBeUndefined();
      expect(metadata.openGraph).not.toHaveProperty("url");
      expect(metadata.openGraph).not.toHaveProperty("images");
    }
    expect(languageAlternates("games/flick-burst")).toBeUndefined();
    expect(buildSitemap()).toEqual([]);
    expect(robots()).toEqual({ rules: { userAgent: "*", disallow: "/" } });
    const graph = publicStructuredData("de", "game", "flick-burst");
    for (const node of graph["@graph"]) {
      expect(node).not.toHaveProperty("url");
      expect(node).not.toHaveProperty("@id");
    }
  });

  it("gives every game a self-canonical and reciprocal language alternatives", () => {
    vi.stubEnv("SITE_URL", testOrigin);
    for (const id of scenarioIds) {
      const expected = languageAlternates(`games/${id}`);
      expect(Object.keys(expected!)).toEqual([
        ...supportedLocales,
        "x-default",
      ]);
      for (const locale of supportedLocales) {
        const path = localizedPublicPath(locale, "game", id);
        const metadata = publicMetadata(locale, "game", id);
        expect(metadata.alternates).toEqual({
          canonical: testOrigin + path,
          languages: expected,
        });
        expect(expected![locale]).toBe(testOrigin + path);
        expect(metadata.robots).toMatchObject({ index: true, follow: true });
        expect(metadata.openGraph).toMatchObject({
          url: testOrigin + path,
          title: getGameCopy(locale, id).title,
          description: getGameCopy(locale, id).description,
          images: [{ url: `${testOrigin}/training/${id}-1.jpg` }],
        });
      }
    }
  });

  it("has specific game titles and descriptions in every language", () => {
    for (const locale of supportedLocales) {
      const copies = scenarioIds.map((id) => getGameCopy(locale, id));
      expect(new Set(copies.map((copy) => copy.title)).size).toBe(10);
      expect(new Set(copies.map((copy) => copy.description)).size).toBe(10);
      for (const copy of copies) {
        expect(copy.name.trim().length).toBeGreaterThan(3);
        expect(copy.title.trim().length).toBeGreaterThan(10);
        expect(copy.description.trim().length).toBeGreaterThan(50);
      }
    }
    for (const id of scenarioIds)
      expect(
        new Set(
          supportedLocales.map((locale) => getGameCopy(locale, id).description),
        ).size,
      ).toBe(5);
  });

  it("rejects missing or unknown games instead of canonicalizing a fallback", () => {
    vi.stubEnv("SITE_URL", testOrigin);
    expect(() => publicMetadata("en", "game")).toThrow("known scenario");
    expect(() =>
      publicMetadata("en", "game", "unknown" as (typeof scenarioIds)[number]),
    ).toThrow("known scenario");
  });

  it("keeps personal screens noindex without preventing crawlers reading the rule", () => {
    for (const origin of ["", testOrigin]) {
      vi.stubEnv("SITE_URL", origin);
      const metadata = privateMetadata("en", "Settings");
      expect(metadata.robots).toEqual({ index: false, follow: true });
      expect(metadata.alternates).toBeNull();
    }
    expect(robots()).toEqual({
      rules: { userAgent: "*", allow: "/" },
      sitemap: `${testOrigin}/sitemap.xml`,
    });
  });
});

describe("sitemap and structured data", () => {
  it("omits homepage breadcrumbs and emits at least two items on every other public page", () => {
    vi.stubEnv("SITE_URL", testOrigin);
    for (const locale of supportedLocales) {
      const home = publicStructuredData(locale, "home")["@graph"];
      expect(home.some((node) => node["@type"] === "BreadcrumbList")).toBe(
        false,
      );
      expect(
        home.find((node) => node["@type"] === "WebPage"),
      ).not.toHaveProperty("breadcrumb");
      const graphs = [
        publicStructuredData(locale, "training"),
        publicStructuredData(locale, "help"),
        ...scenarioIds.map((id) => publicStructuredData(locale, "game", id)),
      ];
      for (const graph of graphs) {
        const breadcrumbs = graph["@graph"].filter(
          (node) => node["@type"] === "BreadcrumbList",
        );
        expect(breadcrumbs).toHaveLength(1);
        const items = breadcrumbs[0].itemListElement as unknown[];
        expect(items.length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("lists exactly 65 canonical documents with language alternates and game images", () => {
    vi.stubEnv("SITE_URL", testOrigin);
    const sitemap = buildSitemap();
    const urls = new Set(sitemap.map((entry) => entry.url));
    expect(sitemap).toHaveLength(65);
    expect(urls.size).toBe(65);
    expect(
      sitemap.filter((entry) => entry.url.includes("/games/")),
    ).toHaveLength(50);
    for (const entry of sitemap) {
      expect(entry.url).toMatch(
        /^https:\/\/aimforge\.test\/(en|es|de|ru|uz)\/(|training\/|help\/|games\/[^/]+\/)$/,
      );
      expect(entry.url).not.toContain("?");
      expect(entry.lastModified).toBeUndefined();
      const alternatives = Object.values(entry.alternates!.languages!);
      expect(alternatives).toHaveLength(6);
      for (const alternate of alternatives)
        expect(urls.has(String(alternate))).toBe(true);
      if (entry.url.includes("/games/")) {
        const id = entry.url.split("/").at(-2);
        expect(entry.images).toEqual([
          `${testOrigin}/training/${id}-1.jpg`,
          `${testOrigin}/training/${id}-2.jpg`,
        ]);
      }
    }
  });

  it("describes the actual free single-player game without invented review data", () => {
    vi.stubEnv("SITE_URL", testOrigin);
    const graph = publicStructuredData("ru", "game", "sphere-flick");
    expect(JSON.parse(JSON.stringify(graph))).toEqual(graph);
    const game = graph["@graph"].find((node) => Array.isArray(node["@type"]));
    expect(game).toMatchObject({
      "@type": ["VideoGame", "WebApplication"],
      "@id": `${testOrigin}/ru/games/sphere-flick/#game`,
      name: getGameCopy("ru", "sphere-flick").name,
      inLanguage: "ru",
      isAccessibleForFree: true,
      playMode: "https://schema.org/SinglePlayer",
      numberOfPlayers: { "@type": "QuantitativeValue", value: 1 },
    });
    expect(game).not.toHaveProperty("aggregateRating");
    expect(game).not.toHaveProperty("review");
    expect(game).not.toHaveProperty("interactionStatistic");
    const breadcrumbs = graph["@graph"].find(
      (node) => node["@type"] === "BreadcrumbList",
    );
    expect(breadcrumbs).toMatchObject({
      itemListElement: [
        { position: 1, item: `${testOrigin}/ru/` },
        { position: 2, item: `${testOrigin}/ru/training/` },
        { position: 3, item: `${testOrigin}/ru/games/sphere-flick/` },
      ],
    });
  });

  it("links every library entry to its language-specific game document", () => {
    vi.stubEnv("SITE_URL", testOrigin);
    const graph = publicStructuredData("uz", "training");
    const page = graph["@graph"].find(
      (node) => node["@type"] === "CollectionPage",
    );
    expect(page).toMatchObject({
      inLanguage: "uz",
      mainEntity: {
        numberOfItems: 10,
        itemListElement: scenarioIds.map((id, index) => ({
          position: index + 1,
          url: `${testOrigin}/uz/games/${id}/`,
        })),
      },
    });
  });
});
