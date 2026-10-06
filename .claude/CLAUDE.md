# CLAUDE.md

This repository uses a lightweight instruction profile for safe website updates.

For canonical rules used by Copilot, see:
- .github/copilot-instructions.md

## Workflow
1. Check `git status` and current branch before editing.
2. Never work directly on `main`; use `feat/*`, `fix/*`, or `docs/*`.
3. Keep changes minimal and limited to requested files.
4. Open a PR to `main` with clear summary and file list.

## Editing constraints
- Preserve existing visual style unless redesign is requested.
- Reuse existing CSS and avoid unnecessary dependencies.
- Keep HTML accessible and external links safe (`noopener noreferrer`).
- Do not modify unrelated files.

## Safety
- Do not use destructive git commands without explicit approval.
- Do not revert user edits that were not part of the requested task.
