/* ------------------------------------------------------------------
   Joseph Shimron — Photographs, 1962-1968

   Two jobs, both small:
     1. scale the fixed 1000x714 stage to fit the viewport
     2. reproduce the original's thumb -> enlargement fade

   The markup works without any of this: thumbs are ordinary links to
   the full-size JPEGs.
   ------------------------------------------------------------------ */

(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');

  var STAGE_W = 1000;
  var STAGE_H = 714;
  var stage = document.querySelector('.stage');
  if (!stage) return;

  /* --- fit the stage to the viewport ------------------------------

     Two layouts. Landscape scales the whole 1000x714 stage down to fit.
     Portrait does not scale it at all — the stage becomes the viewport,
     the background photograph fills it, and only the grid is scaled, so
     that it can never collide with the wordmark on a short screen.

     The media query is duplicated from site.css deliberately: they have
     to agree, and a mismatch would leave portrait CSS applied with
     landscape measurements. Keep them in step.                       */

  var PORTRAIT = window.matchMedia('(orientation: portrait) and (max-width: 540px)');

  var GRID_SCALE_MAX = 0.85;   // caps how much of the photograph the grid may cover
  var WM_MAX = 340;            // wordmark width, px
  var WM_RATIO = 34.805 / 388.569;
  var NAV_BAND = 92;           // nav tiles at the top, plus breathing room

  function px(name, fallback) {
    var v = parseFloat(getComputedStyle(stage).getPropertyValue(name));
    return isNaN(v) ? fallback : v;
  }

  function fitPortrait() {
    var vw = window.innerWidth;
    var vh = stage.clientHeight || window.innerHeight;

    var wmW = Math.min(WM_MAX, vw - 28);
    var gridBottom = Math.round(13 + wmW * WM_RATIO + 22);

    stage.style.setProperty('--wm-w', wmW + 'px');
    stage.style.setProperty('--grid-bottom', gridBottom + 'px');

    var gw = px('--grid-w', 0);
    if (gw) {
      var gh = px('--grid-h', 507);
      stage.style.setProperty('--gscale', Math.min(
        GRID_SCALE_MAX,
        (vw - 24) / gw,
        (vh - gridBottom - NAV_BAND) / gh
      ));
    }

    stage.style.removeProperty('--scale');
  }

  function fit() {
    if (PORTRAIT.matches) return fitPortrait();
    // Scale only. Where the stage sits is CSS's business: the body is a
    // viewport-height flex centre, and the stage scales about its own
    // middle, so the artwork stays centred at every scale.
    stage.style.setProperty('--scale',
      Math.min(1, window.innerWidth / STAGE_W, window.innerHeight / STAGE_H));
  }

  fit();
  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', fit);

  /* --- enlargements ----------------------------------------------- */

  var thumbs = stage.querySelector('.thumbs');
  if (!thumbs) return;

  var open = null;
  var current = null;   // id of the open photograph, updated synchronously

  // The twelve photographs of this page, in grid reading order — which is the
  // order build.py emits them in. Arrow-key stepping walks this list.
  var ids = Array.prototype.map.call(
    stage.querySelectorAll('.full'),
    function (fig) { return fig.id.replace(/^full-/, ''); }
  );

  // Position dots. build.py emits one per photograph; CSS shows them only in
  // portrait and only while a photograph is open, so all this does is move
  // the filled one. Empty on the cover, where there is no pager.
  var dots = stage.querySelectorAll('.pager i');

  function mark(i) {
    for (var d = 0; d < dots.length; d++) {
      dots[d].classList.toggle('is-on', d === i);
    }
  }

  function show(id) {
    var fig = document.getElementById('full-' + id);
    if (!fig) return;
    if (open && open !== fig) open.classList.remove('is-open');
    open = fig;
    current = id;
    fig.classList.add('is-open');
    thumbs.classList.add('is-hidden');
    light(null);   // the grid is going away; don't bring a lit thumb back with it
    mark(ids.indexOf(id));
    warmNeighbours(id);
  }

  function hide() {
    if (open) open.classList.remove('is-open');
    open = null;
    current = null;
    thumbs.classList.remove('is-hidden');
    mark(-1);
  }

  thumbs.addEventListener('click', function (e) {
    var link = e.target.closest('.thumb');
    if (!link) return;
    e.preventDefault();
    // The hash makes each photo linkable; hashchange does the actual showing.
    location.hash = link.dataset.photo;
  });

  // Clicking the open photo puts the grid back, exactly as the original did.
  // A swipe ends in a click too, so a step suppresses the next one — without
  // this, every swipe would step to the next photograph and then close it.
  var swiped = false;

  stage.addEventListener('click', function (e) {
    if (swiped) { swiped = false; return; }
    if (e.target.closest('.full.is-open')) location.hash = '';
  });

  /* Step to the next or previous photograph, wrapping at either end.

     `current` advances synchronously rather than being re-read from the DOM,
     because hashchange is asynchronous: a held-down arrow key can fire faster
     than the event drains, and reading stale state would drop or repeat steps. */
  function step(delta) {
    if (!current) return;
    var i = ids.indexOf(current);
    if (i < 0) return;
    current = ids[(i + delta + ids.length) % ids.length];
    location.hash = current;
  }

  /* Swipe does on a phone what the arrow keys do on a desktop. Horizontal
     intent only: a mostly-vertical drag is left alone, and so is anything
     too short to be deliberate. */
  var SWIPE_MIN = 45;
  var touch = null;

  stage.addEventListener('touchstart', function (e) {
    if (!current || e.touches.length !== 1) return;
    touch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });

  stage.addEventListener('touchend', function (e) {
    if (!touch || !current) return;
    var t = e.changedTouches[0];
    var dx = t.clientX - touch.x;
    var dy = t.clientY - touch.y;
    touch = null;
    if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) < Math.abs(dy)) return;
    swiped = true;
    step(dx < 0 ? 1 : -1);
  }, { passive: true });

  document.addEventListener('keydown', function (e) {
    // Leave modified presses alone — those are browser shortcuts.
    if (e.altKey || e.ctrlKey || e.metaKey) return;

    if (e.key === 'Escape' && open) {
      location.hash = '';
    } else if (current && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
      e.preventDefault();
      step(e.key === 'ArrowRight' ? 1 : -1);
    }
  });

  function sync() {
    var id = location.hash.replace(/^#/, '');
    if (id) show(id); else hide();
  }

  /* Preloading, so a fade never stalls on a photograph that is still
     downloading: on thumb hover, and — since arrow keys make the next photo
     one keypress away — on either side of whatever is open. */
  var warmed = {};

  function warm(url) {
    if (!url || warmed[url]) return;
    warmed[url] = true;
    new Image().src = url;
  }

  function warmNeighbours(id) {
    var i = ids.indexOf(id);
    if (i < 0) return;
    [(i + 1) % ids.length, (i - 1 + ids.length) % ids.length].forEach(function (j) {
      var img = document.querySelector('#full-' + ids[j] + ' .full__img');
      if (img) warm(img.src);
    });
  }

  /* --- sticky roll-over -------------------------------------------

     Which thumb is lit is held here rather than left to :hover, because
     the grid has gaps in it — 29 to 38px, depending on the page, against
     a 100px cell — so a third of any crossing is spent over no thumb at
     all. Releasing on the way out of a thumb would drop it back to the
     dim and light it again on landing, and reading along a row would
     strobe.

     So leaving a thumb does nothing. The lit one stays lit until another
     takes over, or until the pointer leaves the field, which is the
     padded box .thumbs draws around the grid. CSS reads .is-lit; see the
     note above .thumbs:hover in site.css.                             */

  var lit = null;

  function light(link) {
    if (lit === link) return;
    if (lit) lit.classList.remove('is-lit');
    lit = link;
    if (link) link.classList.add('is-lit');
  }

  thumbs.addEventListener('mouseover', function (e) {
    var link = e.target.closest('.thumb');
    if (!link) return;
    light(link);
    warm(link.href);
  });

  // Leaving the field is the one thing that puts the grid back to rest.
  // Clearing it matters even though :hover has already lifted the dim by
  // then: a stale .is-lit would show through the next time the pointer
  // came in over a gap.
  thumbs.addEventListener('mouseleave', function () { light(null); });

  /* Last, because a deep-linked hash calls show() -> warmNeighbours() -> warm(),
     and `warmed` must already be initialised by then. */
  window.addEventListener('hashchange', sync);
  sync();
})();
