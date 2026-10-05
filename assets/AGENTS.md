# AGENTS.md

Additional guidance for files inside `assets/`.

## CSS
- Keep new styles near related sections in `styles.css`.
- Reuse the tokens in section 1 of `styles.css` (`--bg`, `--surface`, `--accent`, `--status-*`) and avoid one-off colors.
- Respect the motion budget: the intro, the orbit, and scroll reveals. Don't add new looping animation.
- Make shared UI responsive and respect reduced-motion preferences when animation is added.

## JavaScript
- Keep `script.js` framework-free and progressively enhanced.
- All app data comes from `apps.json` through the renderers in `script.js`. Escape every value with `esc()`, and pass URLs through `safeUrl()`.
- Guard DOM lookups so scripts fail safely on pages that do not use a feature.

## Assets
- Store app icon files in `assets/app-icons/`: square, about 384px, under about 150KB.
- `apps.json` is also written by bots (`store-watch.yml`, the template's `register-website.yml`). Keep it as 2-space JSON so their diffs stay small.
- Prefer lightweight SVG or optimized raster assets for shared website UI.
