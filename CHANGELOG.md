# CHANGELOG.md

All notable changes to this repository will be documented in this file.

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
