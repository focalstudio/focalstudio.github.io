# AGENTS.md

Repository guidance for coding agents working in `fpmartinez10.github.io`.

## Project
- Static marketing site for Focal Studio.
- Stack: plain HTML, CSS, and JavaScript with no build step.
- Prioritize small, reviewable changes that preserve the existing visual language (dark "optical lab" system; tokens at the top of `assets/styles.css`).
- App content lives in `assets/apps.json` only. Never hard-code app cards or app pages; see README → "How apps get onto the site".
- Legal pages (`privacy-*.html`, `terms.html`) are self-contained and styled from the template's `store-listing/privacy-shell.html`. A page is generated only when its app repo runs the template's `publish-privacy.yml`, which opens a PR here; change those pages in the app repo. **Today no app does**, so `privacy-policy.html`, `terms.html` (WildFocus) and `privacy-mealcart.html` are all maintained here by hand. Keep their text and every `id` unchanged unless the request is about their content.

## Workflow
- Check `git status --short --branch` before editing.
- Never work on `main`; create or reuse `feat/*`, `fix/*`, or `docs/*` branches first.
- Keep diffs limited to the requested task and do not revert unrelated user changes.
- Open or prepare changes so they can be reviewed as a focused PR to `main`.

## Editing Rules
- Reuse existing patterns in `assets/styles.css` and `assets/script.js` before adding new structures.
- Keep HTML accessible, and keep external links safe with `rel="noopener noreferrer"` when opening new tabs.
- Do not add dependencies or a build step for simple UI work.
- Preserve content and design unless the request explicitly asks for a redesign.

## Editing constraints
- Preserve the existing visual style (design tokens in `assets/styles.css`) unless a redesign is requested.
- Reuse existing CSS and avoid unnecessary dependencies.
- Keep HTML accessible and external links safe (`noopener noreferrer`).
- Do not modify unrelated files.

## Safety
- Do not use destructive git commands without explicit approval.
- Do not revert user edits that were not part of the requested task.

## Validation
- Run `node scripts/validate-apps.mjs` after touching `assets/apps.json`.
- Confirm only intended files changed with `git diff --name-only`.
- Manually verify edited pages on desktop and mobile.
- Check navigation, footer links, and any shared UI added across pages.
