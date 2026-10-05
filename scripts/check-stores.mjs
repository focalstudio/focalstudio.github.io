#!/usr/bin/env node
// Store watcher: checks the public App Store listing for every app in assets/apps.json and
// records what it finds. Once an app shows up, it becomes "released", with its App Store
// URL and release date filled in.
//
// Free and keyless: the iTunes Lookup API is public. Google Play is deliberately not
// watched: its listings can't be checked reliably without scraping. Set `playStoreUrl` by
// hand; until then the site shows an unlinked Google Play badge for Android apps. Nothing is
// ever downgraded: a listing that disappears is left alone for a human to decide.
//
// Bundle IDs are not proof of ownership: another developer can hold the same ID (this
// happened with com.vestia.app). A hit only counts when its developer ID is listed in the
// `studio` block of apps.json; anything else is logged and ignored.
//
// Usage: node scripts/check-stores.mjs [--dry-run] [--summary <file>]
// In GitHub Actions it also writes `changed` and `title` to $GITHUB_OUTPUT.

import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FILE = resolve(ROOT, process.env.APPS_JSON || 'assets/apps.json');
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const summaryPath = args.includes('--summary') ? args[args.indexOf('--summary') + 1] : null;

const today = new Date().toISOString().slice(0, 10);
const data = JSON.parse(readFileSync(FILE, 'utf8'));
const studio = data.studio || {};
const appleIds = (studio.appStoreDeveloperIds || []).map(Number);
const changes = [];   // human-readable lines for the PR body
const warnings = [];  // listings found under someone else's name
const headlines = []; // short phrases for the PR title

async function get(url) {
  const res = await fetch(url, {
    redirect: 'manual',
    headers: { 'user-agent': 'focalstudio-store-watch (+https://focalstudio.github.io)' },
    signal: AbortSignal.timeout(20000),
  });
  return res;
}

async function lookupAppStore(bundleId) {
  const res = await get(`https://itunes.apple.com/lookup?bundleId=${encodeURIComponent(bundleId)}&country=us`);
  if (!res.ok) throw new Error(`iTunes lookup HTTP ${res.status}`);
  const json = await res.json();
  const hit = json.resultCount > 0 ? json.results[0] : null;
  if (!hit) return null;
  if (!appleIds.includes(Number(hit.artistId))) {
    return { foreign: `${hit.trackName} by ${hit.artistName} (developer ${hit.artistId})` };
  }
  return {
    url: String(hit.trackViewUrl || '').replace(/\?.*$/, ''),
    artwork: hit.artworkUrl512 || null,
    released: (hit.releaseDate || '').slice(0, 10) || null,
  };
}

async function downloadIcon(app, artworkUrl) {
  const res = await get(artworkUrl);
  if (!res.ok) throw new Error(`artwork HTTP ${res.status}`);
  const rel = `assets/app-icons/${app.slug}.jpg`;
  if (!DRY_RUN) writeFileSync(resolve(ROOT, rel), Buffer.from(await res.arrayBuffer()));
  return rel;
}

for (const app of data.apps) {
  const before = app.status;
  let found = false;

  if (app.bundleId && !app.appStoreUrl) {
    try {
      const hit = await lookupAppStore(app.bundleId);
      if (hit && hit.foreign) {
        warnings.push(`- **${app.name}**: App Store bundle ID \`${app.bundleId}\` belongs to ${hit.foreign}; ignored`);
      } else if (hit && hit.url) {
        app.appStoreUrl = hit.url;
        found = true;
        changes.push(`- **${app.name}** is live on the App Store: ${hit.url}`);
        if (!app.releasedAt && hit.released) app.releasedAt = hit.released;
        const iconMissing = !app.icon || !existsSync(resolve(ROOT, app.icon));
        if (iconMissing && hit.artwork) {
          app.icon = await downloadIcon(app, hit.artwork);
          changes.push(`  - Downloaded the store icon to \`${app.icon}\``);
        }
      } else {
        console.log(`· ${app.name}: not on the App Store yet`);
      }
    } catch (err) {
      console.warn(`! ${app.name}: App Store check failed (${err.message})`);
    }
  }

  if (found && app.status !== 'released') {
    app.status = 'released';
    if (!app.releasedAt) app.releasedAt = today;
    changes.push(`  - Status: \`${before}\` → \`released\` (${app.releasedAt})`);
  }

  if (found) headlines.push(`${app.name} is live on the App Store`);
  else if (!app.bundleId) console.log(`· ${app.name}: no bundleId, skipped`);
}

const changed = changes.length > 0;
const title = headlines.length ? headlines.join('; ') : 'No store changes';

if (changed && !DRY_RUN) writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n');

const summary = changed
  ? `## Store watch\n\n${changes.join('\n')}\n\nFound by the daily \`store-watch\` workflow. Check the listing, then merge to publish.\n` +
    (warnings.length ? `\n### Ignored\n\n${warnings.join('\n')}\n` : '')
  : 'No store changes.\n';

if (warnings.length) console.warn(`\nIgnored listings by other developers:\n${warnings.join('\n')}`);
console.log(`\n${DRY_RUN ? '[dry run] ' : ''}${title}`);
if (changed) console.log(changes.join('\n'));
if (summaryPath) writeFileSync(summaryPath, summary);
if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changed}\ntitle=${title.replace(/[\r\n]/g, ' ')}\n`);
}
