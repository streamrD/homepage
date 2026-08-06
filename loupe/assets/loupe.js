/* loupe — the engine, for both page types.
 *
 * One file, two modes, decided by what is in the markup:
 *
 *   #stage + #rail   the entry page — plates, the fly-in, the full choreography
 *   #grid            a section page — fade only, no motion to speak of
 *
 * Everything else (tokens, manifest, the enlargement, keyboard, deep links)
 * is shared, which is the point: a section page is not a second engine, it
 * is this one with the choreography left out.
 *
 * Every duration and distance comes from the theme's custom properties, so a
 * theme governs motion as completely as it governs colour.
 */
(function () {
  'use strict';

  var root = document.documentElement;

  // --- theme tokens ----------------------------------------------------

  function raw(name) {
    return getComputedStyle(root).getPropertyValue(name).trim();
  }

  // A duration token, in milliseconds, however the theme spelled it.
  function tok(name, fallback) {
    var v = raw(name);
    if (!v) return fallback;
    if (/ms$/.test(v)) return parseFloat(v);
    if (/s$/.test(v))  return parseFloat(v) * 1000;
    var n = parseFloat(v);
    return isNaN(n) ? fallback : n;
  }

  // A bare number token — px, deg or unitless, all read the same way.
  function px(name, fallback) {
    var n = parseFloat(raw(name));
    return isNaN(n) ? fallback : n;
  }

  // --- chrome axes -----------------------------------------------------

  var Q = new URLSearchParams(location.search);

  // Demo scaffolding: ?mat= and ?duo= force the two axes on regardless of
  // what the theme asked for, so one theme can be judged both ways without
  // being edited. A real gallery sets these in its theme file and drops the
  // query handling entirely.
  if (Q.get('mat')) {
    root.style.setProperty('--plate-base', '100vmin');
    root.style.setProperty('--plate-inset', Q.get('mat') === '1' ? '9' : Q.get('mat'));
    root.style.setProperty('--plate-fit', 'contain');
    root.style.setProperty('--drift-scale', '1');   // a mat must not drift
  }
  if (Q.get('duo')) root.style.setProperty('--rail-duotone', '1');

  // Blend modes cannot be turned off by a custom property, so the token
  // becomes a class here and the themes stay pure token blocks.
  if (px('--rail-duotone', 0)) document.documentElement.classList.add('duotone');

  // --- manifest --------------------------------------------------------

  var el = document.getElementById('gallery');
  var G;
  try {
    G = JSON.parse(el.textContent);
  } catch (e) {
    document.body.innerHTML =
      '<pre style="padding:40px;color:#c00">loupe: the gallery manifest is not valid JSON\n\n' +
      String(e) + '</pre>';
    return;
  }

  var BASE  = G.base || '';
  var ITEMS = (G.items || []).slice(0, G.max || 10);
  var INTRO = (G.intro || []).slice(0, 3);

  function src(p) { return /^(https?:|\/)/.test(p) ? p : BASE + p; }

  // Demo-only: carry every demo flag across internal links, so a whole path
  // can be walked in one configuration. Carrying only `theme` meant
  // descending into a section silently dropped the photographs and the two
  // chrome axes, and coming back up landed on the filler. A real gallery
  // hardcodes all of this in its theme file and drops the query handling.
  var CARRY = ['theme', 'tiles', 'mat', 'duo', 'assets'];
  function withTheme(href) {
    if (/^(https?:|#)/.test(href)) return href;
    var keep = CARRY.filter(function (k) { return Q.get(k); })
                    .map(function (k) { return k + '=' + encodeURIComponent(Q.get(k)); });
    if (!keep.length) return href;
    return href + (href.indexOf('?') < 0 ? '?' : '&') + keep.join('&');
  }

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // The opening is a curtain-raiser, not a toll. Coming back up from a
  // section must not make you sit through it again, so a flag for the tab's
  // lifetime routes returning visitors down the same instant path that
  // prefers-reduced-motion already uses. sessionStorage throws in some
  // privacy modes, hence the guards.
  function seenIntro(set) {
    try {
      if (set) { sessionStorage.setItem('loupe:intro', '1'); return true; }
      return sessionStorage.getItem('loupe:intro') === '1';
    } catch (e) { return false; }
  }

  var instant = reduced || seenIntro();
  var rail  = document.getElementById('rail');
  var grid  = document.getElementById('grid');
  var stage = document.getElementById('stage');
  var light = document.getElementById('light');
  var mount = document.getElementById('light-mount');
  var lightImg  = document.getElementById('light-img');
  var lightMeta = document.getElementById('light-meta');

  var timers = [];
  function at(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }

  // --- the credit block, shared -----------------------------------------

  var trailEl = document.querySelector('#plate-text .t');
  var subEl   = document.querySelector('#plate-text .s');

  // The title line doubles as the breadcrumb. It is the only way up from a
  // section, so it is deliberately in the one place the eye already goes.
  if (G.trail && G.trail.length) {
    trailEl.innerHTML = G.trail.map(function (step, i) {
      var last = i === G.trail.length - 1;
      return last || !step.href
        ? '<span>' + step.label + '</span>'
        : '<a href="' + withTheme(step.href) + '">' + step.label + '</a>';
    }).join('<i>/</i>');
  } else {
    trailEl.textContent = G.title || '';
  }
  subEl.textContent = G.credit || '';
  if (G.title) document.title = G.title;

  // --- the enlargement, shared ------------------------------------------

  var openIdx = -1;
  var showSeq = 0;

  function mark(hash) {
    if (history.replaceState) {
      history.replaceState(null, '', hash || location.pathname + location.search);
    }
  }

  function show(i) {
    openIdx = i;
    var item = ITEMS[i];
    mount.classList.remove('shown');
    lightImg.alt = item.alt || '';
    lightMeta.textContent = item.label || ((item.id || (i + 1)) + ' / ' + ITEMS.length);
    document.body.classList.add('lit');
    mark('#' + (item.id || (i + 1)));

    // Hold arrows down and several loads are in flight at once. Without the
    // sequence check a slow earlier frame can land after a fast later one
    // and leave the wrong photograph under the right caption.
    var mine = ++showSeq;
    var im = new Image();
    var done = false;
    im.onload = function () {
      if (done || mine !== showSeq) return;
      done = true;
      lightImg.src = im.src;
      requestAnimationFrame(function () { mount.classList.add('shown'); });
    };
    im.src = src(item.full);
    if (im.complete) im.onload();
  }

  function close() {
    if (openIdx < 0) return;
    openIdx = -1;
    mount.classList.remove('shown');
    document.body.classList.remove('lit');
    mark('');
  }

  light.addEventListener('click', close);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { close(); return; }
    if (openIdx >= 0 && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
      e.preventDefault();
      show((openIdx + (e.key === 'ArrowRight' ? 1 : ITEMS.length - 1)) % ITEMS.length);
    }
  });

  // --- building a thumbnail, shared -------------------------------------

  function thumbNode(item, i, cls) {
    var node;
    if (item.href) {
      // A thumbnail can lead somewhere instead of enlarging. That is the
      // whole hook a section needs; the engine knows nothing about depth.
      node = document.createElement('a');
      node.href = withTheme(item.href);
    } else {
      node = document.createElement('button');
      node.type = 'button';
      node.addEventListener('click', function () { if (gate()) show(i); });
      node.addEventListener('mouseenter', function () {
        new Image().src = src(item.full);
      }, { once: true });
    }
    node.className = cls;
    node.setAttribute('aria-label', item.alt || ('Item ' + (i + 1) + ' of ' + ITEMS.length));
    node.innerHTML =
      '<img src="' + src(item.thumb) + '" alt="" decoding="async" loading="lazy">' +
      '<span class="n">' + (item.id || (i + 1)) + '</span>';
    return node;
  }

  var live = false;
  function gate() { return live; }

  // How much room the credit has is a function of how wide the rail actually
  // is, which depends on the item count, the theme's thumbnail size and its
  // gap. Measuring beats any constant: ten 78px thumbnails are 897px, and a
  // token calibrated for five puts the credit underneath them. Both page
  // types carry a rail, so both need this.
  function sizeCredit() {
    if (!rail || !rail.children.length) return;
    var r = rail.getBoundingClientRect();
    root.style.setProperty('--credit-max',
      Math.max(160, Math.round(r.left - px('--credit-gutter', 44))) + 'px');
  }

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(sizeCredit, 120);
  });

  // ======================================================================
  // section mode — fade only
  // ======================================================================

  if (grid) {
    if (G.plate) {
      var back = document.createElement('img');
      back.src = src(G.plate);
      back.alt = '';
      back.id = 'backdrop';
      document.body.appendChild(back);
    }

    ITEMS.forEach(function (item, i) {
      grid.appendChild(thumbNode(item, i, 'cell'));
    });

    // The whole top level, carried along, so a section is a place you can
    // cross from and not only climb out of.
    if (rail && G.rail) {
      G.rail.forEach(function (item, i) {
        var a = document.createElement('a');
        a.href = withTheme(item.href);
        a.className = 'thumb' + (item.current ? ' current' : '');
        if (item.current) a.setAttribute('aria-current', 'page');
        a.setAttribute('aria-label', item.alt || ('Section ' + (i + 1)));
        a.innerHTML =
          '<img src="' + src(item.thumb) + '" alt="" decoding="async">' +
          '<span class="n">' + (item.id || (i + 1)) + '</span>';
        rail.appendChild(a);
      });
      rail.classList.add('live');
      sizeCredit();
    }

    var cells = grid.querySelectorAll('.cell');
    var gs = reduced ? 0 : tok('--grid-stagger', 60);

    requestAnimationFrame(function () {
      document.body.classList.add('ready');
      Array.prototype.forEach.call(rail ? rail.children : [], function (t) {
        t.classList.add('settled');
      });
      Array.prototype.forEach.call(cells, function (c, i) {
        at(function () { c.classList.add('in'); }, i * gs);
      });
      at(function () { live = true; grid.classList.add('live'); }, cells.length * gs + 200);
    });

    var d = ITEMS.map(function (it, i) { return String(it.id || (i + 1)); })
                 .indexOf(location.hash.slice(1));
    if (d >= 0) at(function () { show(d); }, 60);
    return;
  }

  // ======================================================================
  // entry mode — the full choreography
  // ======================================================================

  var plates  = [];
  var thumbs  = [];
  var current = -1;

  INTRO.forEach(function (path) {
    var plate = document.createElement('div');
    plate.className = 'plate';
    var img = document.createElement('img');
    img.src = src(path);
    img.alt = '';
    img.decoding = 'async';
    plate.appendChild(img);
    stage.appendChild(plate);
    plates.push(plate);
  });

  ITEMS.forEach(function (item, i) {
    var n = thumbNode(item, i, 'thumb');
    rail.appendChild(n);
    thumbs.push(n);
  });

  function showPlate(i) {
    if (current === i) return;
    if (current >= 0) {
      plates[current].classList.remove('on', 'resting');
      plates[current].classList.add('out');
    }
    plates[i].classList.remove('out');
    plates[i].classList.add('on');
    current = i;
  }

  function settleRail() {
    document.body.classList.add('ready');
    sizeCredit();

    var cx = window.innerWidth / 2;
    var cy = window.innerHeight / 2;
    var R      = px('--scatter-radius', 110);
    var spread = px('--scatter-spread', 136);
    var tilt   = px('--thumb-tilt', 9);
    var n      = thumbs.length;

    thumbs.forEach(function (t, i) {
      var r = t.getBoundingClientRect();
      var f = n > 1 ? i / (n - 1) : 0.5;
      // A fixed arc divided by however many there are, so ten thumbnails fan
      // out over the same sweep five do rather than wrapping the circle.
      var ang = (-90 - spread / 2 + spread * f) * Math.PI / 180;
      var rad = R * (0.75 + 0.5 * f);
      var sx  = cx + Math.cos(ang) * rad;
      var sy  = cy + Math.sin(ang) * rad * 0.78;
      t.style.setProperty('--dx', (sx - (r.left + r.width / 2)).toFixed(1) + 'px');
      t.style.setProperty('--dy', (sy - (r.top + r.height / 2)).toFixed(1) + 'px');
      t.style.setProperty('--rot', ((i % 2 ? 1 : -1) * tilt * (0.5 + f)).toFixed(1) + 'deg');
    });

    void rail.offsetWidth;   // lock in the scattered start before animating

    var stagger = instant ? 0 : tok('--stagger', 130);
    thumbs.forEach(function (t, i) {
      t.classList.add('animate');
      at(function () { t.classList.add('settled'); }, i * stagger);
    });

    at(function () {
      live = true;
      rail.classList.add('live');
      document.body.classList.add('live');
    }, instant ? 0 : (thumbs.length - 1) * stagger + tok('--settle', 1250));
  }

  function land() {
    var grow = instant ? 0 : tok('--grow', 1500);
    at(function () { plates[plates.length - 1].classList.add('resting'); }, grow);
    at(settleRail, instant ? 0 : grow + 300);
  }

  function finish() {
    clearTimers();
    seenIntro(true);   // played, or skipped — either way, not again this tab
    showPlate(plates.length - 1);
    land();
  }

  function run() {
    if (instant || plates.length < 2) { finish(); return; }
    var burst = tok('--burst', 2000);
    showPlate(0);
    for (var i = 1; i < plates.length - 1; i++) {
      (function (k) { at(function () { showPlate(k); }, burst * k); })(i);
    }
    at(finish, burst * (plates.length - 1));
  }

  document.addEventListener('click', function (e) {
    if (live || openIdx >= 0 || current === plates.length - 1) return;
    if (e.target.closest && e.target.closest('#rail, #plate-text')) return;
    finish();
  });

  var deep = ITEMS.map(function (it, i) { return String(it.id || (i + 1)); })
                  .indexOf(location.hash.slice(1));

  var started = false;
  function start() {
    if (started) return;
    started = true;
    if (deep >= 0) { finish(); show(deep); } else { run(); }
  }

  Promise.all(INTRO.map(function (p) {
    var im = new Image();
    im.src = src(p);
    return im.decode ? im.decode().catch(function () {}) : Promise.resolve();
  })).then(start);

  setTimeout(start, 3500);   // never let a slow network hold the door
})();
