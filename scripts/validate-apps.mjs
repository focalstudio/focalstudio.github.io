#!/usr/bin/env node
// Validates assets/apps.json, the single source of truth for the app catalog.
// No dependencies. Exits 1 with a list of problems, so CI and bot PRs fail loudly.
//
// Usage: node scripts/validate-apps.mjs [path/to/apps.json]

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FILE = resolve(ROOT, process.argv[2] || 'assets/apps.json');

const STATUSES = ['in-development', 'coming-soon', 'released'];
const PLATFORMS = ['ios', 'android'];
const errors = [];

let data;
try {
  data = JSON.parse(readFileSync(FILE, 'utf8'));
} catch (err) {
  console.error(`✗ ${FILE} is not valid JSON: ${err.message}`);
  process.exit(1);
}

if (!data || !Array.isArray(data.apps)) {
  console.error('✗ apps.json must be an object with an "apps" array');
  process.exit(1);
}

const isHttps = (u) => typeof u === 'string' && /^https:\/\/\S+$/.test(u);
const localFileExists = (p) => typeof p === 'string' && !/^[a-z]+:/i.test(p) && existsSync(resolve(ROOT, p));

const seen = new Set();

data.apps.forEach((app, i) => {
  const where = `apps[${i}]${app && app.slug ? ` (${app.slug})` : ''}`;
  const err = (msg) => errors.push(`${where}: ${msg}`);

  if (!app || typeof app !== 'object') return err('must be an object');

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(app.slug || '')) err('slug must be lowercase kebab-case');
  else if (seen.has(app.slug)) err('duplicate slug');
  else seen.add(app.slug);

  for (const field of ['name', 'tagline']) {
    if (typeof app[field] !== 'string' || !app[field].trim()) err(`${field} is required`);
  }

  if (!STATUSES.includes(app.status)) err(`status must be one of ${STATUSES.join(', ')}`);

  if (app.color != null && !/^#[0-9a-f]{3,8}$/i.test(app.color)) err('color must be a hex value like #4E9A6E');

  if (!localFileExists(app.icon)) err(`icon file not found: ${app.icon}`);

  if (!Array.isArray(app.platforms) || !app.platforms.length || app.platforms.some((p) => !PLATFORMS.includes(p))) {
    err(`platforms must be a non-empty array of ${PLATFORMS.join(', ')}`);
  }

  for (const field of ['appStoreUrl', 'playStoreUrl', 'betaUrl']) {
    if (app[field] != null && !isHttps(app[field])) err(`${field} must be an https URL or null`);
  }

  if (app.privacyUrl != null && !isHttps(app.privacyUrl) && !localFileExists(app.privacyUrl)) {
    err(`privacyUrl must be an https URL or an existing page: ${app.privacyUrl}`);
  }

  if (app.status === 'released' && !app.appStoreUrl && !app.playStoreUrl) {
    err('a released app needs appStoreUrl or playStoreUrl');
  }

  if (app.releasedAt != null && !/^\d{4}-\d{2}-\d{2}$/.test(app.releasedAt)) err('releasedAt must be YYYY-MM-DD or null');

  const shots = app.detail && app.detail.screenshots;
  if (shots != null) {
    if (!Array.isArray(shots)) err('detail.screenshots must be an array');
    else shots.forEach((s, j) => {
      if (!s || !localFileExists(s.src)) err(`detail.screenshots[${j}] file not found: ${s && s.src}`);
      if (!s || typeof s.alt !== 'string' || !s.alt.trim()) err(`detail.screenshots[${j}] needs alt text`);
    });
  }
});

if (errors.length) {
  console.error(`✗ ${errors.length} problem${errors.length > 1 ? 's' : ''} in ${FILE}:`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(`✓ ${data.apps.length} apps valid`);
