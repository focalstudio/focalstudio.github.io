/* script.js — Focal Studio
   Everything app-related renders from assets/apps.json, so adding or
   releasing an app is a data change, never a markup change. */

(function () {
  'use strict';

  /* Absolute: 404.html is served at arbitrary nested paths */
  var APPS_URL = '/assets/apps.json';
  var CONTACT_EMAIL = 'focalstudio.apps@gmail.com';
  var SITE_URL = 'https://focalstudio.github.io/';
  /* Guarded: scripts/build-app-pages.mjs loads this file in Node */
  var REDUCED_MOTION = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var STATUS = {
    'released':       { label: 'Out now',        order: 0 },
    'in-development': { label: 'In development', order: 1 },
    'coming-soon':    { label: 'Coming soon',    order: 2 }
  };

  var PLATFORM_LABEL = { ios: 'iPhone', android: 'Android' };

  var APPLE_SVG =
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/></svg>';

  var PLAY_SVG =
    '<svg width="20" height="20" viewBox="0 0 512 512" fill="currentColor" aria-hidden="true"><path d="M48 59.5v393C48 464 57 474 68.9 474l.1-.1 220-220L68.9 38C57 38 48 48 48 59.5zM321.7 207.3l-56.4-56.4 168.8-96.3c10.7-6.1 22.2-2.4 27.3 8.5L321.7 207.3zM265.3 361.1l56.4-56.4 149.7 85.4c-5.1 10.9-16.6 14.6-27.3 8.5L265.3 361.1zM289.4 256l56.3-56.3 56.3 56.3-56.3 56.3-56.3-56.3z"/></svg>';

  /* ── Helpers ──────────────────────────────────────────────── */

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* Only http(s), mailto and relative paths make it into an href/src */
  function safeUrl(url) {
    if (!url) return '';
    var u = String(url).trim();
    if (/^(https?:|mailto:)/i.test(u)) return u;
    if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return '';
    return u;
  }

  function safeColor(color) {
    return /^#[0-9a-f]{3,8}$/i.test(color || '') ? color : '';
  }

  function colorStyle(app) {
    var c = safeColor(app.color);
    return c ? '--app-color:' + c + ';' : '';
  }

  function statusLabel(app) {
    if (app.status === 'in-development' && app.betaUrl) return 'In beta';
    return (STATUS[app.status] || STATUS['coming-soon']).label;
  }

  /* Taglines are written without a full stop; add one when a description follows */
  function sentence(text) {
    var t = String(text || '').trim();
    return /[.!?…]$/.test(t) ? t : t + '.';
  }

  function pill(app) {
    return '<span class="pill pill--' + esc(app.status) + '">' + esc(statusLabel(app)) + '</span>';
  }

  /* The static page scripts/build-app-pages.mjs generates for each app */
  function detailHref(app) {
    return 'apps/' + encodeURIComponent(app.slug) + '.html';
  }

  /* Prefix relative URLs with root, so the same markup works one folder down */
  function local(url, root) {
    var u = safeUrl(url);
    return u && root && !/^([a-z][a-z0-9+.-]*:|\/|#)/i.test(u) ? root + u : u;
  }

  function sortApps(apps) {
    return apps.slice().sort(function (a, b) {
      var sa = (STATUS[a.status] || STATUS['coming-soon']).order;
      var sb = (STATUS[b.status] || STATUS['coming-soon']).order;
      if (sa !== sb) return sa - sb;
      if (!!b.featured !== !!a.featured) return b.featured ? 1 : -1;
      return String(b.releasedAt || '').localeCompare(String(a.releasedAt || '')) || a.name.localeCompare(b.name);
    });
  }

  function count(apps, status) {
    return apps.filter(function (a) { return a.status === status; }).length;
  }

  function storeButtons(app) {
    var html = '';
    var ios = safeUrl(app.appStoreUrl);
    var play = safeUrl(app.playStoreUrl);
    if (ios) {
      html += '<a class="btn btn-store" href="' + esc(ios) + '" target="_blank" rel="noopener noreferrer" aria-label="Download ' + esc(app.name) + ' on the App Store">' +
        APPLE_SVG + '<span><small>Download on the</small>App Store</span></a>';
    }
    if (play) {
      html += '<a class="btn btn-store" href="' + esc(play) + '" target="_blank" rel="noopener noreferrer" aria-label="Get ' + esc(app.name) + ' on Google Play">' +
        PLAY_SVG + '<span><small>Get it on</small>Google Play</span></a>';
    } else if (app.status === 'released' && (app.platforms || []).indexOf('android') !== -1) {
      /* Placeholder until playStoreUrl is set by hand: same badge, no link */
      html += '<span class="btn btn-store btn-store--soon" role="img" aria-label="' + esc(app.name) + ' is coming soon to Google Play">' +
        PLAY_SVG + '<span><small>Coming soon on</small>Google Play</span></span>';
    }
    return html;
  }

  /* In Node, hand the app page template to scripts/build-app-pages.mjs and stop */
  if (typeof module === 'object' && module.exports) {
    module.exports = { detailHtml: detailHtml, detailMeta: detailMeta, detailHref: detailHref, esc: esc, local: local, SITE_URL: SITE_URL };
    return;
  }

  /* ── Mobile navigation ────────────────────────────────────── */

  (function initNav() {
    var toggle = document.querySelector('.nav-toggle');
    var links = document.querySelector('.nav-links');
    if (!toggle || !links) return;

    toggle.addEventListener('click', function () {
      var isOpen = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  })();

  /* ── Scroll reveal ────────────────────────────────────────── */

  var revealObserver = null;

  function observeReveals(root) {
    var els = (root || document).querySelectorAll('.reveal:not(.is-visible)');
    if (!('IntersectionObserver' in window) || REDUCED_MOTION) {
      els.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px' });
    }
    els.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ── Catalog cards ────────────────────────────────────────── */

  function buildCard(app, index, opts) {
    var featured = opts.home && app.featured;
    var soon = app.status !== 'released';
    var platforms = (app.platforms || []).map(function (p) {
      return '<span class="chip">' + esc(PLATFORM_LABEL[p] || p) + '</span>';
    }).join('');

    var cta;
    if (app.status === 'in-development' && safeUrl(app.betaUrl)) {
      cta = '<a class="app-card-link accent" href="' + esc(safeUrl(app.betaUrl)) + '" target="_blank" rel="noopener noreferrer">Join the beta ↗</a>';
    } else if (soon) {
      cta = '<span class="app-card-muted">Sneak peek →</span>';
    } else {
      cta = '<span class="app-card-link">View app <span class="btn-arrow" aria-hidden="true">→</span></span>';
    }

    var peek = '';
    var shots = featured && app.detail && app.detail.screenshots;
    if (shots && shots.length) {
      peek = '<div class="app-card-peek" aria-hidden="true">' +
        shots.slice(0, 3).map(function (s) {
          return '<img src="' + esc(safeUrl(s.src)) + '" alt="" loading="lazy" />';
        }).join('') +
      '</div>';
    }

    return (
      '<article class="app-card reveal' + (featured ? ' app-card--featured' : '') + (soon ? ' is-soon' : '') + '"' +
        ' id="app-' + esc(app.slug) + '" data-status="' + esc(app.status) + '"' +
        ' style="' + colorStyle(app) + '--i:' + index + '">' +
        '<div class="app-card-top">' +
          '<img class="app-card-icon" src="' + esc(safeUrl(app.icon)) + '" alt="" width="64" height="64" loading="lazy" />' +
          pill(app) +
        '</div>' +
        '<div class="app-card-body">' +
          '<h3 class="app-card-name"><a class="app-card-cover" href="' + detailHref(app) + '">' + esc(app.name) + '</a></h3>' +
          '<p class="app-card-tagline">' + esc(app.tagline) + '</p>' +
          (featured && app.description ? '<p class="app-card-tagline">' + esc(app.description) + '</p>' : '') +
        '</div>' +
        '<div class="app-card-footer">' +
          '<div class="chips">' + platforms + '</div>' +
          cta +
        '</div>' +
        peek +
      '</article>'
    );
  }

  function renderCatalog(host, apps) {
    var home = host.getAttribute('data-catalog') === 'home';
    var sorted = sortApps(apps);

    if (!sorted.length) {
      host.innerHTML = '<p class="empty-state">New apps are on the way. Check back soon.</p>';
      return;
    }

    host.innerHTML = sorted.map(function (app, i) {
      return buildCard(app, i % 6, { home: home });
    }).join('');

    var filterHost = document.querySelector('[data-catalog-filters]');
    if (filterHost) renderFilters(filterHost, host, apps);
  }

  function renderFilters(filterHost, grid, apps) {
    var options = [
      { key: 'all', label: 'All', n: apps.length },
      { key: 'released', label: 'Out now', n: count(apps, 'released') },
      { key: 'in-development', label: 'In development', n: count(apps, 'in-development') },
      { key: 'coming-soon', label: 'Coming soon', n: count(apps, 'coming-soon') }
    ].filter(function (o) { return o.key === 'all' || o.n > 0; });

    filterHost.innerHTML = options.map(function (o) {
      return '<button type="button" class="filter" data-filter="' + o.key + '" aria-pressed="' + (o.key === 'all') + '">' +
        esc(o.label) + ' <span class="filter-count">' + o.n + '</span></button>';
    }).join('');

    filterHost.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-filter]');
      if (!btn) return;
      var key = btn.getAttribute('data-filter');
      filterHost.querySelectorAll('[data-filter]').forEach(function (b) {
        b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
      });
      grid.querySelectorAll('.app-card').forEach(function (card) {
        card.hidden = key !== 'all' && card.getAttribute('data-status') !== key;
      });
    });
  }

  /* ── Stats + pipeline counts ──────────────────────────────── */

  function renderStats(host, apps) {
    var stats = [
      { v: apps.length, l: 'Apps in the catalog' },
      { v: count(apps, 'released'), l: 'Out now' },
      { v: count(apps, 'in-development') + count(apps, 'coming-soon'), l: 'In the works' },
      { v: 'iOS + Android', l: 'Platforms' }
    ];
    host.innerHTML = stats.map(function (s) {
      return '<div class="stat"><span class="stat-value">' + esc(s.v) + '</span><span class="stat-label">' + esc(s.l) + '</span></div>';
    }).join('');
  }

  function renderCounts(apps) {
    document.querySelectorAll('[data-count]').forEach(function (el) {
      el.textContent = String(count(apps, el.getAttribute('data-count')));
    });
  }

  /* ── The lens ─────────────────────────────────────────────── */
  /* The aperture mark is a lens. Its focus ring is a dial with one marking
     per app: turn it and the apps come round on a drum behind a 9-blade
     diaphragm, and the lens racks focus onto each one, hunting a little
     before it locks. */

  var LENS_R = 40;                                  // iris circle, in the 100×100 viewBox
  var IRIS_CLOSED = 0.08, IRIS_OPEN = 0.84;         // aperture radius as a fraction of LENS_R
  var DRUM_STEP = 48;                               // degrees between apps on the drum
  var lensUid = 0;

  /* The spotlight: featured, then shipped, then the latest release, then
     the newest added. Rank by downloads or ratings here once apps.json has them. */
  function spotlightRank(a, b) {
    if (!!b.app.featured !== !!a.app.featured) return b.app.featured ? 1 : -1;
    var ra = a.app.status === 'released', rb = b.app.status === 'released';
    if (ra !== rb) return rb ? 1 : -1;
    return String(b.app.releasedAt || '').localeCompare(String(a.app.releasedAt || '')) || b.i - a.i;
  }

  /* Spotlight first, then newest added first (apps.json is append-only) */
  function lensOrder(apps) {
    var list = apps.map(function (app, i) { return { app: app, i: i }; });
    var spot = list.slice().sort(spotlightRank)[0];
    var rest = list.filter(function (x) { return x !== spot; }).sort(function (a, b) { return b.i - a.i; });
    return (spot ? [spot] : []).concat(rest).map(function (x) { return x.app; });
  }

  /* A 9-blade diaphragm, like a real lens: the opening is a 9-gon whose
     edges bow outward (curved blades), so it reads almost round wide open
     and stops down to a small polygon. */
  var BLADES = 9;
  var BLADE_BOW = 0.7;                              // 0 = straight blades, 1 = a circle

  function aperturePoints(r, rot) {
    var pts = [];
    for (var k = 0; k < BLADES; k++) {
      var a = (-90 + 360 / BLADES * k + rot) * Math.PI / 180;
      pts.push([50 + r * Math.cos(a), 50 + r * Math.sin(a)]);
    }
    return pts;
  }

  /* Control point that bows the edge v1→v2 outward */
  function bowControl(v1, v2, r) {
    var mx = (v1[0] + v2[0]) / 2, my = (v1[1] + v2[1]) / 2;
    var dx = mx - 50, dy = my - 50, apothem = Math.hypot(dx, dy) || 1;
    var target = apothem + BLADE_BOW * (r - apothem);
    return [50 + dx / apothem * (2 * target - apothem), 50 + dy / apothem * (2 * target - apothem)];
  }

  /* Each blade runs along an aperture edge, past the next vertex, to the rim */
  function irisShape(frac, id) {
    var r = LENS_R * frac;
    var rot = (1 - frac / IRIS_OPEN) * (180 / BLADES);   // blades twist as they open
    var v = aperturePoints(r, rot);
    var rim = v.map(function (p, k) {
      var n = v[(k + 1) % BLADES];
      var ux = n[0] - p[0], uy = n[1] - p[1], len = Math.hypot(ux, uy) || 1;
      ux /= len; uy /= len;
      var dx = p[0] - 50, dy = p[1] - 50, b = dx * ux + dy * uy;
      var t = -b + Math.sqrt(Math.max(0, b * b - (dx * dx + dy * dy - LENS_R * LENS_R)));
      return [p[0] + ux * t, p[1] + uy * t];
    });
    var f = function (p) { return p[0].toFixed(2) + ' ' + p[1].toFixed(2); };
    var defs = '', blades = '', seams = '', edges = '', clip = [];
    for (var k = 0; k < BLADES; k++) {
      var v1 = v[(k + 1) % BLADES], v2 = v[(k + 2) % BLADES], p1 = rim[k], p2 = rim[(k + 1) % BLADES];
      var c = bowControl(v1, v2, r);
      var g = id + 'b' + k;
      /* Matte black blade: a little light catches the inner edge and the rim */
      defs += '<linearGradient id="' + g + '" gradientUnits="userSpaceOnUse"' +
        ' x1="' + ((v1[0] + v2[0]) / 2).toFixed(2) + '" y1="' + ((v1[1] + v2[1]) / 2).toFixed(2) + '"' +
        ' x2="' + ((p1[0] + p2[0]) / 2).toFixed(2) + '" y2="' + ((p1[1] + p2[1]) / 2).toFixed(2) + '">' +
        '<stop offset="0" stop-color="#2B2B31"/><stop offset="0.3" stop-color="#151519"/>' +
        '<stop offset="0.85" stop-color="#0C0C0F"/><stop offset="1" stop-color="#1D1D22"/></linearGradient>';
      blades += '<path fill="url(#' + g + ')" d="M' + f(v1) + 'L' + f(p1) + 'A' + LENS_R + ' ' + LENS_R + ' 0 0 1 ' + f(p2) +
        'L' + f(v2) + 'Q' + f(c) + ' ' + f(v1) + 'Z"/>';
      seams += 'M' + f(v[k]) + 'L' + f(rim[k]);
      edges += 'M' + f(v1) + 'Q' + f(c) + ' ' + f(v2);
      for (var s2 = 0; s2 < 4; s2++) {
        var t2 = s2 / 4, u = 1 - t2;
        clip.push([u * u * v1[0] + 2 * u * t2 * c[0] + t2 * t2 * v2[0], u * u * v1[1] + 2 * u * t2 * c[1] + t2 * t2 * v2[1]]);
      }
    }
    return {
      defs: defs,
      blades: blades,
      seams: seams,
      edges: edges,
      clip: 'polygon(' + clip.map(function (p) { return p[0].toFixed(2) + '% ' + p[1].toFixed(2) + '%'; }).join(',') + ')'
    };
  }

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function smooth(a, b, v) { var t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); }
  function easeOut(p) { return 1 - Math.pow(1 - p, 3); }
  function easeOutBack(p) { var c = 1.25; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); }

  function easeInOut(p) { return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; }
  function wrapDelta(d, n) { d = ((d % n) + n) % n; return d > n / 2 ? d - n : d; }
  function mod(a, n) { return ((a % n) + n) % n; }
  function pad2(v) { return (v < 10 ? '0' : '') + v; }

  /* Focus-ring markings, one per app, clockwise from the top */
  function ringMarks(n) {
    var beta = 360 / n, every = Math.ceil(n / 24);
    var minor = beta >= 24 ? 4 : beta >= 12 ? 1 : 0;
    var p = function (a, r) {
      var t = a * Math.PI / 180;
      return (50 + r * Math.sin(t)).toFixed(2) + ' ' + (50 - r * Math.cos(t)).toFixed(2);
    };
    var major = '', small = '', labels = '';
    for (var i = 0; i < n; i++) {
      var a = i * beta;
      major += 'M' + p(a, 45.4) + 'L' + p(a, 47);
      for (var m = 1; m <= minor; m++) small += 'M' + p(a + beta * m / (minor + 1), 46.2) + 'L' + p(a + beta * m / (minor + 1), 47);
      if (i % every === 0) {
        labels += '<text class="lens-mark" data-mark="' + i + '" transform="rotate(' + a.toFixed(2) + ' 50 50)" x="50" y="7.75" text-anchor="middle">' + pad2(i + 1) + '</text>';
      }
    }
    return '<path class="lens-ticks" d="' + major + '"/><path class="lens-ticks lens-ticks--minor" d="' + small + '"/>' + labels;
  }

  function renderLens(host, apps) {
    var compact = host.hasAttribute('data-lens-compact');
    var order = lensOrder(apps);
    if (!order.length) { host.hidden = true; return; }

    var uid = 'l' + (++lensUid);
    var N = order.length;
    var beta = 360 / N;
    var dialable = !compact && N > 1;

    host.classList.add('lens');
    if (compact) host.setAttribute('aria-hidden', 'true');

    var itemsHtml = order.map(function (app, i) {
      var tag = compact ? 'span' : 'a';
      var attrs = compact ? '' :
        ' href="' + detailHref(app) + '" draggable="false" tabindex="' + (i ? -1 : 0) + '"' +
        ' aria-label="' + esc(app.name + ' — ' + statusLabel(app) + ', ' + (i + 1) + ' of ' + N) + '"';
      return '<li class="lens-item' + (app.status === 'coming-soon' ? ' is-soon' : '') + '" style="' + colorStyle(app) + '">' +
        '<' + tag + ' class="lens-link"' + attrs + '>' +
          '<img class="lens-icon" src="' + esc(safeUrl(app.icon)) + '" alt="" width="256" height="256" draggable="false" />' +
          '<span class="lens-status lens-status--' + esc(app.status) + '"></span>' +
        '</' + tag + '>' +
      '</li>';
    }).join('');

    var bokehHtml = '';
    for (var b = 0; b < 7; b++) bokehHtml += '<i></i>';

    host.innerHTML =
      '<div class="lens-stage">' +
        '<div class="lens-frame"' + (compact ? '' : ' role="group" aria-roledescription="carousel" aria-label="Focal Studio apps"') + '>' +
          '<div class="lens-halo" aria-hidden="true"></div>' +
          '<svg class="lens-barrel" viewBox="0 0 100 100" aria-hidden="true">' +
            '<defs>' +
              '<radialGradient id="' + uid + 'body" cx="50%" cy="35%" r="65%">' +
                '<stop offset="0" stop-color="#1C1C21"/><stop offset="1" stop-color="#0A0A0C"/></radialGradient>' +
              '<linearGradient id="' + uid + 'light" x1="0" y1="0" x2="1" y2="1">' +
                '<stop offset="0" stop-color="#fff" stop-opacity="0.32"/><stop offset="0.45" stop-color="#fff" stop-opacity="0"/>' +
                '<stop offset="0.8" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity="0.12"/></linearGradient>' +
            '</defs>' +
            '<circle class="lens-body" cx="50" cy="50" r="49.8" fill="url(#' + uid + 'body)"/>' +
            '<circle class="lens-band" cx="50" cy="50" r="44.4"/>' +
            '<g class="lens-ring">' +
              '<circle class="lens-knurl" cx="50" cy="50" r="48.5"/>' +
              ringMarks(N) +
            '</g>' +
            '<circle class="lens-knurl-light" cx="50" cy="50" r="48.5" stroke="url(#' + uid + 'light)"/>' +
            '<path class="lens-index" d="M48.6 0.6L51.4 0.6L50 2.6Z"/>' +
          '</svg>' +
          '<div class="lens-bevel" aria-hidden="true"></div>' +
          '<div class="lens-window">' +
            '<div class="lens-bokeh" aria-hidden="true">' + bokehHtml + '</div>' +
            '<div class="lens-floor" aria-hidden="true"></div>' +
            '<ul class="lens-list">' + itemsHtml + '</ul>' +
          '</div>' +
          '<svg class="lens-iris" viewBox="0 0 100 100" aria-hidden="true">' +
            '<defs><filter id="' + uid + 'shadow" x="-20%" y="-20%" width="140%" height="140%">' +
              '<feDropShadow dx="0" dy="0.5" stdDeviation="1.2" flood-color="#000" flood-opacity="0.85"/></filter></defs>' +
            '<defs class="lens-blade-defs"></defs>' +
            '<g class="lens-blades" filter="url(#' + uid + 'shadow)"></g>' +
            '<path class="lens-seams"/>' +
            '<path class="lens-edges"/>' +
            '<circle class="lens-rim" cx="50" cy="50" r="' + LENS_R + '"/>' +
          '</svg>' +
          '<div class="lens-glass" aria-hidden="true"><div class="lens-bloom"></div><div class="lens-sheen"></div></div>' +
          (dialable ? '<svg class="lens-dial" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="44.6"/></svg>' : '') +
        '</div>' +
      '</div>' +
      (compact ? '' :
        '<div class="lens-readout">' +
          (dialable ? '<button type="button" class="lens-step" data-step="-1" aria-label="Previous app">‹</button>' : '') +
          '<div class="lens-readout-body" aria-hidden="true"></div>' +
          (dialable ? '<button type="button" class="lens-step" data-step="1" aria-label="Next app">›</button>' : '') +
        '</div>' +
        '<p class="sr-only" aria-live="polite" data-lens-live></p>') +
      (dialable && N > 2 ?
        '<p class="lens-hint"><span class="lens-hint-drag">Turn the ring to dial</span><span class="lens-hint-swipe">Swipe to dial</span> · ' + N + ' apps' +
        '<a href="apps.html">See them all <span class="btn-arrow" aria-hidden="true">→</span></a></p>' : '');

    var frame = host.querySelector('.lens-frame');
    var win = host.querySelector('.lens-window');
    var bladeDefs = host.querySelector('.lens-blade-defs');
    var blades = host.querySelector('.lens-blades');
    var seams = host.querySelector('.lens-seams');
    var edges = host.querySelector('.lens-edges');
    var ring = host.querySelector('.lens-ring');
    var dial = host.querySelector('.lens-dial');
    var body = host.querySelector('.lens-readout-body');
    var live = host.querySelector('[data-lens-live]');
    var marks = [].map.call(host.querySelectorAll('.lens-mark'), function (el) {
      return { el: el, index: +el.getAttribute('data-mark'), angle: +el.getAttribute('data-mark') * beta, flip: false };
    });
    var bokeh = [].slice.call(host.querySelectorAll('.lens-bokeh i'));
    var items = [].map.call(host.querySelectorAll('.lens-item'), function (el, i) {
      return { el: el, link: el.firstChild, app: order[i], index: i, shown: true };
    });

    /* Bokeh: soft out-of-focus lights in the colours of the apps nearby */
    var BOKEH = [[8, 22, 26], [30, 78, 18], [62, 14, 22], [86, 40, 30], [74, 82, 20], [16, 60, 16], [48, 92, 24]];

    function setIris(frac) {
      var s = irisShape(frac, uid);
      bladeDefs.innerHTML = s.defs;
      blades.innerHTML = s.blades;
      seams.setAttribute('d', s.seams);
      edges.setAttribute('d', s.edges);
      win.style.clipPath = s.clip;
      win.style.webkitClipPath = s.clip;
    }

    /* ── State ──
       theta: the dial, in apps (unbounded; app = theta mod N)
       focus: where the lens is focused, same units; it lags behind and hunts */
    var W = 0;
    var theta = 0, thetaVel = 0, thetaTarget = 0, dialMode = 'rest';   // 'rest' | 'spring' | 'drag' | 'intro'
    var focus = 0, focusVel = 0, locked = true, interacted = false;
    var front = 0, shownIndex = -1;
    var tilt = { x: 0, y: 0 }, tiltTo = { x: 0, y: 0 };
    var iris = null;                                 // { from, to, t0, ms, done }
    var drag = null, suppressClick = false;

    var intro = !compact && document.documentElement.classList.contains('intro') && !REDUCED_MOTION;
    var introT0 = 0, introTilt = { x: 0, y: 0 }, introFrom = Math.min(3, N - 1), reveal = intro ? 0 : 1, bloomed = false;

    /* ── Drawing ── */
    function draw() {
      var rd = W * 0.34;                              // drum radius, px
      var defocusFront = Math.abs(focus - theta);
      var breath = 1 + 0.045 * Math.min(1, defocusFront);   // focus breathing

      items.forEach(function (it) {
        var rel = wrapDelta(it.index - theta, N);
        var a = Math.abs(rel);
        var show = a < 2.2 && reveal > 0;
        if (show !== it.shown) { it.el.style.visibility = show ? '' : 'hidden'; it.shown = show; }
        if (!show) return;
        var defocus = Math.abs(wrapDelta(it.index - focus, N));
        var blur = Math.min(18, defocus * 9 + (1 - reveal) * 14);
        var fringe = a < 0.6 && blur > 0.8 ? blur * 0.35 : 0;   // colour fringing when out of focus
        it.el.style.transform =
          'translate(-50%, -50%) translateZ(' + (-rd).toFixed(1) + 'px) rotateY(' + (rel * DRUM_STEP).toFixed(2) + 'deg)' +
          ' translateZ(' + rd.toFixed(1) + 'px) scale(' + (breath * (0.7 + 0.3 * reveal)).toFixed(4) + ')';
        it.el.style.opacity = ((1 - smooth(1.1, 1.9, a)) * reveal).toFixed(3);
        it.el.style.zIndex = 100 - Math.round(a * 20);
        it.el.style.filter =
          (blur > 0.05 ? 'blur(' + blur.toFixed(2) + 'px) ' : '') +
          'brightness(' + (1 - 0.5 * Math.min(1, a)).toFixed(3) + ')' +
          (fringe ? ' drop-shadow(' + fringe.toFixed(1) + 'px 0 0 rgba(255,70,120,.35)) drop-shadow(' + (-fringe).toFixed(1) + 'px 0 0 rgba(70,200,255,.35))' : '');
      });

      /* The ring and its knurl turn with the dial; the index mark stays put.
         Markings passing the bottom flip so they never read upside down. */
      ring.setAttribute('transform', 'rotate(' + (-theta * beta).toFixed(3) + ' 50 50)');
      marks.forEach(function (m) {
        var at = mod(m.angle - theta * beta, 360), flip = at > 95 && at < 265;
        if (flip !== m.flip) {
          m.flip = flip;
          m.el.setAttribute('transform', 'rotate(' + m.angle.toFixed(2) + ' 50 50)' + (flip ? ' rotate(180 50 6.95)' : ''));
        }
      });

      bokeh.forEach(function (el, j) {
        var c = BOKEH[j];
        var x = mod(c[0] - theta * 22 * (0.6 + j * 0.08), 120) - 10;
        el.style.left = x.toFixed(2) + '%';
        el.style.top = c[1] + '%';
        el.style.width = c[2] + '%';
      });

      win.style.setProperty('--defocus', Math.min(1, defocusFront).toFixed(3));

      var idx = mod(Math.round(dialMode === 'spring' || dialMode === 'rest' ? thetaTarget : theta), N);
      if (idx !== front || shownIndex < 0) setFront(idx);
    }

    function setFront(idx) {
      var moved = shownIndex >= 0 && idx !== front;
      front = idx; shownIndex = idx;
      marks.forEach(function (m) { m.el.classList.toggle('is-active', m.index === idx); });
      items.forEach(function (it) {
        if (!compact) it.link.setAttribute('tabindex', it.index === idx ? '0' : '-1');
      });
      var app = order[idx];
      win.style.setProperty('--front-color', safeColor(app.color) || 'var(--accent)');
      bokeh.forEach(function (el, j) {
        el.style.setProperty('--c', safeColor(order[mod(idx + j - 3, N)].color) || 'var(--accent)');
      });
      if (moved) {
        frame.classList.remove('is-tick'); void frame.offsetWidth; frame.classList.add('is-tick');
        if (drag && drag.touch && navigator.vibrate) { try { navigator.vibrate(4); } catch (e) {} }
      }
      if (body) {
        body.innerHTML =
          '<span class="lens-readout-meta"><span class="lens-readout-count"><span class="lens-confirm" title="Focus confirmed"></span>' + pad2(idx + 1) + ' / ' + pad2(N) + '</span>' + pill(app) + '</span>' +
          '<span class="lens-readout-name">' + esc(app.name) + '</span>' +
          '<span class="lens-readout-tagline">' + esc(sentence(app.tagline)) + '</span>' +
          '<a class="lens-readout-link" href="' + detailHref(app) + '" tabindex="-1">View app <span class="btn-arrow">→</span></a>';
      }
    }

    function setLocked(on) {
      if (on === locked) return;
      locked = on;
      host.classList.toggle('is-hunting', !on);
      if (on) {
        host.classList.remove('is-confirm'); void host.offsetWidth; host.classList.add('is-confirm');
        if (live && interacted) {
          var app = order[front];
          live.textContent = app.name + ', ' + statusLabel(app) + '. ' + (front + 1) + ' of ' + N + '.';
        }
      }
    }

    /* ── Motion: one rAF loop that runs only while something moves ── */
    var rafId = 0, lastT = 0, lastFrameAt = 0;

    function kick() {
      /* A frame that never arrived (page frozen in the back/forward cache) must not wedge the loop */
      if (rafId && performance.now() - lastFrameAt > 250) { window.cancelAnimationFrame(rafId); rafId = 0; }
      if (!rafId) { lastT = 0; lastFrameAt = performance.now(); rafId = window.requestAnimationFrame(tick); }
    }

    function tick(now) {
      lastFrameAt = performance.now();
      var dt = lastT ? Math.min(0.05, (now - lastT) / 1000) : 1 / 60;
      lastT = now;
      var busy = false;
      if (intro) busy = stepIntro(now) || busy;
      busy = stepIris(now) || busy;
      busy = stepDial(dt) || busy;
      busy = stepFocus(dt) || busy;
      busy = stepTilt(dt) || busy;
      draw();
      rafId = busy ? window.requestAnimationFrame(tick) : 0;
    }

    function stepDial(dt) {
      if (dialMode === 'drag' || dialMode === 'intro') return true;
      if (dialMode !== 'spring') return false;
      if (REDUCED_MOTION) { theta = thetaTarget; thetaVel = 0; dialMode = 'rest'; return true; }
      /* A detent: stiff and a touch underdamped, so it clicks into place */
      thetaVel += (-170 * (theta - thetaTarget) - 19 * thetaVel) * dt;
      theta += thetaVel * dt;
      if (Math.abs(theta - thetaTarget) < 0.002 && Math.abs(thetaVel) < 0.02) {
        theta = thetaTarget; thetaVel = 0; dialMode = 'rest';
      }
      return true;
    }

    function stepFocus(dt) {
      var moving = dialMode !== 'rest';
      var target = moving ? theta : thetaTarget;
      if (REDUCED_MOTION) { focus = target; focusVel = 0; }
      else {
        /* While the ring turns, focus trails behind; once it stops, AF hunts and locks */
        var k = moving ? 26 : 320, c = moving ? 10 : 16;
        focusVel += (-k * (focus - target) - c * focusVel) * dt;
        focus += focusVel * dt;
      }
      if (!moving && Math.abs(focus - target) < 0.01 && Math.abs(focusVel) < 0.08) {
        focus = target; focusVel = 0;
        if (reveal >= 1) setLocked(true);
        return false;
      }
      if (Math.abs(focus - target) > 0.04) setLocked(false);
      return true;
    }

    function stepTilt(dt) {
      var k = 1 - Math.exp(-dt * 6);
      tilt.x += (tiltTo.x - tilt.x) * k; tilt.y += (tiltTo.y - tilt.y) * k;
      var tx = tilt.x + introTilt.x, ty = tilt.y + introTilt.y;
      frame.style.transform = 'rotateX(' + tx.toFixed(2) + 'deg) rotateY(' + ty.toFixed(2) + 'deg)';
      frame.style.setProperty('--tilt-x', tx.toFixed(2));
      frame.style.setProperty('--tilt-y', ty.toFixed(2));
      return Math.abs(tiltTo.x - tilt.x) + Math.abs(tiltTo.y - tilt.y) > 0.02;
    }

    function animateIris(from, to, ms, ease, done) {
      if (REDUCED_MOTION) { setIris(to); if (done) done(); return; }
      iris = { from: from, to: to, ms: ms, ease: ease, done: done, t0: 0 };
      kick();
    }

    function stepIris(now) {
      if (!iris) return false;
      if (!iris.t0) iris.t0 = now;
      var p = clamp01((now - iris.t0) / iris.ms);
      setIris(iris.from + (iris.to - iris.from) * iris.ease(p));
      if (p < 1) return true;
      var done = iris.done; iris = null;
      if (done) done();
      return false;
    }

    /* ── Opening: the barrel settles, the iris opens, then the dial winds
       back to the spotlight app and the lens hunts into focus ── */
    function stepIntro(now) {
      if (!introT0) introT0 = now;
      var t = now - introT0;
      setIris(t < 300 ? IRIS_CLOSED : IRIS_CLOSED + (IRIS_OPEN - IRIS_CLOSED) * easeOutBack(clamp01((t - 300) / 1100)));
      var te = easeOut(clamp01(t / 1600));
      introTilt = { x: 18 * (1 - te), y: -12 * (1 - te) };
      if (t > 950 && !bloomed) { bloomed = true; frame.classList.add('is-bloom'); }
      reveal = clamp01((t - 650) / 600);
      if (t < 1100) { theta = introFrom; }
      else if (t < 2100) { theta = introFrom * (1 - easeInOut((t - 1100) / 1000)); }
      if (t >= 2100) {
        intro = false; introTilt = { x: 0, y: 0 };
        setIris(IRIS_OPEN); reveal = 1;
        theta = thetaTarget = 0; dialMode = 'rest';
        return false;
      }
      return true;
    }

    function measure() {
      W = frame.clientWidth;
      draw();
    }

    if (intro) {
      setIris(IRIS_CLOSED);
      theta = focus = introFrom; dialMode = 'intro';
      introTilt = { x: 18, y: -12 };
      locked = false;
    } else {
      setIris(IRIS_OPEN);
    }
    host.classList.toggle('is-hunting', !locked);
    measure();
    stepTilt(1);
    host.classList.add('is-ready');
    if (intro) kick();

    if ('ResizeObserver' in window) new ResizeObserver(function () { measure(); }).observe(frame);
    else window.addEventListener('resize', measure);

    if (compact) return;

    /* Back/forward cache: undo a pressed app and restart the loop */
    window.addEventListener('pageshow', function (e) {
      if (!e.persisted) return;
      frame.classList.remove('is-engaged');
      iris = null; drag = null; suppressClick = false;
      host.classList.remove('is-dragging');
      if (dialMode === 'drag' || dialMode === 'intro') { dialMode = 'spring'; thetaTarget = Math.round(theta); }
      intro = false; introTilt = { x: 0, y: 0 }; reveal = 1;
      setIris(IRIS_OPEN);
      if (rafId) { window.cancelAnimationFrame(rafId); rafId = 0; }
      kick();
    });
    document.addEventListener('visibilitychange', function () { if (!document.hidden) kick(); });

    if (!dialable) return;

    /* ── Dialing ── */
    function dialTo(index) {
      interacted = true;
      var base = dialMode === 'spring' ? thetaTarget : Math.round(theta);
      thetaTarget = base + wrapDelta(index - mod(base, N), N);
      dialMode = 'spring';
      kick();
    }

    function step(delta) { dialTo(mod((dialMode === 'spring' ? thetaTarget : Math.round(theta)) + delta, N)); }

    function angleOf(e) {
      var r = frame.getBoundingClientRect();
      return Math.atan2(e.clientX - r.left - r.width / 2, -(e.clientY - r.top - r.height / 2)) * 180 / Math.PI;
    }

    function startDrag(e, kind) {
      if (e.button !== 0 || intro) return;
      drag = { id: e.pointerId, kind: kind, x: e.clientX, y: e.clientY, a: angleOf(e), theta: theta, moved: false, samples: [], touch: e.pointerType !== 'mouse' };
      suppressClick = false;
    }

    win.addEventListener('pointerdown', function (e) { startDrag(e, 'linear'); });
    dial.addEventListener('pointerdown', function (e) { startDrag(e, 'ring'); });

    window.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.moved) {
        if (Math.hypot(dx, dy) < 6) return;
        drag.moved = true; interacted = true;
        dialMode = 'drag'; thetaVel = 0;
        host.classList.add('is-dragging');
        try { (drag.kind === 'ring' ? dial : win).setPointerCapture(e.pointerId); } catch (err) {}
      }
      if (drag.kind === 'ring') {
        var d = angleOf(e) - drag.a;
        d = ((d + 540) % 360) - 180;
        drag.a += d; drag.total = (drag.total || 0) + d;
        theta = drag.theta - drag.total / beta;
      } else {
        theta = drag.theta - dx / (W * 0.3);
      }
      drag.samples.push({ t: e.timeStamp, v: theta });
      while (drag.samples.length > 2 && e.timeStamp - drag.samples[0].t > 90) drag.samples.shift();
      kick();
    });

    function endDrag(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var d = drag;
      drag = null;
      if (d.moved) {
        suppressClick = true;
        window.setTimeout(function () { suppressClick = false; }, 350);
        var s = d.samples, a = s[0], z = s[s.length - 1], span = a && z ? (z.t - a.t) / 1000 : 0;
        var v = span > 0.008 ? (z.v - a.v) / span : 0;
        thetaTarget = Math.round(theta + Math.max(-2, Math.min(2, v * 0.08)));
        thetaVel = REDUCED_MOTION ? 0 : v;
        dialMode = 'spring';
        host.classList.remove('is-dragging');
      } else if (d.kind === 'ring' && e.type === 'pointerup') {
        /* A tap on a ring marking dials straight to it */
        dialTo(mod(Math.round(theta + wrapDelta(angleOf(e) / beta, N)), N));
      }
      kick();
    }
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);

    /* Clicks: a side app dials in; the front app opens, with a shutter press */
    win.addEventListener('click', function (e) {
      var link = e.target.closest('.lens-link');
      if (!link) return;
      if (suppressClick) { e.preventDefault(); suppressClick = false; return; }
      var it = items.filter(function (x) { return x.link === link; })[0];
      if (!it) return;
      if (it.index !== front) { e.preventDefault(); dialTo(it.index); return; }
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || REDUCED_MOTION) return;
      e.preventDefault();
      frame.classList.add('is-engaged');
      animateIris(IRIS_OPEN, 0.45, 240, easeOut, function () { window.location.href = link.href; });
    });
    win.addEventListener('dragstart', function (e) { e.preventDefault(); });

    host.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-step]');
      if (btn) step(+btn.getAttribute('data-step'));
    });

    /* Arrow keys turn the dial; focus follows the app in front */
    host.addEventListener('keydown', function (e) {
      var delta = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (e.key === 'Home') { e.preventDefault(); dialTo(0); }
      else if (e.key === 'End') { e.preventDefault(); dialTo(N - 1); }
      else if (delta) { e.preventDefault(); step(delta); }
      else return;
      if (win.contains(document.activeElement)) {
        window.requestAnimationFrame(function () { items[front].link.focus({ preventScroll: true }); });
      }
    });

    /* Horizontal trackpad scroll turns the dial one detent at a time;
       a vertical wheel always scrolls the page */
    var wheelX = 0, wheelTimer = 0;
    frame.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      wheelX += e.deltaX;
      window.clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(function () { wheelX = 0; }, 180);
      if (Math.abs(wheelX) > 50) { step(wheelX > 0 ? 1 : -1); wheelX = 0; }
    }, { passive: false });

    /* The barrel tilts toward the pointer while it's over the hero */
    if (!REDUCED_MOTION) {
      var zone = host.closest('.hero') || host;
      zone.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        var r = frame.getBoundingClientRect();
        var nx = Math.max(-1, Math.min(1, (e.clientX - r.left - r.width / 2) / (r.width / 2)));
        var ny = Math.max(-1, Math.min(1, (e.clientY - r.top - r.height / 2) / (r.height / 2)));
        tiltTo = { x: -ny * 6, y: nx * 6 };
        kick();
      });
      zone.addEventListener('pointerleave', function () { tiltTo = { x: 0, y: 0 }; kick(); });
    }
  }

  /* ── App detail page ──────────────────────────────────────── */

  function renderDetail(host, apps) {
    var params = new URLSearchParams(window.location.search);
    var slug = (params.get('app') || '').toLowerCase();
    var app = apps.filter(function (a) { return a.slug === slug; })[0];

    if (!app) {
      host.innerHTML =
        '<div class="container detail-missing">' +
          '<p class="eyebrow">404 · Out of focus</p>' +
          '<h1 class="section-title">We couldn’t find that app.</h1>' +
          '<p>It may have been renamed, or it hasn’t been announced yet.</p>' +
          '<a class="btn btn-primary" href="apps.html">Browse the catalog <span class="btn-arrow" aria-hidden="true">→</span></a>' +
        '</div>';
      return;
    }

    var meta = detailMeta(app);
    document.title = meta.title;
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', meta.description);

    /* The static page is the one to index */
    var canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = SITE_URL + detailHref(app);

    host.innerHTML = detailHtml(app, '');
  }

  function detailMeta(app) {
    return {
      title: app.name + ' — Focal Studio',
      description: app.name + ': ' + (app.tagline || '') + ' A Focal Studio app.'
    };
  }

  /* The app page body. root is '' on app.html and '../' on the static apps/<slug>.html */
  function detailHtml(app, root) {
    var detail = app.detail || {};
    var released = app.status === 'released';
    var actions = storeButtons(app);
    var beta = safeUrl(app.betaUrl);
    if (beta) actions += '<a class="btn btn-primary" href="' + esc(beta) + '" target="_blank" rel="noopener noreferrer">Join the beta ↗</a>';
    var privacy = local(app.privacyUrl, root);
    if (privacy) actions += '<a class="btn btn-ghost" href="' + esc(privacy) + '">Privacy policy</a>';

    var html =
      '<section class="detail-hero" style="' + colorStyle(app) + '">' +
        '<div class="container">' +
          '<a class="detail-back" href="' + root + 'apps.html">← The catalog</a>' +
          '<div class="detail-head">' +
            '<img class="detail-icon" src="' + esc(local(app.icon, root)) + '" alt="' + esc(app.name) + ' app icon" width="128" height="128" />' +
            '<div>' +
              pill(app) +
              '<h1 class="detail-title">' + esc(app.name) + '</h1>' +
              '<p class="detail-tagline">' + esc(sentence(app.tagline)) + (app.description ? ' ' + esc(app.description) : '') + '</p>' +
            '</div>' +
          '</div>' +
          (actions ? '<div class="detail-actions">' + actions + '</div>' : '') +
        '</div>' +
      '</section>';

    html += '<div class="container">';

    if (detail.screenshots && detail.screenshots.length) {
      html += '<section class="detail-section" aria-labelledby="shots-h"><h2 id="shots-h">Screenshots</h2>' +
        '<div class="shots" tabindex="0" aria-label="Screenshots, scroll horizontally">' +
        detail.screenshots.map(function (s) {
          return '<figure class="shot"><img src="' + esc(local(s.src, root)) + '" alt="' + esc(s.alt || '') + '" loading="lazy" /></figure>';
        }).join('') +
        '</div></section>';
    }

    if (detail.problem || detail.solution) {
      var paras = function (list) {
        return [].concat(list || []).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('');
      };
      html += '<section class="detail-section"><div class="story">' +
        (detail.problem ? '<div class="reveal"><p class="section-label">The problem</p><h2>Why it exists</h2>' + paras(detail.problem) + '</div>' : '') +
        (detail.solution ? '<div class="reveal" style="--i:1"><p class="section-label">The approach</p><h2>How it helps</h2>' + paras(detail.solution) + '</div>' : '') +
        '</div></section>';
    }

    if (detail.features && detail.features.length) {
      html += '<section class="detail-section" aria-labelledby="features-h"><h2 id="features-h">' + (released ? 'Key features' : 'What’s coming') + '</h2><div class="features">' +
        detail.features.map(function (f) {
          return '<div class="feature"><span class="feature-icon" aria-hidden="true">' + esc(f.icon) + '</span><strong>' + esc(f.title) + '</strong><span>' + esc(f.text) + '</span></div>';
        }).join('') +
        '</div></section>';
    }

    if (detail.tech) {
      html += '<section class="detail-section" aria-labelledby="tech-h"><h2 id="tech-h">Platform &amp; tech</h2><table class="spec-table"><tbody>' +
        Object.keys(detail.tech).map(function (k) {
          return '<tr><th scope="row">' + esc(k) + '</th><td>' + esc(detail.tech[k]) + '</td></tr>';
        }).join('') +
        '</tbody></table></section>';
    }

    if (!released) {
      var subject = encodeURIComponent('Notify me: ' + app.name);
      html += '<section class="detail-section"><div class="soon-panel reveal">' +
        '<p class="section-label">In the works</p>' +
        '<h2>' + esc(app.name) + ' is ' + (app.status === 'in-development' ? 'in development' : 'coming soon') + '.</h2>' +
        '<p>We’re polishing it in the studio. Want a heads-up the day it lands on the store?</p>' +
        '<a class="btn btn-primary" href="mailto:' + CONTACT_EMAIL + '?subject=' + subject + '">Notify me <span class="btn-arrow" aria-hidden="true">→</span></a>' +
        '</div></section>';
    }

    if (released && privacy) {
      html += '<section class="detail-section"><h2>Privacy</h2><p class="section-intro">' + esc(app.name) +
        ' is built privacy-first. Read the full <a class="accent" href="' + esc(privacy) + '">privacy policy</a> for details.</p></section>';
    }

    html += '</div>';
    return html;
  }

  /* ── Beta testers bar ─────────────────────────────────────── */

  function renderTestersBar(apps) {
    var app = apps.filter(function (a) { return a.status === 'in-development' && safeUrl(a.betaUrl); })[0];
    var nav = document.querySelector('.site-nav');
    if (!app || !nav) return;
    var bar = document.createElement('div');
    bar.className = 'testers-bar';
    bar.innerHTML =
      '<div class="container testers-bar-inner">' +
        '<span>🧪 Testing <strong>' + esc(app.name) + '</strong> — help us ship it.</span>' +
        '<a class="testers-bar-link" href="' + esc(safeUrl(app.betaUrl)) + '" target="_blank" rel="noopener noreferrer">Join the beta →</a>' +
      '</div>';
    nav.parentNode.insertBefore(bar, nav.nextSibling);
  }

  /* ── Hash targets on the catalog (apps.html#app-wildfocus) ── */

  /* Only app cards are centered; section anchors (#main, #studio) keep normal scrolling */
  function centerHashTarget() {
    if (!window.location.hash) return;
    var id;
    try { id = decodeURIComponent(window.location.hash.slice(1)); } catch (e) { return; }
    var target = document.getElementById(id);
    if (!target || !target.classList.contains('app-card')) return;
    window.requestAnimationFrame(function () {
      target.scrollIntoView({ behavior: REDUCED_MOTION ? 'auto' : 'smooth', block: 'center' });
    });
  }

  /* ── Boot ─────────────────────────────────────────────────── */

  function boot(apps) {
    document.querySelectorAll('[data-app-lens]').forEach(function (el) { renderLens(el, apps); });
    document.querySelectorAll('[data-catalog]').forEach(function (el) { renderCatalog(el, apps); });
    document.querySelectorAll('[data-stats]').forEach(function (el) { renderStats(el, apps); });
    document.querySelectorAll('[data-app-detail]').forEach(function (el) { renderDetail(el, apps); });
    renderCounts(apps);
    renderTestersBar(apps);
    observeReveals();
    centerHashTarget();
  }

  function fail(err) {
    if (window.console) console.error('Focal Studio: could not load apps.json', err);
    document.querySelectorAll('[data-catalog], [data-app-detail]').forEach(function (el) {
      el.innerHTML = '<p class="empty-state">The catalog didn’t load. <a class="accent" href="">Try again</a>.</p>';
    });
    observeReveals();
  }

  /* Static content reveals right away; app content reveals again after it renders */
  observeReveals();

  /* Every page loads the catalog: even pages without a catalog show the beta bar */
  fetch(APPS_URL, { cache: 'no-cache' })
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (data) { boot((data && data.apps) || []); })
    .catch(fail);

  window.addEventListener('hashchange', centerHashTarget);
})();
