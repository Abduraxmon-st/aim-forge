# AimForge

A local-first aim trainer built with **Next.js App Router, React and strict TypeScript**. The user's later Next.js instruction supersedes the original brief's Vite/React Router stack. Next generates a static export; the application has no backend, account system, database, analytics service, remote fonts or runtime asset service.

## Run

Requires Node.js 22.14 or newer and npm. The exact installed package tree is committed in `package-lock.json`.

```sh
npm ci
npm run dev         # http://127.0.0.1:3000
npm run type-check
npm run lint
npm test
npm run build       # Next static export + generated offline cache manifest
npm run test:seo    # audit rendered HTML, language links, sitemap and metadata
npm run preview     # http://127.0.0.1:4173
npm run test:e2e    # install Chromium first: npx playwright install chromium
```

`out/` is the complete deployable application. It must be served over HTTP locally or HTTPS in production, not opened with `file://`. No server process is needed on a static host. `npm run preview` is a convenience local file server, not a hardened production server.

## Product

- Five Canvas modes: Flick Burst, Micro Precision, Moving Clicks, Smooth Tracking, Reaction Tap.
- Five actual Three.js modes: Sphere Flick, Precision Range, Strafe Tracking, Reactive Tracking, Target Switching.
- Home, searchable/filterable library, scenario setup, arena, results, analytics, history, daily challenges, routines, achievements, settings, optional onboarding and help/privacy.
- A two-column desktop library with two actual gameplay screenshots per scenario, swipeable galleries, keyboard controls and a single-column mobile layout. Recreate the local assets with `node scripts/capture-training.mjs` while the preview is running.
- Favorite games appear first in the library and within matching search/filter results. Both groups retain their normal catalog order, and the order updates immediately when a favorite changes.
- Custom dropdowns, radio choices, checkboxes and calendar date filters. Minimal charts format axes, tooltips and summaries to no more than three decimal places.
- Valid settings edits save automatically, with visible pending/saved state. Invalid edits keep the last valid stored value. Settings and backups are scoped to the current browser and origin; the development and preview ports have separate profiles.
- Shared Sonner notifications match the app's dark surfaces and accent colors. Saves, modal confirmations, exports, favorites, routines and sharing report their actual outcome. Achievement notifications use the earned badge's own icon and color. Rapid settings edits update one toast; keyboard access, hover/focus pause and reduced motion are supported in all five languages.
- Help & Privacy includes a compact section menu that becomes horizontally scrollable on mobile. Routine and scenario actions align at the bottom of their cards.
- Beginner/intermediate/advanced presets; 30/60/120-second rounds; ten reaction trials; favorites and repeat-last-scenario.
- Seeded daily 2D/3D challenges, editable built-in routines and a routine builder, local milestones, crosshair editor, target palettes, audio controls and manual rotation calibration.
- A trophy room with 25 achievements: 20 visible milestones and five secrets whose names and requirements appear after unlocking. Category/status filters, real progress bars, a next-milestone card and accessible detail dialogs make the collection easy to explore. Individual medallion icons, gentle hover/entry animations and a brief unlock notification respect both system and in-app reduced-motion preferences.
- JSON backup with validated replacement preview, recovery export, CSV export, locally rendered PNG results, copyable text, native sharing when supported and bounded friend-challenge URLs.
- Complete English, Spanish, German, Russian and Uzbek Latin UI catalogs. Localization parity and interpolation placeholders have automated coverage. Browser preferences select a supported language; this does not affect date grouping.
- Search-ready public home, training library, help and ten game guides in each language: 65 public pages, including 50 individual game pages. Guides include real screenshots, controls, scoring, device requirements and practice tips in the initial HTML. Language links keep the same game; URL language takes priority over saved preferences.
- Installable static PWA with explicit offline preparation. Both engines and all generated route/chunk resources are cached when preparation completes. No unvisited engine is claimed available before that.

No accounts, global rankings, fabricated histories, online player counts, cloud sync, replay storage or competitive verification are provided. Empty profiles start empty. AimForge is a working name; no domain or trademark availability claim is made.

## Architecture

`src/app` provides the Next route entrypoints and client shell. All known routes are generated at build time. Scenario setup has ten static paths; arena and result identifiers travel as validated query parameters so static hosting can refresh these pages. Missing/compacted result IDs have an explicit empty state.

`src/seo` provides authored translations, public pages, structured data, metadata and sitemap generation. Existing app URLs remain available in the `(app)` route group. The five explicit language roots under `(site)` set the correct HTML language during static rendering and include localized play routes. Each localized tree has an isolated translation instance, preventing parallel static renders from leaking languages into each other. Public content renders before browser storage loads; personal progress remains client-only and excluded from search indexing.

`src/engine/core` owns the state machine, monotonic clock, frame scheduler, audio lifecycle and input. `canvas2d` and `three3d` own rendering, spawning, movement and collision detection. The Three.js engine and analytics screen are loaded on demand. React renders pages and HUD snapshots at about 13 Hz; it does not drive the simulation. Zustand contains only low-frequency application state.

`src/domain` owns types, Zod schemas and pure metrics, dates, comparisons, goals, aggregation and streak logic. `src/storage` is the only user-data persistence layer. `src/features` contains individual product screens. Recharts draws analytics with tabular alternatives. Tailwind is available alongside semantic design-token CSS.

Use `notify.success`, `notify.error`, `notify.info` or `notify.loading` from `src/components/notifications.tsx` for future action feedback. Pass translation keys and a stable `id` to update an existing notification. The shared viewport lives in each root layout so ordinary route changes preserve feedback. Native dialogs can mount a scoped `ToastViewport` and pass its `scope` to keep notifications above their backdrop. A short-lived, same-tab session-storage message carries successful settings/import/reset feedback through full language navigations; it contains no training data. Canceled actions stay silent and failures never report success.

State transitions are enforced: `idle → loading → ready → countdown → running → finished`. Loading/ready/countdown/running may abort; countdown/running may pause; paused resumes through a fresh countdown or aborts; failures may move to error and then abort. Finished and aborted are terminal. New rounds create new engines and IDs. Terminal emission and session commits are independently idempotent. Strict Mode cleanup cancels frames, removes listeners, closes audio contexts, releases pointer lock and disposes graphics resources.

## Controls and timing

2D uses a 960 × 600 logical arena with centered letterboxing. Pointer coordinates use the canvas bounding rectangle and the same scale/offset as rendering. Targets are circles at every pixel ratio. Discrete input uses only primary `pointerdown`; the start/resume button is outside the canvas. Touch and mouse are separate input classes; switching during a run pauses it. Multi-touch secondary contacts do not fire.

Tracking requires holding the primary action on the target. Releasing does not remove exposure from the denominator. Reaction trials timestamp the animation frame that paints the cue, then use the input event's monotonic observation time. Reaction includes browser/device/display effects and is not a lab latency measurement. Acquisition time measures spawn-to-hit and is distinct.

The simulation uses fixed 1/120-second steps, including fractional completion of the last step. RAF controls rendering only. Mouse deltas are degrees per reported mouse count, never multiplied by elapsed time. Vertical FOV is explicit. Pitch is clamped, roll is zero, smoothing is opt-in. Raw movement is requested only if enabled, and reported confirmed only if the promise-based request resolves successfully; legacy or fallback capture is not called raw input.

3D requests pointer capture following the Start/Resume gesture. The pointer-lock-change event is authoritative. Escape, hidden tabs, window blur, lock loss, WebGL context loss and gaps exceeding 250 ms pause immediately and clear held input. No hidden/paused/loading/countdown time is scored. Interrupted benchmarks continue as practice and cannot win or set benchmark records. Fullscreen is optional and independent of pointer capture. A real center-camera ray is intersected against targets **and blocking geometry** after world matrices update; only the nearest object can score.

## Metrics and goals (version 1)

| Metric           | Definition                                                                     |
| ---------------- | ------------------------------------------------------------------------------ |
| Click accuracy   | `100 × hits / shots`                                                           |
| Hits per second  | `hits / activeSeconds`                                                         |
| Click score      | `max(0, 100 × hits − 25 × misses)`                                             |
| Tracking percent | `100 × onTargetWhileFiringMs / eligibleExposureMs`                             |
| Tracking score   | `round(1000 × onTargetWhileFiringMs / eligibleExposureMs)`                     |
| Reaction score   | `max(0, round(1000 − medianReactionMs − 100 × falseStarts − 100 × timeouts))`  |
| 2D center error  | Radial hit distance divided by target radius                                   |
| 3D center error  | Shortest distance from the center ray to target center divided by world radius |

Zero denominators display an unavailable marker. Click misses, target expiration, false starts, timeouts and tracking gaps are distinct. Expiration breaks 2D hit combos. Tracking never manufactures shots or click accuracy. Distribution arrays retain at most the first 256 observations; medians and interpolated percentiles are exact for this bounded sample, not full unretained events. Monthly medians are not manufactured from session medians. The results page explains these limits.

For 60-second beginner click rounds the hit goals are 50 for Flick Burst/Sphere Flick, 35 for Micro Precision, 40 for Moving Clicks, 30 for Precision Range, and 45 hits for Target Switching. Intermediate adds 15 hits and advanced adds 30; duration scales the goal proportionally. Required accuracy is 80/85/90%. Tracking goals are 60/70/80% with exposure for at least 95% of the round. Reaction requires at least eight valid responses, zero false starts/timeouts and a median ≤450/380/310 ms. All goals are shown before play. They are application-defined goals, not validated professional ranks.

Comparison keys include scenario/configuration/scoring versions, difficulty, duration/trials, input, target geometry, movement settings, FOV, palette, smoothing, run category and daily challenge identity. Ordinary random seeds and sensitivity are excluded from the key; sensitivity is retained as context. Standard/daily eligible records are saved separately from practice/custom attempts. Local record claims are editable and unverified.

Rule-based practice notes require five comparable retained eligible sessions and compare the latest three with the prior two. Accuracy/tracking windows pool counts and exposure before calculating percentage-point differences. They are descriptive observations and do not diagnose fatigue, prescribe sensitivity or promise competitive improvement.

## Dates, goals, routines and streaks

UTC timestamps plus the training timezone and its start-date/month keys are frozen per run. Crossing midnight does not split a session. Changing language or timezone does not rewrite previous dates. Daily challenges use `hash('daily-v1' + UTC-date + dimension)` with the documented Mulberry32 v1 PRNG. They reset at 00:00 UTC and use fixed daily geometry/FOV/palette. Device rendering is not claimed identical.

- Training-day streak: consecutive local dates meeting that day's frozen completed-training target; default 180 seconds. Pending today preserves a valid yesterday streak. Calendar arithmetic handles leap years and daylight-saving transitions.
- Challenge win streak: eligible standard attempts only. A completed loss, interrupted benchmark or abandonment after active timing resets it. Exiting before active play, ordinary practice and daily attempts do not change it.
- Hit combo: consecutive discrete hits inside one round; a miss/2D expiration breaks it.

Routine component sessions each count once. Rest never counts as active training. The next step and rest deadline are persisted; an abandoned round is retried, not claimed exactly restored. Preset names are localized; user-created routine names remain user data.

## Storage, retention and conflicts

The single authoritative snapshot is `aimforge:data:v2`. The optional pre-replacement recovery snapshot is `aimforge:recovery:v2`. Zod validates all reads and imports. Unsupported schemas and corrupt JSON are surfaced without silently resetting. The schema migration boundary is explicit; schema 2 is the initial public format and unknown earlier formats are rejected rather than guessed.

Retain at most 500 detailed sessions, heatmaps for the latest 20, daily aggregates for 24 months and monthly aggregates for 60 months. Older totals remain in a compact all-time bucket, and eligible personal records remain compactly stored. The approximate 3 MiB soft budget includes potential recovery overhead; actual browser quota may be lower. Early compaction is allowed under pressure. Export before compaction; exports cannot reconstruct expired details.

**Accounting invariant:** retained sessions and archived aggregate buckets are disjoint source sets. Moving a session into an archived day removes its detail exactly once. Daily and monthly caches rebuild from those sources and are never added back as input. Archived challenge streak state is a prefix; retained results apply after it. Session IDs prevent duplicate commits while retained, and an archived start-time watermark rejects stale late commits instead of counting them again. Older aggregate details cannot be merged ambiguously; imports replace after preview and confirmation.

Web Locks serialize read-modify-write operations, re-reading the current snapshot inside the lock. One training lock is held for the round's lifetime. Browsers without Web Locks use a best-effort expiring training lease with continuous ownership checks; loss pauses the run. The fallback is **not a database transaction**: simultaneous writes without Web Locks cannot have the same atomic guarantees. Revision checks reject detectable stale writes. Storage events refresh idle tabs. Imports and resets preserve a recovery snapshot before replacement. Failed `setItem` leaves the last authoritative snapshot intact and exposes the unsaved result for export/retry. Recovery overhead is bounded; ordinary subsequent writes may release the recovery copy.

Completed time/weighted accuracy/tracking analytics derive from raw totals, never averages of percentages. Input classes remain separate on dashboard series. All-time combined totals can include very old data whose per-input/day breakdown has expired; older-than-retention range details are unavailable and not invented.

Achievement evidence is recorded before session compaction. Earned IDs and relevant best results, explored modes, palettes and qualifying days survive retention; counts and practice time use disjoint retained/archived totals. Aborted or zero-active rounds do not earn milestones. Existing schema-2 profiles and backups load with defaults for the new compact evidence field, and old earned IDs stay unlocked. New skill awards are backfilled from retained detailed sessions; information already discarded by an older version is not reconstructed or invented.

## Backup, sharing and offline

All seven Settings data actions use styled, translated dialogs with keyboard support, cancellation and visible errors. JSON imports are capped at 6 MiB, schema/range/ID/consistency validated, previewed and confirmed. Export dialogs explain their format before download; CSV contains retained summaries only. Clear history, reset-all and compaction each explain what will change before confirmation. A damaged snapshot can be exported and then explicitly replaced with a valid backup. Sharing is opt-in and only includes the chosen result, optional nickname and challenge ID. Friend links include a bounded validated versioned configuration and seed, never session history or an internal user ID. Native sharing and Clipboard API failures leave selectable text.

`scripts/build-offline.mjs` fingerprints the static output and writes a versioned service worker and complete file list. Initial installation caches a small shell only. Settings → Prepare both engines offline downloads all exported pages and assets. A ready marker is written only after every required resource succeeds. Updates do not call `skipWaiting` automatically; an explicit Settings action activates and reloads between sessions. Service-worker caches contain application assets, not user progress.

## Static deployment

The delivered app remains local. For a future authorized release, build with `npm ci && npm run build`, then publish `out/` at the origin root. Next emits directory-style `index.html` routes (`trailingSlash: true`). Configure the host to serve each directory index and return HTTP 404 with `404.html` for unknown routes. Known routes refresh without a server rewrite. The source `_redirects` uses a 404 fallback; do not replace missing pages with a 200-status home page. Query strings on arena/results routes do not require a backend. HTTPS is required for production service workers and browser clipboard capabilities. Sites configuration, when used, declares `static.directory: "out"`.

Set the optional `SITE_URL` build variable to the real HTTPS origin before a public release. Until then, public pages have `noindex`, robots disallows crawling, and the sitemap is empty. With a configured domain, the build enables public indexing and emits absolute canonical URLs, reciprocal language alternatives, social images and a 65-page sitemap. Personal app routes stay `noindex`. See [SEO.md](SEO.md) for configuration, URL coverage and verification. Setting a domain or building does not publish anything.

Official implementation references: [Next.js static exports](https://nextjs.org/docs/app/guides/static-exports), [Three.js Raycaster](https://threejs.org/docs/pages/Raycaster.html), [WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html), [MDN pointer lock](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API).

## Verification and limits

See `QA.md` for executed checks and outstanding manual validation. Unit tests cover metric definitions, comparison rules, deterministic RNG/dailies, calendar boundaries, streaks, lifecycle timing, 60/144 Hz equivalence, compaction, corrupted/full storage, stale revisions, duplicate writes and localization parity. Component tests cover actual library filtering. Browser tests exercise actual Canvas/WebGL routes, persistence, failed capability paths, routines, localization, mobile layout, imports and offline use.

Hardware-dependent raw mouse input, real display latency, high-refresh performance, mobile touch hardware, Safari/Firefox and browser install UI still require device-specific manual checks. FPS is measured, not promised. Optional cosmetic XP and long persistent replays are intentionally omitted. All interface localization is present, but fluent human language review is recommended before public release.
