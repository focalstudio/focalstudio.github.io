/* script.js — minimal JS for fpmartinez10.github.io */

/* Shared app metadata for global catalog surfaces */
/* Template for new entries:
{
  id: 'app-example',
  name: 'Example App',
  status: 'released',
  href: 'apps.html#app-example',
  icon: 'assets/app-icons/example.png'
}
*/
var FOCAL_STUDIO_APPS = [
  {
    id: 'app-wildfocus',
    name: 'WildFocus',
    status: 'released',
    isNew: true,
    href: 'apps.html#app-wildfocus',
    icon: 'assets/app-icons/wildfocus.jpeg'
  },
  { id: 'app-mealcart', name: 'MealCart', status: 'coming-soon', href: 'apps.html#app-mealcart', icon: 'assets/app-icons/mealcart.png' },
  { id: 'app-staylock', name: 'StayLock', status: 'coming-soon', href: 'apps.html#app-staylock', icon: 'assets/app-icons/staylock.png' },
  { id: 'app-vestia',   name: 'Vestia',   status: 'coming-soon', href: 'apps.html#app-vestia',   icon: 'assets/app-icons/vestia.png' }
];


/* Mobile navigation toggle */
(function () {
  var toggle = document.querySelector('.nav-toggle');
  var links  = document.querySelector('.nav-links');
  if (!toggle || !links) return;

  toggle.addEventListener('click', function () {
    var isOpen = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  /* Close menu when a nav link is tapped on mobile */
  links.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
})();

/* Global app ticker band */
(function () {
  function getAppsForLane(status) {
    return FOCAL_STUDIO_APPS.filter(function (app) {
      return app.status === status;
    });
  }

  function statusLabel(app) {
    if (app.isNew && app.status === 'released') return 'New';
    if (app.status === 'in-development') return 'In Development';
    if (app.status === 'coming-soon') return 'Coming Soon';
    return 'Released';
  }

  function buildTickerItem(app) {
    var badge = '';
    if (app.isNew && app.status === 'released') {
      badge = '<span class="app-ticker-badge app-ticker-badge--new">New</span>';
    } else if (app.status === 'in-development') {
      badge = '<span class="app-ticker-badge app-ticker-badge--beta">Beta</span>';
    } else if (app.status === 'coming-soon') {
      badge = '<span class="app-ticker-badge app-ticker-badge--soon">Soon</span>';
    }

    var iconEl = app.icon
      ? '<img class="app-ticker-icon" src="' + app.icon + '" alt="" width="44" height="44" />'
      : '<span class="app-ticker-icon app-ticker-icon--color" style="background:' + app.color + '"></span>';

    var href = (app.status === 'in-development' && app.betaLink) ? app.betaLink : app.href;
    var target = (app.status === 'in-development' && app.betaLink) ? ' target="_blank" rel="noopener noreferrer"' : '';
    var fadedStyle = app.status === 'coming-soon' ? ' style="opacity:0.45"' : '';

    var nameEl = app.placeholder ? '' : '<span class="app-ticker-name">' + app.name + '</span>';

    return (
      '<a class="app-ticker-link" href="' + href + '" aria-label="' + app.name + ' — ' + statusLabel(app) + '"' + target + fadedStyle + '>' +
        '<span class="app-ticker-item">' +
          '<span class="app-ticker-icon-wrap">' + iconEl + badge + '</span>' +
          nameEl +
        '</span>' +
      '</a>'
    );
  }

  function buildTestersBar() {
    var betaApps = FOCAL_STUDIO_APPS.filter(function (app) {
      return app.status === 'in-development' && app.betaLink;
    });
    if (!betaApps.length) return null;

    var app = betaApps[0];
    var bar = document.createElement('div');
    bar.className = 'testers-bar';
    bar.innerHTML =
      '<div class="container">' +
        '<div class="testers-bar-inner">' +
          '<span>🧪 Testing <strong>' + app.name + '</strong> — help us ship it.</span>' +
          '<a class="testers-bar-link" href="' + app.betaLink + '" target="_blank" rel="noopener noreferrer">Join Beta →</a>' +
        '</div>' +
      '</div>';
    return bar;
  }

  var ICON_WIDTH = 44; /* keep in sync with CSS */

  /* Space icons so exactly one set fills the strip width, then the
     translateX(-50%) loop point hides the duplicate set perfectly. */
  function applySpacing(track, outerWidth) {
    var n = FOCAL_STUDIO_APPS.length;
    if (!n) return;
    var margin = Math.max(24, Math.round(outerWidth / n - ICON_WIDTH));
    Array.prototype.forEach.call(track.querySelectorAll('.app-ticker-link'), function (link) {
      link.style.marginRight = margin + 'px';
    });
  }

  function renderAppTickers() {
    var hosts = Array.prototype.slice.call(document.querySelectorAll('[data-app-carousel]'));
    if (!hosts.length) return;

    /* Two copies: one set = viewportWidth, so translateX(-50%) hides
       exactly the duplicate — you never see the same app twice. */
    var singleSet = FOCAL_STUDIO_APPS.map(buildTickerItem).join('');

    hosts.forEach(function (host) {
      host.innerHTML =
        '<div class="app-ticker-outer">' +
          '<div class="app-ticker-track">' +
            singleSet + singleSet +
          '</div>' +
        '</div>';

      var outer = host.querySelector('.app-ticker-outer');
      var track = host.querySelector('.app-ticker-track');

      window.requestAnimationFrame(function () {
        applySpacing(track, outer.clientWidth);
        track.classList.add('is-ready');
      });

      var resizeTimer;
      window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
          track.classList.remove('is-ready');
          applySpacing(track, outer.clientWidth);
          track.classList.add('is-ready');
        }, 150);
      });

      var bar = buildTestersBar();
      if (bar) host.parentNode.insertBefore(bar, host.nextSibling);
    });
  }

  renderAppTickers();
})();

/* Center linked app targets on the catalog page */
(function () {
  function isAppsPage() {
    return /\/apps\.html$/.test(window.location.pathname) || /\/$/.test(window.location.pathname) && /apps\.html/.test(window.location.href);
  }

  function scrollHashTargetToCenter() {
    var targetId;
    var target;

    if (!isAppsPage() || !window.location.hash) {
      return;
    }

    targetId = decodeURIComponent(window.location.hash.slice(1));
    target = document.getElementById(targetId);

    if (!target) {
      return;
    }

    window.requestAnimationFrame(function () {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    });
  }

  if (!isAppsPage()) {
    return;
  }

  window.addEventListener('hashchange', scrollHashTargetToCenter);
  window.addEventListener('load', scrollHashTargetToCenter);
})();
