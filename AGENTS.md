# AGENTS.md

Repository guidance for coding agents working in `fpmartinez10.github.io`.

## Project
- Static marketing site for Focal Studio.
- Stack: plain HTML, CSS, and JavaScript with no build step.
- Prioritize small, reviewable changes that preserve the existing visual language.

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
- Preserve existing visual style unless redesign is requested.
- Reuse existing CSS and avoid unnecessary dependencies.
- Keep HTML accessible and external links safe (`noopener noreferrer`).
- Do not modify unrelated files.

## Safety
- Do not use destructive git commands without explicit approval.
- Do not revert user edits that were not part of the requested task.

## Validation
- Confirm only intended files changed with `git diff --name-only`.
- Manually verify edited pages on desktop and mobile.
- Check navigation, footer links, and any shared UI added across pages.
