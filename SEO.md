# Multilingual search configuration

AimForge has 65 statically rendered public pages in English (`en`), Spanish (`es`), German (`de`), Russian (`ru`) and Uzbek Latin (`uz`). Every game has a separate page in each language, for 50 game pages. The app stays local until an authorized deployment.

## Public URL structure

| Page             | Example local URL                             |
| ---------------- | --------------------------------------------- |
| Home             | `http://127.0.0.1:4173/en/`                   |
| Training library | `http://127.0.0.1:4173/en/training/`          |
| Game guide       | `http://127.0.0.1:4173/en/games/flick-burst/` |
| Help and privacy | `http://127.0.0.1:4173/en/help/`              |

Replace `en` with any supported language. All ten scenario IDs have game guides. Each guide contains substantive translated text, gameplay screenshots, controls, scoring, requirements, tips, questions and a link into the playable setup. The library links directly to these guides. Language links preserve the current page or game.

The HTML includes the complete public content, heading, localized document language, title and description before JavaScript runs. JavaScript adds filters and screenshot galleries. Client-only progress and settings are not search content. No user history enters the generated pages, metadata, structured data or sitemap.

## Domain configuration

No domain is assumed. Copy `.env.example` to `.env.local` and set `SITE_URL` when an actual public domain is available. It must be an HTTPS origin with no credentials, path, query or fragment. An optional trailing slash is accepted. Invalid values fail the build rather than emitting incorrect canonicals.

PowerShell example for a future domain (replace the placeholder):

```powershell
$env:SITE_URL = 'https://your-domain.example'
npm.cmd run build
npm.cmd run test:seo
```

The variable is read during the build. Changing it requires rebuilding. It does not need a `NEXT_PUBLIC_` prefix, and it does not upload the app or contact that domain.

| Build state               | Behavior                                                                                                                                      |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `SITE_URL` unset or empty | Public pages use `noindex, follow`; robots disallows crawling; sitemap has no URLs; no invented canonical/hreflang/social URLs                |
| Valid `SITE_URL`          | Public pages use `index, follow`; self-canonicals, reciprocal `en/es/de/ru/uz` and `x-default` links, absolute social images and sitemap URLs |
| Personal app pages        | Always `noindex, follow`, outside the sitemap, with no public social metadata                                                                 |

The `x-default` link points to the English equivalent. Each language page is self-canonical. Setup, arena, results, dashboard, history, routines, achievements, challenges, settings and onboarding are excluded from indexing. Original unprefixed app paths remain usable and `noindex`; public entries use the language-prefixed paths.

## Search metadata and discovery

- Unique translated titles and descriptions for all 65 public pages.
- Correct static `<html lang>` and crawlable language links, without language redirects.
- Open Graph and Twitter summary images using actual gameplay screenshots.
- Structured data for the website, public pages, game collection, breadcrumbs and individual games (`VideoGame` / `WebApplication`). No ratings, reviews or player counts are fabricated.
- `/sitemap.xml` includes all public pages, reciprocal language alternatives and both screenshots for every game guide.
- `/robots.txt` references the sitemap only when a public origin is configured.
- Missing URLs must return HTTP 404. Exported pages use directory indexes; a global 200-status SPA fallback would create soft 404s and must not be enabled.

`scripts/build-offline.mjs` also creates flat aliases for Next's Windows-exported nested RSC segment files. This keeps link prefetching and navigation working on static hosts, including nested localized routes.

## Verification

```sh
npm test
npm run build
npm run test:seo
npm run test:e2e
```

The artifact audit parses exported HTML without executing JavaScript. It checks all public pages and a cross-language sample of personal pages, including headings, content, screenshot files, play links, language alternatives, JSON-LD, robots and sitemap. Use the same `SITE_URL` for the build and audit. Browser tests exercise all five languages without JavaScript and a complete localized play flow, language switching, filtering, mobile layout and static asset requests.

For a future public launch, deploy the configured `out/` directory to that HTTPS origin, verify real HTTP responses, then submit `/sitemap.xml` in the site's verified search-console property. Search engines decide whether and when to index pages; these changes make individual game pages eligible for discovery but do not guarantee indexing or rankings. A localhost-only app cannot appear in public search.

Implementation references: [Google localized page guidance](https://developers.google.com/search/docs/specialty/international/localized-versions), [Google JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics), [Google noindex guidance](https://developers.google.com/search/docs/crawling-indexing/block-indexing), [Next.js static export](https://nextjs.org/docs/app/guides/static-exports).
