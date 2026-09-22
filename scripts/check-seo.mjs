import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import nextEnv from "@next/env";

// Match Next's production build, including SITE_URL configured in .env.local.
// An explicitly supplied process environment value keeps highest precedence.
nextEnv.loadEnvConfig(fileURLToPath(new URL("../", import.meta.url)), false);

// Inspect only the exported files. JSDOM does not execute scripts or fetch
// resources here: these checks verify what a crawler receives before hydration.
// Run with the same SITE_URL value that was used for npm run build.
const output = fileURLToPath(new URL("../out/", import.meta.url));
const locales = ["en", "es", "de", "ru", "uz"];
const games = [
  "flick-burst",
  "micro-precision",
  "moving-clicks",
  "smooth-tracking",
  "reaction-tap",
  "sphere-flick",
  "precision-range",
  "strafe-tracking",
  "reactive-tracking",
  "target-switching",
];
const howTo = {
  en: "How to play",
  es: "Cómo jugar",
  de: "So wird gespielt",
  ru: "Как играть",
  uz: "Qanday o‘ynaladi",
};
const paths = locales.flatMap((locale) => [
  { locale, suffix: "", path: `/${locale}/` },
  { locale, suffix: "training", path: `/${locale}/training/` },
  { locale, suffix: "help", path: `/${locale}/help/` },
  ...games.map((game) => ({
    locale,
    game,
    suffix: `games/${game}`,
    path: `/${locale}/games/${game}/`,
  })),
]);
const failures = [];
let checks = 0;
function check(condition, message) {
  checks++;
  if (!condition) failures.push(message);
}
function same(actual, expected, message) {
  check(
    actual === expected,
    `${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
  );
}
function normalize(text) {
  return (text ?? "").replace(/\s+/g, " ").trim();
}
function artifact(path) {
  return resolve(output, "." + path, "index.html");
}
async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
function pathname(href) {
  try {
    return new URL(href, "https://audit.invalid").pathname;
  } catch {
    return "";
  }
}
function typedNodes(value) {
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap(typedNodes);
  return [
    ...(value["@type"] ? [value] : []),
    ...Object.values(value).flatMap(typedNodes),
  ];
}
function hasType(node, type) {
  return Array.isArray(node["@type"])
    ? node["@type"].includes(type)
    : node["@type"] === type;
}
function languageUrls(suffix) {
  const tail = suffix ? suffix + "/" : "";
  return new Map([
    ...locales.map((locale) => [locale, `${origin}/${locale}/${tail}`]),
    ["x-default", `${origin}/en/${tail}`],
  ]);
}

const configured = process.env.SITE_URL?.trim();
let origin;
if (configured) {
  const url = new URL(configured);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    !/^https:\/\/[^/?#\\\s]+\/?$/i.test(configured)
  )
    throw new Error(
      "SITE_URL must match the HTTPS origin used for this build.",
    );
  origin = url.origin;
}
if (!(await exists(artifact("/en/")))) {
  throw new Error(
    "Localized build artifacts are missing. Run npm run build before node scripts/check-seo.mjs.",
  );
}

const titles = new Map();
const descriptions = new Map();
const gameTexts = new Map(games.map((game) => [game, new Set()]));
for (const entry of paths) {
  let dom;
  try {
    const html = await readFile(artifact(entry.path), "utf8");
    dom = new JSDOM(html);
    const document = dom.window.document;
    const main = document.querySelector("main");
    const title = normalize(
      document.querySelector("head > title")?.textContent,
    );
    const description = document
      .querySelector('meta[name="description"]')
      ?.getAttribute("content");
    const canonical = document.querySelectorAll('link[rel="canonical"]');
    const alternates = document.querySelectorAll(
      'link[rel="alternate"][hreflang]',
    );
    const robots = document.querySelector('meta[name="robots"]')?.content ?? "";
    const h1 = document.querySelectorAll("h1");
    const context = entry.path;
    same(document.documentElement.lang, entry.locale, `${context} server lang`);
    same(
      document.querySelectorAll("head > title").length,
      1,
      `${context} title count`,
    );
    check(
      title.length > 10,
      `${context} needs a descriptive initial-HTML title`,
    );
    check(
      typeof description === "string" && description.length > 50,
      `${context} needs a substantive meta description`,
    );
    check(
      !titles.has(title),
      `${context} duplicates the title from ${titles.get(title)}`,
    );
    check(
      !descriptions.has(description),
      `${context} duplicates the description from ${descriptions.get(description)}`,
    );
    titles.set(title, context);
    descriptions.set(description, context);
    same(h1.length, 1, `${context} H1 count`);
    check(
      normalize(h1[0]?.textContent).length > 3,
      `${context} H1 must contain text`,
    );
    check(Boolean(main), `${context} needs a semantic main element`);
    const copy = (main ?? document.body).cloneNode(true);
    copy
      .querySelectorAll("script, style, template")
      .forEach((node) => node.remove());
    const bodyText = normalize(copy.textContent);
    check(
      bodyText.length > 400,
      `${context} lacks readable content before JavaScript`,
    );

    const anchorPaths = new Set(
      [...document.querySelectorAll("a[href]")].map((anchor) =>
        pathname(anchor.getAttribute("href")),
      ),
    );
    for (const locale of locales) {
      const alternatePath = `/${locale}/${entry.suffix ? entry.suffix + "/" : ""}`;
      check(
        anchorPaths.has(alternatePath),
        `${context} lacks a crawlable ${locale} language-switch anchor to ${alternatePath}`,
      );
    }

    if (origin) {
      check(
        /(?:^|,\s*)index(?:,|$)/.test(robots),
        `${context} must be indexable`,
      );
      check(!robots.includes("noindex"), `${context} unexpectedly has noindex`);
      same(canonical.length, 1, `${context} canonical count`);
      same(
        canonical[0]?.getAttribute("href"),
        origin + context,
        `${context} canonical`,
      );
      same(alternates.length, 6, `${context} hreflang count`);
      const expectedAlternates = languageUrls(entry.suffix);
      for (const [language, url] of expectedAlternates) {
        const matches = [...alternates].filter(
          (link) => link.getAttribute("hreflang") === language,
        );
        same(matches.length, 1, `${context} ${language} hreflang count`);
        same(
          matches[0]?.getAttribute("href"),
          url,
          `${context} ${language} alternative`,
        );
      }
      same(
        document.querySelector('meta[property="og:url"]')?.content,
        origin + context,
        `${context} Open Graph URL`,
      );
      check(
        document
          .querySelector('meta[property="og:image"]')
          ?.content?.startsWith(origin + "/training/"),
        `${context} Open Graph preview must use an actual bundled gameplay image`,
      );
    } else {
      check(
        robots.includes("noindex"),
        `${context} local-only export must be noindex`,
      );
      same(canonical.length, 0, `${context} local-only canonical count`);
      same(alternates.length, 0, `${context} local-only hreflang count`);
      check(
        !document.querySelector('meta[property="og:url"]'),
        `${context} local-only export must not invent an Open Graph URL`,
      );
    }
    same(
      document.querySelector('meta[property="og:title"]')?.content,
      title,
      `${context} Open Graph title`,
    );
    same(
      document.querySelector('meta[property="og:description"]')?.content,
      description,
      `${context} Open Graph description`,
    );

    const scripts = [
      ...document.querySelectorAll('script[type="application/ld+json"]'),
    ];
    check(scripts.length > 0, `${context} lacks initial-HTML JSON-LD`);
    const nodes = scripts.flatMap((script) =>
      typedNodes(JSON.parse(script.textContent)),
    );
    check(
      nodes.some((node) => hasType(node, "WebSite")),
      `${context} lacks WebSite data`,
    );
    const page = nodes.find(
      (node) => hasType(node, "WebPage") || hasType(node, "CollectionPage"),
    );
    same(page?.inLanguage, entry.locale, `${context} structured page language`);
    same(
      page?.description,
      description,
      `${context} structured page description`,
    );
    if (origin) {
      const breadcrumbs = nodes.filter((node) =>
        hasType(node, "BreadcrumbList"),
      );
      if (!entry.suffix) {
        same(breadcrumbs.length, 0, `${context} homepage breadcrumb count`);
        check(
          !page?.breadcrumb,
          `${context} homepage must not reference breadcrumbs`,
        );
      } else {
        same(breadcrumbs.length, 1, `${context} breadcrumb count`);
        for (const breadcrumb of breadcrumbs)
          check(
            Array.isArray(breadcrumb.itemListElement) &&
              breadcrumb.itemListElement.length >= 2,
            `${context} BreadcrumbList must contain at least two items`,
          );
      }
      same(page?.url, origin + context, `${context} structured page URL`);
    }

    if (entry.game) {
      check(bodyText.length > 900, `${context} lacks a substantive game guide`);
      check(
        [...document.querySelectorAll("h2, h3")].some(
          (heading) => normalize(heading.textContent) === howTo[entry.locale],
        ),
        `${context} lacks localized how-to instructions`,
      );
      gameTexts.get(entry.game).add(bodyText);
      check(
        anchorPaths.has(`/${entry.locale}/setup/${entry.game}/`),
        `${context} lacks a playable game setup link`,
      );
      for (const frame of [1, 2]) {
        const imagePath = `/training/${entry.game}-${frame}.jpg`;
        const images = [...document.querySelectorAll("img[src]")].filter(
          (image) => pathname(image.getAttribute("src")) === imagePath,
        );
        check(images.length > 0, `${context} lacks gameplay image ${frame}`);
        check(
          images.some(
            (image) => normalize(image.getAttribute("alt")).length > 8,
          ),
          `${context} gameplay image ${frame} needs descriptive alt text`,
        );
        check(
          await exists(resolve(output, "." + imagePath)),
          `${context} screenshot asset is missing: ${imagePath}`,
        );
      }
      const game = nodes.find((node) => hasType(node, "VideoGame"));
      check(Boolean(game), `${context} lacks VideoGame data`);
      check(
        game && hasType(game, "WebApplication"),
        `${context} lacks browser application type`,
      );
      same(
        game?.inLanguage,
        entry.locale,
        `${context} structured game language`,
      );
      same(
        game?.description,
        description,
        `${context} structured game description`,
      );
      same(game?.isAccessibleForFree, true, `${context} free game flag`);
      for (const property of [
        "aggregateRating",
        "review",
        "interactionStatistic",
      ])
        check(!game?.[property], `${context} must not manufacture ${property}`);
      if (origin) {
        same(game?.url, origin + context, `${context} structured game URL`);
        same(game?.screenshot?.length, 2, `${context} structured screenshots`);
      } else {
        check(
          !game?.url && !game?.["@id"],
          `${context} local-only game must not invent public identifiers`,
        );
      }
    }
  } catch (error) {
    failures.push(`${entry.path}: ${error.message}`);
  } finally {
    dom?.window.close();
  }
}
for (const [game, copies] of gameTexts)
  same(copies.size, 5, `${game} must have five different language versions`);
same(titles.size, 65, "Unique public page titles");
same(descriptions.size, 65, "Unique public page descriptions");

let privateCount = 0;
for (const prefix of ["", ...locales]) {
  for (const route of [
    "dashboard",
    "history",
    "settings",
    "arena",
    "results",
    "setup/flick-burst",
  ]) {
    const path = `/${prefix ? prefix + "/" : ""}${route}/`;
    let dom;
    try {
      dom = new JSDOM(await readFile(artifact(path), "utf8"));
      const robots =
        dom.window.document.querySelector('meta[name="robots"]')?.content ?? "";
      check(
        robots.includes("noindex"),
        `${path} personal/session route must stay noindex`,
      );
      check(
        !dom.window.document.querySelector("link[hreflang]"),
        `${path} private route must not advertise search alternates`,
      );
      privateCount++;
    } catch (error) {
      failures.push(`${path}: ${error.message}`);
    } finally {
      dom?.window.close();
    }
  }
}
for (const path of [
  "/en/games/not-a-game/",
  "/fr/games/flick-burst/",
  "/en/setup/not-a-game/",
])
  check(
    !(await exists(artifact(path))),
    `${path} must not generate a fallback page`,
  );

const xml = new JSDOM(await readFile(resolve(output, "sitemap.xml"), "utf8"), {
  contentType: "application/xml",
});
const urlNodes = [
  ...xml.window.document.getElementsByTagNameNS(
    "http://www.sitemaps.org/schemas/sitemap/0.9",
    "url",
  ),
];
const robotsText = await readFile(resolve(output, "robots.txt"), "utf8");
if (origin) {
  same(urlNodes.length, 65, "Sitemap public document count");
  const expected = new Set(paths.map((entry) => origin + entry.path));
  const found = new Set();
  let illustratedGames = 0;
  for (const node of urlNodes) {
    const loc = node.getElementsByTagNameNS(
      "http://www.sitemaps.org/schemas/sitemap/0.9",
      "loc",
    )[0]?.textContent;
    check(
      expected.has(loc),
      `Sitemap contains a noncanonical, unknown or personal URL: ${loc}`,
    );
    check(!found.has(loc), `Sitemap duplicates ${loc}`);
    found.add(loc);
    const entry = paths.find((entry) => origin + entry.path === loc);
    const alternatives = [
      ...node.getElementsByTagNameNS("http://www.w3.org/1999/xhtml", "link"),
    ];
    same(alternatives.length, 6, `${loc} sitemap hreflang count`);
    if (entry) {
      for (const [locale, url] of languageUrls(entry.suffix)) {
        const matches = alternatives.filter(
          (link) => link.getAttribute("hreflang") === locale,
        );
        same(matches.length, 1, `${loc} sitemap ${locale} count`);
        same(
          matches[0]?.getAttribute("href"),
          url,
          `${loc} sitemap ${locale} URL`,
        );
      }
      const images = [
        ...node.getElementsByTagNameNS(
          "http://www.google.com/schemas/sitemap-image/1.1",
          "image",
        ),
      ];
      if (entry.game) {
        illustratedGames++;
        same(images.length, 2, `${loc} sitemap screenshot count`);
        for (const [index, image] of images.entries())
          same(
            image.getElementsByTagNameNS(
              "http://www.google.com/schemas/sitemap-image/1.1",
              "loc",
            )[0]?.textContent,
            `${origin}/training/${entry.game}-${index + 1}.jpg`,
            `${loc} sitemap screenshot ${index + 1}`,
          );
      } else same(images.length, 0, `${loc} unexpected game screenshots`);
    }
  }
  same(illustratedGames, 50, "Sitemap game entries with screenshots");
  same(found.size, 65, "Sitemap unique canonical documents");
  check(
    /^Allow:\s*\/\s*$/m.test(robotsText),
    "Configured robots.txt must allow crawling",
  );
  check(
    !/^Disallow:\s*\/\s*$/m.test(robotsText),
    "Configured robots.txt must not block noindex metadata discovery",
  );
  check(
    robotsText.includes(`Sitemap: ${origin}/sitemap.xml`),
    "robots.txt must name the configured sitemap",
  );
} else {
  same(
    urlNodes.length,
    0,
    "Local-only sitemap must be empty until a domain is configured",
  );
  check(
    /^Disallow:\s*\/\s*$/m.test(robotsText),
    "Local-only robots.txt must disallow crawling",
  );
  check(
    !/^Sitemap:/m.test(robotsText),
    "Local-only robots.txt must not invent a sitemap origin",
  );
}
xml.window.close();

if (failures.length) {
  console.error(
    `SEO artifact audit failed: ${failures.length} failures across ${checks} checks.`,
  );
  for (const message of failures.slice(0, 40)) console.error(`- ${message}`);
  if (failures.length > 40)
    console.error(`- ${failures.length - 40} additional failures omitted.`);
  process.exitCode = 1;
} else {
  console.log(
    `SEO artifact audit passed: 65 public pages, 50 localized games, ${privateCount} private routes, ${checks} checks (${origin ? "configured production origin" : "local-only without a domain"}).`,
  );
}
