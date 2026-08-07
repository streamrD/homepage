/* Password gate for the unfinished sections.

   This is a soft gate. The page is static, so the markup behind it is still in
   the source — it keeps the drafts out of the way of a casual visitor and out
   of search results, and that is all it does. Before anything sensitive goes
   on these pages, move the check to the host (HTTP basic auth) or encrypt the
   content at build time.

   The password itself is not in the file, only its SHA-256. */
(function () {
'use strict';

const KEY = 'moore-archives-unlocked';
const gate = document.querySelector('.gate');
if (!gate) return;

const expected = gate.dataset.hash;
const form  = gate.querySelector('form');
const input = gate.querySelector('input');
const error = gate.querySelector('.gate-error');

async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function unlock({ remember = true } = {}) {
  if (remember) {
    try { sessionStorage.setItem(KEY, expected); } catch { /* private mode */ }
  }
  document.documentElement.dataset.unlocked = '1';
  gate.hidden = true;
}

// already unlocked earlier this session
try {
  if (sessionStorage.getItem(KEY) === expected) unlock({ remember: false });
} catch { /* private mode */ }

form.addEventListener('submit', async event => {
  event.preventDefault();
  error.hidden = true;
  // crypto.subtle needs a secure context; file:// has none, so fall back
  const ok = window.crypto && crypto.subtle
    ? (await sha256(input.value)) === expected
    : input.value.length > 0 && await fallback(input.value);
  if (ok) unlock();
  else {
    error.hidden = false;
    input.select();
  }
});

/* file:// and plain http:// have no SubtleCrypto. A tiny SHA-256 so the
   password still never appears in the source. */
async function fallback(text) {
  return sha256sync(text) === expected;
}

function sha256sync(ascii) {
  function rightRotate(v, a) { return (v >>> a) | (v << (32 - a)); }
  const mathPow = Math.pow, maxWord = mathPow(2, 32);
  let result = '';
  const words = [], asciiBitLength = ascii.length * 8;
  const hash = sha256sync.h = sha256sync.h || [];
  const k = sha256sync.k = sha256sync.k || [];
  let primeCounter = k.length;
  const isComposite = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (let i = 0; i < 313; i += candidate) isComposite[i] = candidate;
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }
  const h = hash.slice(0);
  ascii += '\x80';
  while (ascii.length % 64 - 56) ascii += '\x00';
  for (let i = 0; i < ascii.length; i++) {
    const j = ascii.charCodeAt(i);
    if (j >> 8) return '';
    words[i >> 2] |= j << ((3 - i) % 4) * 8;
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;
  for (let j = 0; j < words.length;) {
    const w = words.slice(j, j += 16), oldHash = h.slice(0);
    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const a = h[0], e = h[4];
      const temp1 = h[7]
        + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
        + ((e & h[5]) ^ (~e & h[6])) + k[i]
        + (w[i] = i < 16 ? w[i] : (w[i - 16]
            + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
            + w[i - 7]
            + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) | 0);
      const temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
        + ((a & h[1]) ^ (a & h[2]) ^ (h[1] & h[2]));
      h.unshift((temp1 + temp2) | 0);
      h[4] = (h[4] + temp1) | 0;
      h.length = 8;
    }
    for (let i = 0; i < 8; i++) h[i] = (h[i] + oldHash[i]) | 0;
  }
  for (let i = 0; i < 8; i++) {
    for (let j = 3; j + 1; j--) {
      const b = (h[i] >> (j * 8)) & 255;
      result += ((b < 16) ? 0 : '') + b.toString(16);
    }
  }
  return result;
}

})();
