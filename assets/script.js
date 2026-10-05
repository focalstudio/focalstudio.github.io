/* script.js — Focal Studio
   Everything app-related renders from assets/apps.json, so adding or
   releasing an app is a data change, never a markup change. */

(function () {
  'use strict';

  var APPS_URL = 'assets/apps.json';
  var CONTACT_EMAIL = 'focalstudio.apps@gmail.com';
  var REDUCED_MOTION = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var STATUS = {
    'released':       { label: 'Out now',        order: 0 },
    'in-development': { label: 'In development', order: 1 },
    'coming-soon':    { label: 'Coming soon',    order: 2 }
  };

  var PLATFORM_LABEL = { ios: 'iPhone', android: 'Android' };

  var APERTURE_SVG =
    '<svg class="aperture" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="10"/>' +
      '<path d="M12 7.4L21.94 13.14M15.98 9.7L15.98 21.17M15.98 14.3L6.05 20.04M12 16.6L2.06 10.86M8.02 14.3L8.02 2.83M8.02 9.7L17.95 3.96"/>' +
    '</svg>';

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

  function pill(app) {
    return '<span class="pill pill--' + esc(app.status) + '">' + esc(statusLabel(app)) + '</span>';
  }

  function detailHref(app) {
    return 'app.html?app=' + encodeURIComponent(app.slug);
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

  /* ── The orbit ────────────────────────────────────────────── */

  var orbitUid = 0;

  function chunk(list, size) {
    var out = [];
    for (var i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
    return out;
  }

  function renderOrbit(host, apps) {
    var compact = host.hasAttribute('data-orbit-compact');
    var live = sortApps(apps.filter(function (a) { return a.status !== 'coming-soon'; }));
    var soon = sortApps(apps.filter(function (a) { return a.status === 'coming-soon'; }));

    /* Inner rings: shipped + beta. Outer rings: coming soon. Max 6 per ring. */
    var rings = [];
    chunk(live, 6).forEach(function (group) { rings.push({ apps: group, soon: false }); });
    chunk(soon, 6).forEach(function (group) { rings.push({ apps: group, soon: true }); });
    if (!rings.length) { host.hidden = true; return; }

    var uid = ++orbitUid;
    var n = rings.length;
    rings.forEach(function (ring, k) {
      ring.fr = n === 1 ? 0.38 : 0.26 + (0.21 * k) / (n - 1);    // radius as a fraction of width
      ring.tilt = 0.46;                                          // ry / rx
      ring.phi = (-16 + k * 7) * Math.PI / 180;                  // plane rotation
      ring.dir = ring.soon ? -1 : 1;
      ring.omega = (2 * Math.PI) / (ring.soon ? 92 : 64);        // rad / second
      ring.phase = k * 0.7;
    });

    var items = [];
    var listHtml = '';
    rings.forEach(function (ring, k) {
      ring.apps.forEach(function (app, j) {
        var tag = compact ? 'span' : 'a';
        var attrs = compact
          ? ''
          : ' href="' + detailHref(app) + '" aria-label="' + esc(app.name + ' — ' + statusLabel(app)) + '"';
        listHtml +=
          '<li class="orbit-item' + (ring.soon ? ' is-soon' : '') + '" style="' + colorStyle(app) + '" data-ring="' + k + '" data-slot="' + j + '">' +
            '<' + tag + ' class="orbit-link"' + attrs + '>' +
              '<img class="orbit-icon" src="' + esc(safeUrl(app.icon)) + '" alt="" width="76" height="76" />' +
              (compact ? '' : '<span class="orbit-label" aria-hidden="true">' + esc(app.name) + pill(app) + '</span>') +
            '</' + tag + '>' +
          '</li>';
      });
    });

    host.classList.add('orbit');
    if (compact) host.setAttribute('aria-hidden', 'true');
    host.style.isolation = 'isolate';
    host.innerHTML =
      '<svg class="orbit-rings orbit-rings--back" aria-hidden="true"></svg>' +
      '<ul class="orbit-list" aria-label="Focal Studio apps">' + listHtml + '</ul>' +
      '<div class="orbit-core" aria-hidden="true">' + APERTURE_SVG + '</div>' +
      '<svg class="orbit-rings orbit-rings--front" aria-hidden="true"></svg>';

    var backSvg = host.querySelector('.orbit-rings--back');
    var frontSvg = host.querySelector('.orbit-rings--front');

    host.querySelectorAll('.orbit-item').forEach(function (li) {
      var ring = rings[+li.getAttribute('data-ring')];
      items.push({ el: li, ring: ring, slot: +li.getAttribute('data-slot'), active: false });
    });

    var W = 0, H = 0;

    function drawRings() {
      var cx = W / 2, cy = H / 2;
      var defs = '', back = '', front = '';
      rings.forEach(function (ring, k) {
        var rx = W * ring.fr, ry = rx * ring.tilt, deg = ring.phi * 180 / Math.PI;
        var id = 'o' + uid + 'r' + k;
        var tint = ring.soon ? '142,155,255' : '91,208,138';
        defs +=
          '<linearGradient id="' + id + 'g" gradientUnits="userSpaceOnUse" x1="' + (cx - rx) + '" y1="0" x2="' + (cx + rx) + '" y2="0">' +
            '<stop offset="0" stop-color="rgb(' + tint + ')" stop-opacity="0.05"/>' +
            '<stop offset="0.5" stop-color="rgb(' + tint + ')" stop-opacity="0.55"/>' +
            '<stop offset="1" stop-color="rgb(' + tint + ')" stop-opacity="0.05"/>' +
          '</linearGradient>' +
          '<clipPath id="' + id + 'b" clipPathUnits="userSpaceOnUse"><rect x="' + (cx - rx - 4) + '" y="' + (cy - ry - 4) + '" width="' + (2 * rx + 8) + '" height="' + (ry + 4) + '"/></clipPath>' +
          '<clipPath id="' + id + 'f" clipPathUnits="userSpaceOnUse"><rect x="' + (cx - rx - 4) + '" y="' + cy + '" width="' + (2 * rx + 8) + '" height="' + (ry + 4) + '"/></clipPath>';
        var ellipse = function (clip, opacity) {
          return '<g transform="rotate(' + deg + ' ' + cx + ' ' + cy + ')">' +
            '<ellipse class="orbit-ring' + (ring.soon ? ' orbit-ring--soon' : '') + '" cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '"' +
            ' stroke="url(#' + id + 'g)" stroke-opacity="' + opacity + '" clip-path="url(#' + id + clip + ')"/></g>';
        };
        back += ellipse('b', 0.55);
        front += ellipse('f', 1);
      });
      var vb = '0 0 ' + W + ' ' + H;
      backSvg.setAttribute('viewBox', vb);
      frontSvg.setAttribute('viewBox', vb);
      backSvg.innerHTML = '<defs>' + defs + '</defs>' + back;
      frontSvg.innerHTML = '<defs>' + defs.replace(/id="o/g, 'id="f-o') + '</defs>' + front.replace(/url\(#o/g, 'url(#f-o');
    }

    /* Intro: icons burst out from behind the core */
    var introOn = document.documentElement.classList.contains('intro') && !REDUCED_MOTION;
    var introStart = performance.now() + 900;
    var INTRO_MS = 900;

    function easeOutBack(t) {
      var c1 = 1.4, c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }

    var t = 0;          // orbit clock (seconds)
    var speed = 1;      // eases to 0 while hovering/focusing
    var paused = false; // hover/focus

    function place(now) {
      var p = 1;
      if (introOn) {
        p = Math.min(1, Math.max(0, (now - introStart) / INTRO_MS));
        if (p >= 1) introOn = false;
      }
      var radius = introOn ? easeOutBack(p) : 1;
      var fade = introOn ? Math.min(1, p * 1.6) : 1;

      items.forEach(function (item) {
        var ring = item.ring;
        var total = ring.apps.length;
        var theta = ring.phase + (item.slot / total) * Math.PI * 2 + ring.dir * ring.omega * t;
        var rx = W * ring.fr * radius, ry = rx * ring.tilt;
        var lx = Math.cos(theta) * rx, ly = Math.sin(theta) * ry;
        var x = lx * Math.cos(ring.phi) - ly * Math.sin(ring.phi);
        var y = lx * Math.sin(ring.phi) + ly * Math.cos(ring.phi);
        var depth = (Math.sin(theta) + 1) / 2;                    // 0 = far, 1 = near
        var scale = 0.6 + 0.4 * depth;
        var opacity = (0.35 + 0.65 * depth) * (ring.soon ? 0.85 : 1) * fade;
        var z = depth >= 0.5 ? 4 : 1;
        if (item.active) { scale = Math.max(scale, 1); opacity = 1; z = 6; }
        item.el.style.transform = 'translate(-50%, -50%) translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) scale(' + scale.toFixed(3) + ')';
        item.el.style.opacity = opacity.toFixed(3);
        item.el.style.zIndex = z;
      });
    }

    var rafId = 0, last = 0, visible = true;

    function frame(now) {
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      speed += ((paused ? 0 : 1) - speed) * Math.min(1, dt * 5);
      t += dt * speed;
      place(now);
      rafId = window.requestAnimationFrame(frame);
    }

    function start() {
      if (REDUCED_MOTION || rafId || !visible || document.hidden) return;
      last = 0;
      rafId = window.requestAnimationFrame(frame);
    }

    function stop() {
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = 0;
    }

    function measure() {
      W = host.clientWidth;
      H = host.clientHeight;
      drawRings();
      place(performance.now());
    }

    measure();
    host.classList.add('is-ready');

    if ('ResizeObserver' in window) {
      new ResizeObserver(function () { measure(); }).observe(host);
    } else {
      window.addEventListener('resize', measure);
    }

    if (REDUCED_MOTION) return;

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) start(); else stop();
      }).observe(host);
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else start();
    });

    if (!compact) {
      var setActive = function (el, on) {
        var li = el && el.closest('.orbit-item');
        items.forEach(function (item) { if (item.el === li) item.active = on; });
        paused = items.some(function (item) { return item.active; });
        if (!rafId) place(performance.now());
      };
      host.addEventListener('pointerover', function (e) { if (e.target.closest('.orbit-link')) setActive(e.target, true); });
      host.addEventListener('pointerout', function (e) {
        var link = e.target.closest('.orbit-link');
        if (link && !link.contains(e.relatedTarget)) setActive(link, false);
      });
      host.addEventListener('focusin', function (e) { setActive(e.target, true); });
      host.addEventListener('focusout', function (e) { setActive(e.target, false); });
    }

    start();
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

    document.title = app.name + ' — Focal Studio';
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', app.name + ': ' + (app.tagline || '') + ' A Focal Studio app.');

    var detail = app.detail || {};
    var released = app.status === 'released';
    var actions = storeButtons(app);
    var beta = safeUrl(app.betaUrl);
    if (beta) actions += '<a class="btn btn-primary" href="' + esc(beta) + '" target="_blank" rel="noopener noreferrer">Join the beta ↗</a>';
    var privacy = safeUrl(app.privacyUrl);
    if (privacy) actions += '<a class="btn btn-ghost" href="' + esc(privacy) + '">Privacy policy</a>';

    var html =
      '<section class="detail-hero" style="' + colorStyle(app) + '">' +
        '<div class="container">' +
          '<a class="detail-back" href="apps.html">← The catalog</a>' +
          '<div class="detail-head">' +
            '<img class="detail-icon" src="' + esc(safeUrl(app.icon)) + '" alt="' + esc(app.name) + ' app icon" width="128" height="128" />' +
            '<div>' +
              pill(app) +
              '<h1 class="detail-title">' + esc(app.name) + '</h1>' +
              '<p class="detail-tagline">' + esc(app.tagline) + (app.description ? ' ' + esc(app.description) : '') + '</p>' +
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
          return '<figure class="shot"><img src="' + esc(safeUrl(s.src)) + '" alt="' + esc(s.alt || '') + '" loading="lazy" /></figure>';
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
      html += '<section class="detail-section" aria-labelledby="features-h"><h2 id="features-h">Key features</h2><div class="features">' +
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

    if (!released && !detail.features) {
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
    host.innerHTML = html;
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

  function centerHashTarget() {
    if (!window.location.hash) return;
    var target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
    if (!target) return;
    window.requestAnimationFrame(function () {
      target.scrollIntoView({ behavior: REDUCED_MOTION ? 'auto' : 'smooth', block: 'center' });
    });
  }

  /* ── Boot ─────────────────────────────────────────────────── */

  function boot(apps) {
    document.querySelectorAll('[data-app-orbit]').forEach(function (el) { renderOrbit(el, apps); });
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
