#!/usr/bin/env node
// Renders assets/brand/og-image.html → assets/brand/og-image.png (1200×630), the social
// preview every page points og:image at. Run it after the catalog changes:
//
//   node scripts/render-og.mjs
//
// No dependencies: serves the repo with a tiny static server and drives a local Chrome over
// the DevTools protocol. Set CHROME=/path/to/chrome if it isn't at the macOS default.

import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'assets/brand/og-image.png');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const server = createServer(async (req, res) => {
  try {
    const path = resolve(ROOT, '.' + decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!path.startsWith(ROOT)) throw new Error('outside root');
    const body = await readFile(path);
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    if (!res.headersSent) res.writeHead(404);
    res.end();
  }
}).listen(0, '127.0.0.1');
await new Promise((r) => server.once('listening', r));
const site = `http://127.0.0.1:${server.address().port}`;

const port = 9222 + Math.floor(Math.random() * 500);
const chrome = spawn(CHROME, ['--headless=new', '--hide-scrollbars', `--remote-debugging-port=${port}`,
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'og-'))}`, 'about:blank'], { stdio: 'ignore' });

try {
  let target;
  for (let i = 0; i < 50 && !target; i++) {
    await sleep(200);
    try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page'); } catch {}
  }
  if (!target) throw new Error(`Chrome did not start (CHROME=${CHROME})`);

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0; const pending = new Map();
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });

  await send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 630, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: `${site}/assets/brand/og-image.html` });
  for (let i = 0; i < 60; i++) {
    await sleep(250);
    const r = await send('Runtime.evaluate', { expression: 'window.__ogReady === true', returnByValue: true });
    if (r.result.result.value) break;
    if (i === 59) throw new Error('og-image.html never signalled ready');
  }
  const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1200, height: 630, scale: 1 } });
  await writeFile(OUT, Buffer.from(shot.result.data, 'base64'));
  console.log(`✓ wrote ${OUT}`);
  console.log('  Now bump the ?v= on og:image / twitter:image in the HTML pages — preview services cache by URL.');
  ws.close();
} finally {
  chrome.kill();
  server.close();
}
