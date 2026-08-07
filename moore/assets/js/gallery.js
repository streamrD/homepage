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

const entryFor = n => document.getElementById(`slide-${n}`);

/* Focus we move ourselves — on opening, and on every arrow-key step — should
   not draw a ring. The reader already knows where they are; the ring reads as
   a stray black box round the photograph. Focus the user *tabs* to still
   shows, which is the case the indicator exists for. */
function focusQuietly(el) {
  viewer.dataset.quiet = '1';
  el.focus({ preventScroll: true });
}
addEventListener('keydown', e => {
  if (e.key === 'Tab') delete viewer.dataset.quiet;
}, true);
addEventListener('pointerdown', () => { delete viewer.dataset.quiet; }, true);

/* --------------------------------------------------------- image priming
   The enlargements are only referenced from the thumbnails, so without this
   the fetch starts on click and the fade runs over an empty frame. Prime on
   hover or focus, and quietly fetch the rest once the page is idle. */
const primed = new Map();

function prime(url) {
  if (!primed.has(url)) {
    const img = new Image();
    img.src = url;
    primed.set(url, img.decode ? img.decode().catch(() => {}) : Promise.resolve());
  }
  return primed.get(url);
}

const idle = window.requestIdleCallback || (fn => setTimeout(fn, 400));

// pushState is rejected on file:// (opaque origin), so deep links are a
// progressive nicety rather than something the viewer depends on
const setHash = url => { try { history.pushState({}, '', url); } catch { /* file:// */ } };

/* ------------------------------------------------------------- dimming */
for (const button of thumbs) {
  const on  = () => {
    grid.dataset.hover = '1'; button.dataset.hovered = '1';
    prime(button.dataset.full);
  };
  const off = () => { delete grid.dataset.hover; delete button.dataset.hovered; };
  button.addEventListener('pointerenter', on);
  button.addEventListener('pointerleave', off);
  button.addEventListener('focus', on);
  button.addEventListener('blur', off);
  button.addEventListener('click', () => open(Number(button.dataset.n)));
}

/* -------------------------------------------------------------- viewer */
function open(n, { push = true } = {}) {
  const entry  = entryFor(n);
  const button = thumbs.find(t => Number(t.dataset.n) === n);
  if (!entry || !button) return;

  if (current === null) lastFocused = document.activeElement;
  current = n;

  const title = entry.querySelector('h2').textContent;
  const src = button.dataset.full;

  // shape the card to this print (recto and verso are the same object)
  const shot = entry.querySelector('img');
  if (shot?.getAttribute('width')) {
    viewer.style.setProperty('--ar',
      `${shot.getAttribute('width')} / ${shot.getAttribute('height')}`);
  }
  photo.setAttribute('aria-label', `${title} — back to the contact sheet`);
  // swap only once the frame has decoded, so stepping never blanks the box
  prime(src).then(() => {
    if (current !== n) return;               // moved on while decoding
    photoImg.src = src;
    photoImg.alt = title;
  });

  // a print scanned on both sides can be turned over
  const back = button.dataset.verso;
  delete viewer.dataset.face;
  turn.hidden = !back;
  turn.textContent = 'Turn over';
  if (back) {
    prime(back).then(() => {
      if (current !== n) return;
      versoImg.src = back;
      versoImg.alt = button.dataset.versoAlt || `${title} — reverse`;
    });
  } else {
    versoImg.removeAttribute('src');
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
  delete grid.dataset.hover;
  for (const t of thumbs) delete t.dataset.hovered;

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
  target?.focus({ preventScroll: true });

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
  if (showing) delete viewer.dataset.face;
  else viewer.dataset.face = 'verso';
  turn.textContent = showing ? 'Turn over' : 'Turn back';
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
      prime(t.dataset.full).then(() => idle(next));
    };
    idle(next);
  });

})();
