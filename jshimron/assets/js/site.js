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

  /* --- fit the stage to the viewport ------------------------------ */

  function fit() {
    var scale = Math.min(1, window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
    stage.style.setProperty('--scale', scale);
    // Keep the page from scrolling: the stage is transform-scaled, so its
    // layout box stays 1000x714 and would otherwise overflow.
    document.body.style.height = (STAGE_H * scale) + 'px';
  }

  fit();
  window.addEventListener('resize', fit);

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

  function show(id) {
    var fig = document.getElementById('full-' + id);
    if (!fig) return;
    if (open && open !== fig) open.classList.remove('is-open');
    open = fig;
    current = id;
    fig.classList.add('is-open');
    thumbs.classList.add('is-hidden');
    warmNeighbours(id);
  }

  function hide() {
    if (open) open.classList.remove('is-open');
    open = null;
    current = null;
    thumbs.classList.remove('is-hidden');
  }

  thumbs.addEventListener('click', function (e) {
    var link = e.target.closest('.thumb');
    if (!link) return;
    e.preventDefault();
    // The hash makes each photo linkable; hashchange does the actual showing.
    location.hash = link.dataset.photo;
  });

  // Clicking the open photo puts the grid back, exactly as the original did.
  stage.addEventListener('click', function (e) {
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

  thumbs.addEventListener('mouseover', function (e) {
    var link = e.target.closest('.thumb');
    if (link) warm(link.href);
  });

  /* Last, because a deep-linked hash calls show() -> warmNeighbours() -> warm(),
     and `warmed` must already be initialised by then. */
  window.addEventListener('hashchange', sync);
  sync();
})();
