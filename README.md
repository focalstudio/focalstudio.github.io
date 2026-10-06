# Focal Studio Website

The studio site and app catalog for Focal Studio, published with GitHub Pages at
https://focalstudio.github.io.

## Overview
- Stack: plain HTML, CSS, and JavaScript. There is no build step, framework, or package manager.
- Every app surface (the hero orbit, the catalog, the app pages, the stats) renders from **one file: `assets/apps.json`**.
- Adding, announcing, or releasing an app is a data change, never a markup change. Most of those changes are made by automation (see [How apps get onto the site](#how-apps-get-onto-the-site)).

## Site Structure
- `index.html`: homepage. Hero with the app orbit, catalog, studio principles, contact CTA.
- `apps.html`: the full catalog, with status filters.
- `app.html?app=<slug>`: the page for any app, generated from its `apps.json` entry.
- `app-wildfocus.html`: redirects to `app.html?app=wildfocus` so old links keep working.
- `contact.html`: contact links.
- `404.html`: branded "out of focus" page. GitHub Pages serves it at any unknown URL, so every path in it is absolute (`/assets/...`).
- `privacy-policy.html`, `privacy-<slug>.html`, `terms.html`: legal pages. These are self-contained and published by each app repo's `publish-privacy.yml`. **Do not restyle or hand-edit them.**
- `assets/apps.json`: the catalog data.
- `assets/styles.css`: the design system (tokens at the top).
- `assets/script.js`: the renderers (orbit, catalog, detail page, stats, beta bar).
- `assets/app-icons/`: app icons. Square, about 384px.
- `assets/brand/aperture.svg`: the aperture mark and favicon.
- `assets/brand/og-image.png`: the 1200×630 social preview every page points `og:image` at. Its source, `og-image.html`, reads `apps.json`. After the catalog changes, regenerate it with `node scripts/render-og.mjs` (needs only Node and Chrome).
- `scripts/validate-apps.mjs`: checks `apps.json`.
- `scripts/check-stores.mjs`: the store watcher.
- `scripts/register-app.mjs`: adds or refreshes one app. The template's `register-website.yml` calls it.
- `.github/workflows/`: `validate.yml` (catalog checks on every PR) and `store-watch.yml` (daily store check).

## Local Preview
`assets/apps.json` is loaded with `fetch`, so use a local server. Opening the files directly from disk won't work.

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## How apps get onto the site

```
 new app from focal-studio-app-template ──► register-website.yml (in the app repo)
                                              opens a PR here: status "coming-soon"
                                                          │  you merge
                                                          ▼
 app goes live on a store ──────────────────► store-watch.yml (daily, here)
                                              opens a PR here: status "released" + store link
                                                          │  you merge
                                                          ▼
                                              GitHub Pages publishes it
```

The bots only ever open PRs. Nothing merges without you.

### Statuses
| `status` | Shown as | Card CTA |
|---|---|---|
| `in-development` | In development, or **In beta** when `betaUrl` is set | "Join the beta" (also shows the beta bar on every page) |
| `coming-soon` | Coming soon | "Sneak peek": the app page with a "Notify me" email link |
| `released` | Out now | "View app": the app page with App Store / Google Play buttons |

### The store watcher
`store-watch.yml` runs `scripts/check-stores.mjs` every day at 07:17 UTC. It is free and needs no keys.

1. **App Store:** for each app with a `bundleId` and no `appStoreUrl`, it queries the public iTunes Lookup API.
2. **Ownership check:** a hit only counts if its developer ID is in `studio.appStoreDeveloperIds` in `apps.json`. Bundle IDs are not proof of ownership; another developer can hold the same ID. Listings under any other developer are reported and ignored.
3. **On a match:** the app gets `status: "released"`, its App Store URL and `releasedAt`. If the icon file is missing, the store icon is downloaded.

Never downgrades anything: if a listing disappears, the entry is left for you to decide.

**Google Play is not watched.** Its listings can't be checked reliably without scraping. A released app that lists `android` shows a dimmed, unlinked "Coming soon on Google Play" badge next to its App Store button. When it launches on Play, set `playStoreUrl` by hand and the badge becomes a real link.

Try it locally with `node scripts/check-stores.mjs --dry-run`, or run the workflow by hand from **Actions → Store watch → Run workflow** (it has a `dry_run` option).

**Credentials:** the PR is opened by the **Focal Studio Cross-Repo Bot**, using the org secrets `FOCALSTUDIO_BOT_APP_ID` and `FOCALSTUDIO_BOT_PRIVATE_KEY`, not by `GITHUB_TOKEN`. The org blocks `GITHUB_TOKEN` from creating PRs, and bot PRs also trigger `validate.yml`. No repo setting is needed. A dry run works without the secrets.

### Registering an app from its repo
The template ships `register-website.yml`, a reusable workflow, plus a stub that triggers it. It runs in the app's repo and:

1. reads the app's name, slug, bundle ID and package from `app.json`, its tagline and primary color from `IDEA.md`, and its icon;
2. clones this repo and runs `scripts/register-app.mjs`, then `scripts/validate-apps.mjs`;
3. opens or updates a PR from the `register/<slug>` branch.

A new app arrives as `coming-soon`. For an app that's already listed, only its identity fields (name, tagline, color, icon, IDs) are refreshed; its status, store links and page copy are never touched.

### Editing an app by hand
Edit its entry in `assets/apps.json`, then run `node scripts/validate-apps.mjs`. Fields:

```jsonc
{
  "slug": "mealcart",                 // URL id: app.html?app=mealcart
  "name": "MealCart",
  "tagline": "From recipe to shopping list in one tap.",
  "description": "Optional second sentence for the featured card and app page.",
  "status": "coming-soon",            // in-development | coming-soon | released
  "color": "#4E9A6E",                 // glow color around the icon
  "icon": "assets/app-icons/mealcart.png",
  "platforms": ["ios", "android"],
  "bundleId": "com.focalstudio.mealcart",       // App Store lookup key
  "androidPackage": "com.focalstudio.mealcart", // informational (Play is not watched)
  "appStoreUrl": null,                          // filled in by the store watcher
  "playStoreUrl": null,                         // set by hand when it launches on Play
  "betaUrl": null,                    // TestFlight / Play testing link
  "privacyUrl": "privacy-mealcart.html",
  "releasedAt": null,
  "featured": false,                  // the featured app gets the wide card with screenshots
  "detail": {                         // optional: richer app page
    "problem": ["…"], "solution": ["…"],
    "features": [{ "icon": "⏱️", "title": "…", "text": "…" }],
    "screenshots": [{ "src": "assets/screenshots/x.png", "alt": "…" }],
    "tech": { "Built with": "…" }
  }
}
```

With Claude Code, you can also just ask: the `site-apps` project skill (`.claude/skills/site-apps/`) knows this schema. For example, "write the feature list for MealCart" or "add a TestFlight link for StayLock".

## Design system
- **Look:** a dark "optical lab". Near-black glass, an aperture mark, Geist and Geist Mono, with Instrument Serif italic for accent words.
- **Tokens:** defined at the top of `assets/styles.css` (`--bg`, `--surface`, `--accent`, `--status-*`, …). Reuse them rather than adding one-off colors.
- **Motion budget:** one lens-focus intro (once per session, skipped for reduced motion), the slow app orbit, and fade-up on scroll. Nothing else loops.
- **The orbit:**
  - Shipped and beta apps sit on the inner ring; coming-soon apps sit on the dashed outer ring.
  - Each ring holds up to 6 apps. More apps automatically start a new ring.
  - It pauses on hover or focus, and stops when it's off-screen.
- **Cache-busting:** after changing shared CSS or JS, bump the `?v=` query string on the asset URLs in every page.

## Editing Workflow
- Check repo state before editing: `git status --short --branch`.
- Never work directly on `main`; use `feat/*`, `fix/*`, or `docs/*`.
- Keep changes minimal and scoped to the request.
- Keep HTML accessible, and keep external links safe with `rel="noopener noreferrer"`.

## Validation Checklist
- `node scripts/validate-apps.mjs` passes.
- `git diff --check` is clean, and only intended files changed (`git diff --name-only`).
- Check desktop and mobile (about 375px) for the pages you touched, including the orbit, the catalog, an app page, and the mobile nav.
- Check with reduced motion on (macOS: System Settings → Accessibility → Display → Reduce motion).
