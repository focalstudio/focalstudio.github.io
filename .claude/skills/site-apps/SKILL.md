---
name: site-apps
description: Add, update, announce or release an app on the Focal Studio website catalog (assets/apps.json). Use when asked to add an app to the site, change an app's status, tagline, icon, store or beta link, or write an app page's features, screenshots, or problem/solution copy.
---

# Editing the Focal Studio app catalog

Every app surface on the site renders from `assets/apps.json`: the hero orbit, the catalog cards, `app.html?app=<slug>`, the stats, and the beta bar. **Never hand-write app markup in the HTML pages.**

## Steps
1. Work on a `feat/*` or `docs/*` branch, never `main`.
2. Edit the app's entry in `assets/apps.json`. Keep 2-space JSON formatting, because bots write this file too.
3. Icons go in `assets/app-icons/<slug>.png`, square. Resize big sources with `sips -Z 384 <file>`.
4. Run `node scripts/validate-apps.mjs`. It must pass.
5. Preview with `python3 -m http.server 8000`, then open `/` and `/app.html?app=<slug>`.
6. Open a PR to `main`.

## Schema (see README → "Editing an app by hand" for the full example)
- **Required:** `slug` (kebab-case), `name`, `tagline`, `status`, `icon`, `platforms` (`ios`, `android`).
- **`status`:** `in-development` (set `betaUrl` to show "In beta"), `coming-soon`, or `released`. A released app needs `appStoreUrl` or `playStoreUrl`.
- **Store keys:** `bundleId` and `androidPackage` are what `store-watch.yml` looks up. Leave `appStoreUrl` and `playStoreUrl` as `null`; the watcher fills them and flips the status.
- **App page:** the optional `detail` object holds `problem` and `solution` (arrays of paragraphs), `features` (`{icon, title, text}`), `screenshots` (`{src, alt}`, with alt text required), and `tech` (key/value map).
- **Featured:** `featured: true` gives the wide home card with peeking screenshots. Use it for one app at a time.
- **Studio identity:** the top-level `studio` block holds the developer IDs the store watcher trusts. Only change it if the developer account changes.

## Copy voice
Short, calm, and concrete. The studio's principles are privacy-first, one thing done well, and honest by default. Don't claim "no analytics" or "no accounts" for an app unless its privacy policy says so.
