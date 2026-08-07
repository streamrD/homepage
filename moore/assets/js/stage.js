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

  return { boot: boot, fitStage: fitStage, preload: preload, reveal: reveal };
})();
