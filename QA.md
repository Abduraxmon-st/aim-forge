# Verification record

This document distinguishes executed automated checks from manual checks that still require real hardware.

## Executed during implementation

- Strict TypeScript compilation and Next.js static route generation.
- Unit/component tests for scoring, timing, input geometry, dates, storage and localization.
- Browser visual capture of home, library, setup, settings, and a 390-pixel mobile home. No browser page errors in those captures.
- English, Spanish, German, Russian and Uzbek catalog coverage and interpolation checks.

## Final integration checks

On 2026-09-23, Windows, Node.js 22.14.0:

| Command              | Result                                                                |
| -------------------- | --------------------------------------------------------------------- |
| `npm run type-check` | Passed, strict TypeScript                                             |
| `npm run lint`       | Passed, no reported lint errors                                       |
| `npm test`           | **78 passed**, 12 test files                                          |
| `npm run build`      | Passed; 186 generated Next.js pages/routes, 1,182 precached resources |
| `npm run test:seo`   | Passed; 2,615 local artifact checks                                   |
| `npm run test:e2e`   | **61 passed**, Chromium 153, approximately 7 minutes                  |

The browser suite completes every 2D and 3D mode, checks real Canvas hits and actual WebGL contexts, restores records after reload, checks pause-time exclusion and eligibility, exercises pointer-lock denial and missing WebGL2, validates language/favorites/routine persistence, rejects invalid imports, checks German mobile layouts, plays offline 2D and initializes offline 3D, enforces a single active training tab, and verifies raw-input fallback and context-loss pausing.

Visual inspection included the actual running Three.js arena at 1440 pixels, desktop pages, and a 390-pixel mobile home. The browser screenshots reported no page errors. No fabricated seed history is included.

An early duration-button accessibility label issue and a service-worker URL-encoding issue were found by browser tests and fixed. The complete final suite passed after those fixes.

The design update additionally verifies custom select keyboard navigation, first-open dropdown position without page scrolling, calendar selection/clearing on mobile, automatic settings persistence after navigation/reload, invalid-edit preservation, and the two-column screenshot carousels. Desktop routine action buttons share a baseline. Help, training, settings and custom dropdowns were visually inspected at desktop and mobile sizes with no page errors or horizontal overflow.

Chart visual QA used a disposable test profile and confirmed a raw `0.32938293829`-style value displays as `0.329`. All twenty game preview images come from the actual running engines; every scenario has two distinct frames. No visual QA dataset is shipped.

The multilingual SEO update additionally verifies all 65 public documents and 50 game guides directly from exported HTML without JavaScript. Checks cover document language, substantive localized text, unique titles/descriptions, playable setup links, both actual screenshot files, equivalent language links and JSON-LD. A configured build using the reserved test origin `https://seo-test.example.invalid` passed canonical, hreflang, Open Graph, sitemap and robots checks; this was a local build only. The delivered output was then rebuilt with no domain and passed local noindex checks. No test domain or public deployment is assumed.

Browser tests verify five languages with JavaScript disabled, a complete Spanish guide/setup/round/results flow, a Settings language change preserving saved profile edits after reload, same-game language switching and the German mobile layout. They also scroll every card in both localized and legacy libraries and verify actual Next prefetch responses for all guide/setup destinations. A Windows export filename mismatch found during visual review was fixed with nested RSC segment aliases. Those navigation paths now return no missing-asset responses or page errors.

Visual review covered English desktop home/game pages, a German game guide at 390 pixels and the Russian library at 390 pixels. No clipped headings, missing screenshots, hydration errors or document overflow were observed. The local HTTP server returned 200 for a game guide, robots and sitemap, an XML content type for sitemap, and a real 404 for an unknown game URL.

The achievements update adds unit coverage for all 25 awards, the five hidden conditions, aborted and zero-active rounds, archive boundaries, backward-compatible profiles and monotonic evidence retention. Browser verification covers empty and earned collections, hidden secret details, real-round unlock notifications, reload persistence, filters, keyboard modal behavior, browser and saved reduced-motion preferences, and German mobile layouts. The card grid follows its container: desktop checks at 620 pixels produce two columns and at 280 pixels produce one, without horizontal overflow.

All seven Settings data dialogs were visually checked across English, German, Russian, Spanish and Uzbek, including 320-pixel mobile layouts. The 35 combinations produced no horizontal overflow or browser page errors. Dialog bodies scroll independently so confirmation and cancellation stay visible in short windows. Automated data-action checks use isolated profiles and verify downloads, preview-before-replacement, recovery snapshots, cancellation, compaction, history clearing, full reset and failed-write preservation. Localized reset and import tests confirm the restored language route and recovery copy survive navigation. No browser alert or confirm call remains in the Settings feature.

Toast visual review covered success and modal-error states in all five languages, including 320-pixel widths. The ten cases had no page errors or horizontal overflow; modal feedback remained above the native dialog backdrop and global Settings feedback left the save bar accessible. A real completed round was used to inspect the achievement notification and its badge artwork. Notifications reuse one ID during rapid settings edits, preserve translated success feedback after full language navigation, and do not manufacture success for canceled actions or failed writes.

Toast browser tests verify autosave coalescing, focus preservation, keyboard dismissal, hover-paused expiration, failed-write errors, silent cancellation, modal layering, favorite/routine feedback, clipboard fallback, image downloads and saved reduced-motion preferences. The real-round achievement test checks the earned badge icon and the collection link.

The subsequent favorite-order update passed the existing library component test, targeted lint/format checks and a fresh production build. An isolated browser check verified immediate favorite-first ordering, stable catalog order within groups, search and dimension filtering, removal, reload persistence and the favorites-only filter, with no browser errors.

The static export is about 17.34 MiB uncompressed before ZIP packaging, including all language pages and offline resources. This is asset size, not a claimed frame-rate or latency result.

## Manual checks still required

- Physical mouse pointer lock and Escape behavior across Chromium, Firefox and Safari versions.
- Whether a specific OS/browser/device actually honors unadjusted movement; the app reports only confirmed requests.
- High-refresh displays and performance on lower-power hardware; no universal FPS guarantee.
- Physical touchscreen ergonomics and multi-contact behavior on supported mobile devices.
- PWA install prompts on each target browser/OS.
- Human review of Spanish, German, Russian and Uzbek translations.
- WebMCP registration in a browser implementing the proposed API. It is optional and feature-detected; ordinary browser operation does not depend on it.

## Data safety

Automated browser runs use isolated profiles. They do not seed fabricated records into the delivered app. A fresh profile remains empty. Test-generated data does not ship in `out/`.
