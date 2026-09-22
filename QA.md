# Verification record

This document distinguishes executed automated checks from manual checks that still require real hardware.

## Executed during implementation

- Strict TypeScript compilation and Next.js static route generation.
- Unit/component tests for scoring, timing, input geometry, dates, storage and localization.
- Browser visual capture of home, library, setup, settings, and a 390-pixel mobile home. No browser page errors in those captures.
- English, Spanish, German, Russian and Uzbek catalog coverage and interpolation checks.

## Final integration checks

On 2026-09-22, Windows, Node.js 22.14.0:

| Command | Result |
| --- | --- |
| `npm run type-check` | Passed, strict TypeScript |
| `npm run lint` | Passed, no reported lint errors |
| `npm test` | **43 passed**, 9 test files |
| `npm run build` | Passed; 24 generated Next.js pages, 202 precached resources |
| `npm run test:e2e` | **23 passed**, Chromium 153, approximately 3.8 minutes |

The browser suite completes every 2D and 3D mode, checks real Canvas hits and actual WebGL contexts, restores records after reload, checks pause-time exclusion and eligibility, exercises pointer-lock denial and missing WebGL2, validates language/favorites/routine persistence, rejects invalid imports, checks German mobile layouts, plays offline 2D and initializes offline 3D, enforces a single active training tab, and verifies raw-input fallback and context-loss pausing.

Visual inspection included the actual running Three.js arena at 1440 pixels, desktop pages, and a 390-pixel mobile home. The browser screenshots reported no page errors. No fabricated seed history is included.

An early duration-button accessibility label issue and a service-worker URL-encoding issue were found by browser tests and fixed. The complete final suite passed after those fixes.

The design update additionally verifies custom select keyboard navigation, first-open dropdown position without page scrolling, calendar selection/clearing on mobile, automatic settings persistence after navigation/reload, invalid-edit preservation, and the two-column screenshot carousels. Desktop routine action buttons share a baseline. Help, training, settings and custom dropdowns were visually inspected at desktop and mobile sizes with no page errors or horizontal overflow.

Chart visual QA used a disposable test profile and confirmed a raw `0.32938293829`-style value displays as `0.329`. All twenty game preview images come from the actual running engines; every scenario has two distinct frames. No visual QA dataset is shipped.

The static export is about 3.27 MiB uncompressed before ZIP packaging. This is asset size, not a claimed frame-rate or latency result.

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
