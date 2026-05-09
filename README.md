# Focal Studio Website

Static marketing website for Focal Studio, published with GitHub Pages.

## Overview
- Stack: plain HTML, CSS, and JavaScript.
- No build step, framework, or package manager is required.
- Main purpose: present the studio, list apps, link to app details, and host the privacy policy.

## Site Structure
- `index.html`: homepage.
- `apps.html`: app catalog with Released, In Development, and Coming Soon sections.
- `app-wildfocus.html`: detail page for WildFocus.
- `contact.html`: contact links.
- `privacy-policy.html`: privacy policy page.
- `assets/styles.css`: shared site styles.
- `assets/script.js`: shared interactive behavior, including the global app carousel data and renderer.
- `assets/app-icons/`: shared carousel icon assets.
- `assets/screenshots/`: screenshots used on app detail pages.
- `docs/issue-drafts/`: draft implementation notes and issue writeups.

## Local Preview
Because this is a static site, you can preview it with any simple local server from the repo root.

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Editing Workflow
- Check repo state before editing: `git status --short --branch`.
- Never work directly on `main`; use `feat/*`, `fix/*`, or `docs/*`.
- Keep changes minimal and scoped to the request.
- Preserve the existing visual style unless a redesign is requested.
- Reuse existing CSS and avoid unnecessary dependencies.
- Keep HTML accessible and external links safe with `rel="noopener noreferrer"`.
- Do not modify unrelated files.

## Important Repo Files
- `AGENTS.md`: repo-wide instructions for coding agents and contributors.
- `assets/AGENTS.md`: extra guidance for shared CSS, JS, and image assets.
- `CHANGELOG.md`: notable repository changes.
- `CLAUDE.md`: existing lightweight instruction profile kept in the repo.

## Global App Carousel
The global app carousel appears near the top of every page and is rendered from shared metadata in `assets/script.js`.

### How it works
- App entries live in `FOCAL_STUDIO_APPS`.
- Lane definitions live in `FOCAL_STUDIO_APP_LANES`.
- Each app is assigned a `status`:
  - `released`
  - `in-development`
  - `coming-soon`
- The renderer injects the carousel into every page section marked with `data-app-carousel`.
- Links should point to stable anchors in `apps.html`.

### How to update carousel images
1. Add the new icon file to `assets/app-icons/`.
2. Prefer a square asset. PNG is the expected default, but JPEG, SVG, and other common web image formats also work.
3. Update the matching app entry in `FOCAL_STUDIO_APPS` inside `assets/script.js`.
4. Set the `icon` field to the new file path, for example `assets/app-icons/my-app.svg`.
5. Make sure the `href` points to a stable target in `apps.html`, such as `apps.html#app-my-app`.
6. If the target does not exist yet, add an `id` to the correct app card or section in `apps.html`.

The carousel currently shows image tiles only, without app names, so the icon should read clearly at small square sizes.

Example:

```js
var FOCAL_STUDIO_APPS = [
  {
    id: 'app-wildfocus',
    name: 'WildFocus',
    status: 'released',
    href: 'apps.html#app-wildfocus',
    icon: 'assets/app-icons/wildfocus.jpeg'
  },
  {
    id: 'app-my-app',
    name: 'My App',
    status: 'coming-soon',
    href: 'apps.html#app-my-app',
    icon: 'assets/app-icons/my-app.png'
  }
];
```

### How to add or move an app in the carousel
1. Add or update the app entry in `FOCAL_STUDIO_APPS`.
2. Set `status` to `released`, `in-development`, or `coming-soon`.
3. Add or update the corresponding content in `apps.html`.
4. If it is a released app, add the card and any detail page it should link to.
5. If it is not yet released, ensure there is still a stable anchor in `apps.html` for the carousel link target.

## Validation Checklist
- Confirm only intended files changed: `git diff --name-only`.
- Run `git diff --check`.
- Manually verify desktop and mobile layout for edited pages.
- Check navigation, footer links, and shared components like the carousel.
- Respect reduced-motion behavior when changing animated UI.
- If shared CSS or JS changes do not appear in the browser, bump the cache-busting query string on shared asset URLs.

## Current Content Notes
- WildFocus is the only real released app currently represented in the repo content.
- The carousel uses image-only square tiles and can work with PNG, JPEG, or SVG app icons.
- `apps.html` includes commented templates for released, in-development, and coming-soon entries so new apps can be added quickly.
