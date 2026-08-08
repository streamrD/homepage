/* Kodachromes gallery.

   Reproduces the interaction from kodachromes.swf:
     - rolling over a thumbnail fades every other one to 20%  (7 frames)
     - clicking one fades the whole grid out and the enlargement in (9 frames),
       and the caption appears the instant the fade completes
     - clicking the enlargement reverses both

   Added for the web version: deep links (#1 .. #20), Escape to go back, and
   arrow keys to step through the set. The annotations live in the page as
   ordinary markup (section.entries) and are lifted into the viewer on demand,
   so they still read and index with JavaScript off.

   Classic script, not a module, so the page also works from a file:// URL. */
(function () {
'use strict';

const boot = window.mooreStage.boot;

const stage    = document.getElementById('stage');
const grid     = document.getElementById('grid');
const viewer   = document.getElementById('viewer');
const photo    = viewer.querySelector('.viewer-photo');
const photoImg = photo.querySelector('.face-recto');
const versoImg = photo.querySelector('.face-verso');
const caption  = viewer.querySelector('.viewer-caption');
const turn     = viewer.querySelector('.viewer-turn');

const thumbs = [...grid.querySelectorAll('.thumb')];
const count  = thumbs.length;

let current = null;
let lastFocused = null;
// the frames of a grouped card, and where in them we are
let cycle = null, at = 0;

const entryFor = n => document.getElementById(`slide-${n}`);

/* Focus we move ourselves — on opening, on every arrow-key step, and on the
   way back to the sheet — should not draw a ring. The reader already knows
   where they are; the ring reads as a stray black box round the photograph.
   Focus the user *tabs* to still shows, which is the case the indicator
   exists for.

   The flag lives on the document rather than on the viewer, because the
   return from an enlargement lands on a thumbnail — outside the viewer — and
   that is the one that reads worst: the stage is scaled up to 1.75, so a 2px
   outline at a 2px offset is drawn as a heavy black box around one frame of
   an otherwise quiet contact sheet. */
function focusQuietly(el) {
  document.documentElement.dataset.quiet = '1';
  el.focus({ preventScroll: true });
}
const speak = () => { delete document.documentElement.dataset.quiet; };
addEventListener('keydown', e => { if (e.key === 'Tab') speak(); }, true);
addEventListener('pointerdown', speak, true);

/* --------------------------------------------------------- image priming
   The enlargements are only referenced from the thumbnails, so without this
   the fetch starts on click and the fade runs over an empty frame. Prime on
   hover or focus, and quietly fetch the rest once the page is idle. */
const primed = new Map();

function prime(url) {
  if (!primed.has(url)) {
    const img = new Image();
    img.src = url;
    primed.set(url, { img, done: img.decode ? img.decode().catch(() => {})
                                            : Promise.resolve() });
  }
  return primed.get(url).done;
}

/** Has this URL already finished loading? Then it can be painted this frame. */
function ready(url) {
  const p = primed.get(url);
  return !!p && p.img.complete && p.img.naturalWidth > 0;
}

/* Which file the browser will actually choose for this frame.
   Thirty of the 1965-2004 enlargements now have a 2x cut, so on a retina
   screen the idle sweep below would warm 8MB in the background if it took
   them. It warms the 1x only; the 2x is fetched for the frame you reach for,
   which is the one you are about to open. Priming the same URL the srcset
   will resolve to is what stops it being fetched twice. */
const best = b => (window.devicePixelRatio > 1.3 && b.dataset.full2x)
  ? b.dataset.full2x : b.dataset.full;

const idle = window.requestIdleCallback || (fn => setTimeout(fn, 400));

// pushState is rejected on file:// (opaque origin), so deep links are a
// progressive nicety rather than something the viewer depends on
const setHash = url => { try { history.pushState({}, '', url); } catch { /* file:// */ } };

/* ------------------------------------------------------------- dimming
   Rolling over one frame fades the rest back, as the SWF did — but stickily:
   leaving a frame does nothing, and the lit one stays lit until another takes
   over or the pointer leaves the sheet. The section sheets set a gutter around
   a third of the cell, so releasing on pointerleave made the whole sheet flare
   back up between every pair of thumbnails.

   The mechanism is mooreStage.sticky, shared with the splash nav; the comment
   there explains why the sheet's bound has to be measured rather than taken
   from the container. Slots are in the bound but not in the items: an empty
   cell is part of the sheet you are still inside, but it lights nothing. */
const roll = window.mooreStage.sticky(thumbs, {
  bounds: grid.querySelectorAll('.thumb, .slot'),
  light: b => { grid.dataset.hover = '1'; b.dataset.hovered = '1'; prime(best(b)); },
  clear: b => { if (b) delete b.dataset.hovered; delete grid.dataset.hover; }
});

for (const button of thumbs) {
  button.addEventListener('click', () => open(Number(button.dataset.n)));
}

// the nav at the foot of the page rolls over the same way the sheet does
window.mooreStage.stickyNav(document.querySelector('.nav-gallery'));

/* -------------------------------------------------------------- viewer */
function open(n, { push = true } = {}) {
  const entry  = entryFor(n);
  const button = thumbs.find(t => Number(t.dataset.n) === n);
  if (!entry || !button) return;

  if (current === null) lastFocused = document.activeElement;
  current = n;

  const title = entry.querySelector('h2').textContent;
  const src = button.dataset.full;
  const hi = button.dataset.full2x;

  // shape the card to this print (recto and verso are the same object)
  const shot = entry.querySelector('img');
  if (shot?.getAttribute('width')) {
    viewer.style.setProperty('--ar',
      `${shot.getAttribute('width')} / ${shot.getAttribute('height')}`);
  }
  photo.setAttribute('aria-label', `${title} — back to the contact sheet`);
  /* Swap only once the frame has decoded, so stepping never blanks the box —
     but when it has *already* decoded, do it in this same frame, before the
     fade starts. The roll-over primes every enlargement you reach for, so
     that is the usual case; going through a promise there meant the picture
     landed a frame or two into a transition that had begun without it, which
     is the snap you can see at the start of the fade. */
  const paintRecto = () => {
    if (hi) photoImg.srcset = `${src} 1x, ${hi} 2x`;
    else photoImg.removeAttribute('srcset');
    photoImg.src = src;
    photoImg.alt = title;
  };
  if (ready(best(button))) paintRecto();
  else prime(best(button)).then(() => { if (current === n) paintRecto(); });

  /* The card can carry a second face, and there are two kinds.

     A *verso* is the back of a print somebody wrote on — one object, two
     sides, and it earns the turned-up corner that says so.

     An *other frame* is a second exposure of the same moment. It turns over
     the same way, because that is the gesture this viewer has, but it is not
     the back of anything: no corner, and the control says so too. Only
     `data-verso` sets `viewer.dataset.verso`, which is what draws the fold. */
  /* A card can carry any number of further frames — several shots of the same
     moment folded onto one cell, on the Kodachromes as on the section sheets.
     The flip becomes a cycle: the face you cannot see is loaded with whatever
     comes next, then the card turns, so it keeps turning through the set and
     round to the first. Two faces are enough for any number of frames.

     With more than two, the control cannot say "the first frame" on the way
     back, because it is not going back — it is going on. */
  const back  = button.dataset.verso;
  const many  = button.dataset.others ? JSON.parse(button.dataset.others) : null;
  const second = back || (many && many[0].full);
  const labels = back ? ['Turn over', 'Turn back']
               : many && many.length > 1 ? ['Another frame', 'Another frame']
               : ['Another frame', 'The first frame'];
  cycle = many ? [{ full: src, full2x: hi, alt: title }].concat(many) : null;
  at = 0;
  delete viewer.dataset.face;
  turn.hidden = !second;
  turn.textContent = labels[0];
  turn.dataset.labels = labels.join('|');
  // the turned corner is drawn off this, so it has to be set before the
  // enlargement fades in rather than when the reverse finishes decoding
  if (back) viewer.dataset.verso = '1'; else delete viewer.dataset.verso;
  if (many) {
    prime(second).then(() => {
      if (current !== n) return;
      paint(versoImg, many[0]);
    });
  } else if (back) {
    prime(back).then(() => {
      if (current !== n) return;
      versoImg.removeAttribute('srcset');
      versoImg.src = back;
      versoImg.alt = button.dataset.versoAlt || `${title} — reverse`;
    });
  } else {
    versoImg.removeAttribute('src');
    versoImg.removeAttribute('srcset');
    versoImg.alt = '';
  }

  caption.replaceChildren(...[...entry.querySelector('.entry-text').children]
    .map(node => node.cloneNode(true)));

  // the caption column sits where the SWF placed it for this slide
  viewer.style.setProperty('--cx', entry.dataset.cx);
  viewer.style.setProperty('--cy', entry.dataset.cy);
  viewer.style.setProperty('--cw', entry.dataset.cw);

  // drop the roll-over state before the sheet goes, so the dimmed siblings
  // aren't animating back up while the whole layer fades away
  roll.release();

  grid.dataset.state = 'out';
  viewer.dataset.open = '1';
  viewer.setAttribute('aria-hidden', 'false');
  focusQuietly(photo);

  if (push) setHash(`#${n}`);
}

function close({ push = true } = {}) {
  if (current === null) return;
  const n = current;
  current = null;

  delete viewer.dataset.open;
  delete viewer.dataset.step;
  delete viewer.dataset.face;
  viewer.setAttribute('aria-hidden', 'true');
  grid.dataset.state = 'in';

  const target = thumbs.find(t => Number(t.dataset.n) === n) || lastFocused;
  if (target) focusQuietly(target);

  if (push) setHash(location.pathname + location.search);
}

function step(delta) {
  if (current === null) return;
  viewer.dataset.step = '1';          // already open: swap without the entry delay
  open(((current - 1 + delta + count) % count) + 1);
}

function flip() {
  if (turn.hidden) return;
  const showing = viewer.dataset.face === 'verso';
  // On a grouped card, load the face that is *about* to come into view with
  // the next frame before turning to it. The one you are looking at is left
  // alone, so nothing changes under you mid-turn.
  if (cycle) {
    at = (at + 1) % cycle.length;
    const next = cycle[at];
    const img = showing ? photoImg : versoImg;
    prime(next.full).then(() => {
      if (cycle && cycle[at] === next) paint(img, next);
    });
  }
  if (showing) delete viewer.dataset.face;
  else viewer.dataset.face = 'verso';
  // the wording belongs to the kind of second face this frame has — a print's
  // back turns over, a second exposure does not
  const [front, reverse] = (turn.dataset.labels || 'Turn over|Turn back').split('|');
  turn.textContent = showing ? front : reverse;
}

/** Put one frame of a grouped card onto a face. */
function paint(img, frame) {
  if (frame.full2x) img.srcset = `${frame.full} 1x, ${frame.full2x} 2x`;
  else img.removeAttribute('srcset');
  img.src = frame.full;
  img.alt = frame.alt || '';
}

photo.addEventListener('click', () => close());
viewer.querySelector('.viewer-hint').addEventListener('click', () => close());
turn.addEventListener('click', flip);

document.addEventListener('keydown', event => {
  if (current === null) return;
  if (event.key === 'Escape')          { event.preventDefault(); close(); }
  else if (event.key === 'ArrowRight') { event.preventDefault(); step(1); }
  else if (event.key === 'ArrowLeft')  { event.preventDefault(); step(-1); }
  else if (event.key === 'f' || event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    event.preventDefault(); flip();
  }
});

/* ---------------------------------------------------------- deep links */
function fromHash({ push = false } = {}) {
  const n = Number(location.hash.slice(1));
  if (Number.isInteger(n) && entryFor(n)) open(n, { push });
  else close({ push });
}
window.addEventListener('popstate', () => fromHash());

/* ----------------------------------------------------------- start-up */
boot(stage, ['assets/img/paper.jpg', ...thumbs.map(t => t.querySelector('img').src)])
  .then(() => {
    grid.dataset.state = 'in';
    fromHash();
    // warm the enlargements in the background, one at a time
    let i = 0;
    const next = () => {
      if (i >= thumbs.length) return;
      const t = thumbs[i++];
      if (t.dataset.verso) prime(t.dataset.verso);
      // the first further frame of a card, so the turn is ready too. 1x only,
      // as below — the rest of a long card waits until it is asked for.
      if (t.dataset.others) {
        try { prime(JSON.parse(t.dataset.others)[0].full); } catch { /* ignore */ }
      }
      prime(t.dataset.full).then(() => idle(next));   // 1x only; see best()
    };
    idle(next);
  });

})();
