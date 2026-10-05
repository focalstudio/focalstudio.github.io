# CHANGELOG.md

All notable changes to this repository will be documented in this file.

## 2026-10-05

### Added
- Dark "optical lab" redesign: aperture brand mark and favicon, Geist / Geist Mono / Instrument Serif type, and design tokens in `assets/styles.css`.
- Hero **app orbit**: app icons circle the aperture logo on tilted rings, with released apps inside and coming-soon apps on the dashed outer ring. It has depth, pauses on hover or focus, sleeps when off-screen, and stays static with reduced motion.
- One-time **lens-focus intro** (once per session, skipped with reduced motion).
- `assets/apps.json`: the single source of truth for every app surface. `app.html?app=<slug>` renders any app's page from it.
- `apps.html` catalog with status filters, plus home stats and pipeline counts computed from the data.
- `scripts/validate-apps.mjs` and the `validate.yml` workflow.
- `scripts/check-stores.mjs` and the daily `store-watch.yml` workflow. It opens a PR when an app appears on the App Store under the studio's developer account (`studio.appStoreDeveloperIds`). Google Play is not watched.
- Unlinked "Coming soon on Google Play" badge on released Android apps until `playStoreUrl` is set by hand.
- `scripts/register-app.mjs`, the catalog side of the template's `register-website.yml` workflow.
- `.claude/skills/site-apps` project skill for editing catalog entries with Claude Code.

### Changed
- `app-wildfocus.html` is now a redirect to `app.html?app=wildfocus`.
- WildFocus now links to its real App Store listing; the placeholder Google Play link is gone.
- Vestia's tagline now describes the actual app (rules-based investing), and its IDs are now `com.focalstudio.vestia`. The old `com.vestia.app` belongs to another developer's App Store app (focalstudio/vestia-portfolio-manager#71).
- App icons resized to 384px (4.6 MB → 0.45 MB).
- README rewritten around the automated catalog workflow.

### Removed
- The scrolling app ticker strip (replaced by the orbit).

## 2026-05-06

### Added
- Added a global three-lane app carousel strip to all site pages, powered by shared app metadata in `assets/script.js`.
- Added dedicated app icon storage under `assets/app-icons/` with the first shared `WildFocus` SVG icon.
- Added `AGENTS.md` at the repository root and `assets/AGENTS.md` for directory-specific agent guidance.
- Added `README.md` with repository overview, editing workflow, validation notes, and carousel image update instructions.

### Changed
- Updated `apps.html` with stable anchor targets so shared catalog links can jump to the correct app and status sections.
- Extended `assets/styles.css` with shared carousel layout, responsive behavior, hover/focus treatment, and reduced-motion handling.
- Seeded the carousel and `apps.html` with placeholder app entries so each lane can be tested with multiple items.
- Updated hash-based app navigation so carousel links recenter the target app card within the viewport on `apps.html`.
- Switched the carousel to smaller square image-only tiles, pointed WildFocus at the real JPEG asset, and replaced visible placeholder cards with commented templates.
- Simplified carousel and catalog headings, and resized the lane layout so In Dev and Coming Soon show one tile at a time while Released uses the remaining space.

### Fixed
- Fixed broken footer copyright markup in `app-wildfocus.html` and `privacy-policy.html`.
- Added cache-busting query strings to shared CSS and JS includes so carousel updates do not get stuck behind stale browser assets.
