# AGENTS.md

Additional guidance for files inside `assets/`.

## CSS
- Keep new styles near related sections in `styles.css`.
- Reuse existing custom properties and avoid introducing one-off colors unless the feature genuinely needs them.
- Make shared UI responsive and respect reduced-motion preferences when animation is added.

## JavaScript
- Keep `script.js` framework-free and progressively enhanced.
- Prefer shared data/config for repeated UI content instead of duplicating hard-coded values across pages.
- Guard DOM lookups so scripts fail safely on pages that do not use a feature.

## Assets
- Store app icon files in `assets/app-icons/`.
- Prefer lightweight SVG or optimized raster assets for shared website UI.
