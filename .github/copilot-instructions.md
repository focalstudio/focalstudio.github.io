# Copilot Instructions

This file defines default working rules for updates to the `focalstudio.github.io` website.

## Project overview
- Static marketing website for Focal Studio.
- Stack: plain HTML/CSS/JS (no build step).
- Primary goal: small, safe, reviewable edits.

## Default workflow
1. Check repository state first (`git status`, `git branch --show-current`).
2. Do not commit directly to `main`.
3. Create or reuse a task branch:
   - `feat/<short-description>` for features
   - `fix/<short-description>` for bugs
   - `docs/<short-description>` for content/docs updates
4. Keep diffs minimal and scoped to the request.
5. Avoid touching unrelated files.
6. Open a PR to `main` with a concise summary and changed-file list.

## Editing rules
- Preserve existing layout, tone, and structure unless asked to redesign. Design tokens live at the top of `assets/styles.css`.
- App content lives in `assets/apps.json`. Do not hard-code app cards or pages, and validate with `node scripts/validate-apps.mjs`.
- Reuse existing CSS patterns before adding new classes.
- Keep CSS additions small and close to relevant sections.
- Use accessible HTML where possible (`aria-label`, meaningful link text).
- External links should use `target="_blank"` with `rel="noopener noreferrer"`.
- Do not introduce heavy dependencies for simple UI changes.

## Validation checklist
- Confirm only intended files changed (`git diff --name-only`).
- Manually verify desktop and mobile layout for edited pages.
- Check navigation/footer links still work after edits.
- Ensure no merge conflict markers remain.

## Safety rules
- Never run destructive git commands unless explicitly requested.
- Never revert user changes you did not create.
- If unrelated local modifications are present, keep them untouched and out of commits.

## Preferred response format
1. Plan
2. Branch name
3. Files changed
4. Implementation notes
5. Test/verification steps
6. Commit message suggestion
