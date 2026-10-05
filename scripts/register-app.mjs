#!/usr/bin/env node
// Adds an app to assets/apps.json, or refreshes its identity fields. Called by the
// template's register-website.yml workflow (run from each app repo) against a clone of
// this repo, so the catalog schema stays owned here, next to validate-apps.mjs.
//
// Usage:
//   node scripts/register-app.mjs --meta meta.json [--icon path/to/icon.png]
//                                 [--summary out.md]
//
// meta.json: { slug, name, tagline, color?, bundleId?, androidPackage?, status?, repo? }
//
// New app      → appended with status "coming-soon" (or meta.status), store URLs null.
// Existing app → only name, tagline, color, icon, bundleId, androidPackage and platforms are
//                refreshed. Status, store URLs, beta link and page copy are never touched:
//                those belong to the store watcher and to humans.
// In GitHub Actions it also writes `changed` and `title` to $GITHUB_OUTPUT.

import { readFileSync, writeFileSync, copyFileSync, existsSync, statSync, appendFileSync, unlinkSync } from 'node:fs';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FILE = resolve(ROOT, 'assets/apps.json');
// Registration only announces apps; "released" is set by the store watcher once a listing exists.
const STATUSES = ['in-development', 'coming-soon'];
const ICON_WARN_BYTES = 300 * 1024;

const args = process.argv.slice(2);
const arg = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : null);

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

const metaPath = arg('--meta');
if (!metaPath) fail('--meta <file> is required');
const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
const iconSrc = arg('--icon');
const summaryPath = arg('--summary');

// ── Validate the incoming metadata ──────────────────────────────
const clean = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);
const slug = clean(meta.slug);
const name = clean(meta.name);
const tagline = clean(meta.tagline);

if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) fail(`slug must be lowercase kebab-case, got "${meta.slug}"`);
if (!name) fail('name is required');
if (!tagline) fail('tagline is required (IDEA.md → Tagline)');
for (const [k, v] of Object.entries({ slug, name, tagline })) {
  if (/\[[A-Z_]+\]/.test(v)) fail(`${k} still holds a template placeholder: ${v}`);
}
const status = meta.status || 'coming-soon';
if (!STATUSES.includes(status)) fail(`status must be one of ${STATUSES.join(', ')}`);

const color = /^#[0-9a-f]{3,8}$/i.test(meta.color || '') ? meta.color : null;
const bundleId = clean(meta.bundleId);
const androidPackage = clean(meta.androidPackage);
const platforms = [bundleId && 'ios', androidPackage && 'android'].filter(Boolean);

// ── Icon ───────────────────────────────────────────────────────
const notes = [];
let icon = null;
let iconFileChanged = false;
if (iconSrc) {
  if (!existsSync(iconSrc)) fail(`icon not found: ${iconSrc}`);
  const ext = extname(iconSrc).toLowerCase() || '.png';
  icon = `assets/app-icons/${slug}${ext}`;
  const dest = resolve(ROOT, icon);
  const same = existsSync(dest) && readFileSync(dest).equals(readFileSync(iconSrc));
  if (!same) copyFileSync(iconSrc, dest);
  iconFileChanged = !same;
  const size = statSync(dest).size;
  if (size > ICON_WARN_BYTES) {
    notes.push(`⚠️ \`${icon}\` is ${Math.round(size / 1024)} KB. Consider resizing it to about 384px (\`sips -Z 384 ${icon}\`).`);
  }
}

// ── Upsert ─────────────────────────────────────────────────────
const data = JSON.parse(readFileSync(FILE, 'utf8'));
const privacyPage = `privacy-${slug}.html`;
const hasPrivacyPage = existsSync(resolve(ROOT, privacyPage));
const existing = data.apps.find((a) => a.slug === slug);
const previousIcon = existing ? existing.icon : null;
const changes = [];
let title;

if (!existing) {
  if (!icon) fail('a new app needs --icon <file>');
  data.apps.push({
    slug,
    name,
    tagline,
    status,
    color,
    icon,
    platforms: platforms.length ? platforms : ['ios', 'android'],
    bundleId,
    androidPackage,
    appStoreUrl: null,
    playStoreUrl: null,
    betaUrl: null,
    privacyUrl: hasPrivacyPage ? privacyPage : null,
    releasedAt: null,
    featured: false,
  });
  title = `feat(catalog): add ${name} as ${status}`;
  changes.push(`- Added **${name}** (\`${slug}\`) as \`${status}\`.`);
} else {
  const next = { name, tagline, color, icon, bundleId, androidPackage };
  if (platforms.length) next.platforms = platforms;
  if (!existing.privacyUrl && hasPrivacyPage) next.privacyUrl = privacyPage;
  for (const [key, value] of Object.entries(next)) {
    if (value == null) continue; // never blank a field we could not read
    if (JSON.stringify(existing[key]) !== JSON.stringify(value)) {
      changes.push(`- \`${key}\`: \`${JSON.stringify(existing[key])}\` → \`${JSON.stringify(value)}\``);
      existing[key] = value;
    }
  }
  title = `chore(catalog): refresh ${name}`;
  if (changes.length) changes.unshift(`Refreshed **${name}** (\`${slug}\`). Its status (\`${existing.status}\`) is unchanged.`);
}

// An icon whose extension changed leaves the old file behind; remove it if nothing else uses it.
if (existing && icon && previousIcon && previousIcon !== icon && previousIcon.startsWith('assets/app-icons/') &&
    !data.apps.some((a) => a.icon === previousIcon) && existsSync(resolve(ROOT, previousIcon))) {
  unlinkSync(resolve(ROOT, previousIcon));
  changes.push(`- Removed the old icon file \`${previousIcon}\`.`);
}

// A new icon at the same path still needs a PR, even though apps.json is unchanged.
if (existing && iconFileChanged && !changes.some((c) => c.includes('`icon`'))) {
  if (!changes.length) changes.push(`Refreshed **${name}** (\`${slug}\`). Its status (\`${existing.status}\`) is unchanged.`);
  changes.push(`- Updated the icon file \`${icon}\`.`);
}

if (changes.length) writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n');

const source = meta.repo ? ` from [\`${meta.repo}\`](https://github.com/${meta.repo})` : '';
const summary = changes.length
  ? `## Register app\n\n${changes.join('\n')}\n${notes.length ? '\n' + notes.join('\n') + '\n' : ''}\n` +
    `Opened by \`register-website.yml\`${source}. Once this merges, the daily store watcher will flip it to released when it appears on the App Store.\n`
  : `${name} is already up to date in the catalog.\n`;

console.log(summary);
if (summaryPath) writeFileSync(summaryPath, summary);
if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changes.length > 0}\ntitle=${title.replace(/[\r\n]/g, ' ')}\n`);
}
