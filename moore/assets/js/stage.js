/* Scales the fixed 800x550 composition to the viewport, and runs the
   original "loading photographs" preloader until the artwork is decoded.

   Deliberately a classic script rather than an ES module: modules are fetched
   under CORS rules, which file:// URLs always fail, and this archive should
   open by double-clicking index.html as well as over HTTP. */
window.mooreStage = (function () {
  'use strict';

  var STAGE_W = 800;
  var STAGE_H = 550;
  var BREAKPOINT = 860;   // below this the CSS hands over to a flow layout
  var MAX_SCALE = 1.75;

  function fitStage(stage) {
    var viewport = stage.parentElement;

    function apply() {
      if (window.innerWidth < BREAKPOINT) {
        stage.style.removeProperty('--s');
        viewport.style.removeProperty('height');
        return;
      }
      var padding = 48;
      var s = Math.min(
        (window.innerWidth - padding) / STAGE_W,
        (window.innerHeight - padding) / STAGE_H,
        MAX_SCALE
      );
      stage.style.setProperty('--s', s);
      // the transform doesn't affect layout, so give the wrapper the real height
      viewport.style.height = (STAGE_H * s + padding) + 'px';
    }

    apply();
    // resize fires far faster than we can usefully re-layout
    var queued = false;
    window.addEventListener('resize', function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; apply(); });
    }, { passive: true });
  }

  /** Resolves once every image in `urls` has loaded (or failed). */
  function preload(urls) {
    return Promise.all(urls.map(function (src) {
      return new Promise(function (resolve) {
        var img = new Image();
        img.onload = img.onerror = resolve;
        img.src = src;
      });
    }));
  }

  function reveal(stage) {
    var loader = document.querySelector('.loader');
    if (loader && !loader.hidden) {
      loader.classList.add('is-done');
      loader.addEventListener('transitionend', function () { loader.hidden = true; },
                              { once: true });
      setTimeout(function () { loader.hidden = true; }, 500);
    }
    stage.classList.add('is-ready');
  }


  /* ------------------------------------------------- sticky roll-over
     Shared by the contact sheets and the splash nav, because both want the
     same thing and both have the same obstruction.

     The thing they want: rolling onto one item holds it at full strength and
     sends the rest back, and *leaving* it does nothing. The item stays lit
     until another takes over or the pointer leaves the group altogether. The
     alternative — releasing on pointerleave — makes the whole group flare
     back up in every gap between two items, and a sheet with a gutter a third
     of a cell wide is mostly gap.

     The obstruction: "left the group" cannot be a pointerleave. Both the
     contact sheets and the nav position their children absolutely, so the
     container collapses to a box the pointer is never inside. The bound is
     measured instead, from the union of the items' own rectangles, cached
     while a roll-over is live and re-measured on resize and scroll.

     opts.bounds  elements defining the region, if not `items` themselves
     opts.slack   px of forgiveness around it (default 24)
     opts.light   called with the item to light
     opts.clear   called with the item that was lit, or null  */
  function sticky(items, opts) {
    opts = opts || {};
    var bounds = opts.bounds || items;
    var slack = opts.slack == null ? 24 : opts.slack;
    var lit = null, box = null, watching = false;

    function measure() {
      var l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
      for (var i = 0; i < bounds.length; i++) {
        var k = bounds[i].getBoundingClientRect();
        if (!k.width && !k.height) continue;
        l = Math.min(l, k.left);  t = Math.min(t, k.top);
        r = Math.max(r, k.right); b = Math.max(b, k.bottom);
      }
      box = r > l ? { l: l - slack, t: t - slack, r: r + slack, b: b + slack } : null;
    }
    function onMove(e) {
      if (!box) return;
      if (e.clientX < box.l || e.clientX > box.r ||
          e.clientY < box.t || e.clientY > box.b) release();
    }
    function restale() { if (watching) measure(); }
    function watch() {
      if (watching) return;
      watching = true;
      measure();
      document.addEventListener('pointermove', onMove, { passive: true });
      // the pointer can also leave without a further move — out of the window
      // entirely, or into another tab
      document.documentElement.addEventListener('pointerleave', release);
      window.addEventListener('blur', release);
      window.addEventListener('resize', restale);
      window.addEventListener('scroll', restale, { passive: true });
    }
    function unwatch() {
      if (!watching) return;
      watching = false;
      document.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', release);
      window.removeEventListener('blur', release);
      window.removeEventListener('resize', restale);
      window.removeEventListener('scroll', restale);
    }
    function light(el) {
      if (lit === el) return;
      if (lit && opts.clear) opts.clear(lit);
      lit = el;
      if (opts.light) opts.light(el);
      watch();
    }
    function release() {
      unwatch();
      if (opts.clear) opts.clear(lit);
      lit = null;
    }
    for (var i = 0; i < items.length; i++) {
      (function (el) {
        el.addEventListener('pointerenter', function () { light(el); });
        // no pointerleave: that is the whole point
        el.addEventListener('focus', function () { light(el); });
        el.addEventListener('blur', function () { if (lit === el) release(); });
      })(items[i]);
    }
    return { release: release, current: function () { return lit; } };
  }

  /* The splash nav, which has no current section to anchor the eye: the whole
     list stands at full strength until you reach for it. */
  function stickyNav(nav) {
    if (!nav) return null;
    var items = nav.querySelectorAll('.nav-item');
    return sticky(items, {
      light: function (el) { nav.dataset.lit = '1'; el.dataset.lit = '1'; },
      clear: function (el) { if (el) delete el.dataset.lit; delete nav.dataset.lit; }
    });
  }

  function boot(stage, urls) {
    fitStage(stage);

    // Never let a stalled image keep the preloader up forever.
    var timeout = new Promise(function (resolve) { setTimeout(resolve, 8000); });
    var ready = Promise.all([
      preload(urls || []),
      document.fonts ? document.fonts.ready : Promise.resolve()
    ]);

    return Promise.race([ready, timeout]).then(function () { reveal(stage); });
  }

  return { boot: boot, fitStage: fitStage, preload: preload, reveal: reveal,
           sticky: sticky, stickyNav: stickyNav };
})();
