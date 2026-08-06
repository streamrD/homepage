# loupe — architecture, and the seams a platform plugs into

Written at the end of the session that produced it, for the version of this
that becomes a hosted product: photographers upload to B2, pick a theme, and
get a gallery, with Railway serving, Cloudflare in front, and Stripe deciding
who may.

Everything below is a decision that was *made and tested*, not a plan. Where
something is unresolved it says so.

---

## 1. What exists

| | what it is |
| --- | --- |
| `jimmy/` | a real gallery of five photographs. The proving ground. |
| `jimmy/v1/` | its first design, archived intact and still functional |
| `loupe/` | the pattern generalised — one engine, fifteen themes, two page types |

`loupe/` is not a framework anybody installs. It is one CSS file, one JS file,
a stylesheet per theme, and four HTML pages. No build step, no dependencies,
no npm. That is a deliberate constraint and it should survive
platformisation: the artefact a customer's gallery *is* should stay something
you can read in a browser's view-source.

---

## 2. The five decisions everything else hangs off

### 2.1 Content is a manifest, and `base` is the only thing that knows where

Every page carries its gallery as data:

```html
<script type="application/json" id="gallery">
{ "title": …, "credit": …, "base": "…/", "intro": […], "items": [ … ] }
</script>
```

`src()` in the engine resolves every path against `base`, and passes absolute
URLs straight through untouched. Nothing else in the engine — not the plates,
not the rail, not the enlargement, not the preloader — knows where a picture
lives.

**Why this is the most important line in the codebase:** it is the entire
integration surface for storage. Pointing a gallery at a bucket is one string:

```json
"base": "https://<bucket>.s3.us-east-005.backblazeb2.com/u/<user>/<gallery>/"
```

An upload pipeline never touches the engine. It writes files under a prefix
and writes a manifest. That is the whole contract.

`assets/config.js` holds the one switch that resolves `base` at runtime, with
`?assets=<url>` overriding per request so local and bucket can be compared
without editing anything.

### 2.2 A theme is a block of custom properties, and nothing else

`assets/loupe.css` contains no appearance decisions. Every colour, size,
duration, easing and distance is a `var()`. A theme is one file of tokens
declared as `:root, .t-<name>`, which means it styles a whole page when loaded
alone *and* scopes to an element when several are loaded together — that dual
selector is what lets `themes.html` render fifteen themes accurately on one
page without duplicating a single value.

Fifteen themes cost about 85 lines each. Adding one requires no engine change.

**For the platform:** a theme is a row in a table and a CSS file. Custom
themes, per-user overrides, and a visual theme editor are all "write different
values for known keys" — no code generation, no compilation.

### 2.3 Motion is a token like any other

`loupe.js` reads durations and fly-in geometry back out of the same custom
properties via `tok()` and `px()`. So a theme governs *how the page moves* as
completely as how it looks: riso settles in 600ms, gesso in 1700ms; cyanotype
throws thumbnails 14px, riso 130px.

This matters more than it sounds. If motion were fixed and only colour varied,
fifteen themes would feel like one gallery wearing hats.

### 2.4 One engine, two page types, decided by markup

```
#stage + #rail  →  entry page: plates, the fly-in, the full choreography
#grid           →  section page: fade only
```

Tokens, manifest, enlargement, keyboard and deep links are shared; only the
choreography is conditional. **A section page is this engine with the motion
left out.**

That is what makes real page loads between levels viable instead of a router.
Nothing on a section moves, so arriving by navigation costs nothing visually,
and the shared CSS/JS is already cached. The hierarchy needs no SPA.

### 2.5 Chrome has to survive the content being replaced

This was the hardest-won lesson and it arrived late. The first six themes put
their palettes almost entirely in the *thumbnails* and the type. Swap in a
photographer's own work and five of the six looked identical — a dark field, a
hairline rail, small type in a corner.

Three surfaces fix it, and two of them needed no new tokens:

- **Bleed or mat** — `--plate-base`, `--plate-inset`, `--plate-fit`.
  Full-bleed means the photograph *is* the page and chrome has nowhere to
  live. Matted insets it and `--ground` becomes a wall: a large permanent
  surface no upload can take away.
- **Duotone the rail** — `--rail-duotone`, `--duo-dark`, `--duo-light`.
  Thumbnails are remapped into two theme colours (grayscale → screen over the
  dark → multiply by the light; a real two-ended remap, not a hue-rotate
  tint), so a stranger's photographs still arrive looking like the theme.
  Enlargements are never touched and hover lifts a thumbnail back to the true
  photograph. **This is the only mechanism where chrome is applied *to*
  customer content, and it is the one that most directly solves brand
  identity in a multi-tenant product.**
- **An edge** — `#edge` with `--edge-width/-color/-inset`. Always visible,
  never over the middle of a picture, sits above the enlargement on purpose.

**Finding worth carrying forward:** matting only pays when `--ground` is a
considered colour. On near-black it reads as letterboxing. That is why the
monochrome family's light themes are matted and its dark ones bleed.

---

## 3. Where a platform plugs in

```
   upload  ──▶  derivatives  ──▶  bucket prefix  ──▶  manifest  ──▶  page
                                        │                 │
                                     B2 + CDN        base + items
```

**Storage.** A gallery is a prefix. Everything the engine needs is relative to
it. Suggested shape, mirroring what `jimmy/` and the tile generator already
produce:

```
u/<user>/<gallery>/
  img/     long edge 2000px, q82   enlargements and full-bleed plates
  thumbs/  400px square, q78       the rail and section grids
  og.jpg   1200×630                the share card
  gallery.json                     the manifest
```

**Derivative generation.** Currently `sips` in a shell script. On a server this
is ImageMagick/libvips with the same three outputs. Two rules learned by
getting them wrong: thumbnails must be square-cropped rather than letterboxed,
and the enlargement must never be cropped — which is why every test tile
carries corner ticks, so a cropping regression is visible instead of subtle.

**Manifest generation.** The upload step writes `gallery.json`; the page
fetches it instead of carrying it inline. That is a small change — `G` is
already parsed from one place — and it is what turns a static page into a
product.

**CDN.** Cloudflare in front of B2 is the ordinary arrangement and needs no
engine change, since paths are already absolute-through-`base`. One thing to
set at bucket-creation time rather than debug later: **CORS headers**. Nothing
built so far needs them — `<img>` loading is exempt — but the adaptive-chrome
idea (sample a photograph's corners to place the rail and derive the scrim)
reads pixels through a canvas, and that does.

**Serving.** Railway serving static files behind nginx is what this repo
already does. The natural product shape is one deploy serving many galleries,
routed by path or subdomain, with the per-gallery difference being nothing but
a manifest URL and a theme name. **Nothing in the engine is per-tenant.**

**Billing.** Stripe gates whether a gallery is published, its storage
allowance, and whether custom themes are available. None of that touches the
engine either; it decides what manifest gets written and whether a route
resolves.

---

## 4. What is deliberately *not* solved yet

- **The manifest is inline, not fetched.** Fine for hand-built galleries,
  wrong for generated ones. One change, not yet made.
- **Section pages are hand-written.** `loupe/section.html` fakes five of them
  with `?s=1…5`. A real gallery has static section files, or generates them.
- **No auth, no upload, no server.** Everything here is static files.
- **`tiles/` is git-ignored** — 441 generated test images, ~21 MB — so the
  deployed loupe defaults to the Moore photographs from `/jimmy/`. The filler
  set is local-only until a bucket exists. `assets/config.js` holds that
  switch.
- **Adaptive chrome** — deriving accent and scrim from the photographs
  themselves — is designed but unbuilt. It is the strongest idea for making
  canned themes feel bespoke, and it is the one thing that needs CORS.

---

## 5. Constraints and traps, recorded because they will recur

**CSS painting order.** The ground colour goes on `html` alone, never on
`body`. A section's backdrop is a negative-`z-index` child of `body`, and
painting order puts such a child above the *root* background but below
`body`'s own background box — so setting the ground on both hides it while
every property inspects as correct.

**Stacking, again.** Section cells are `position: relative`, so a fixed scrim
with `z-index: auto` paints in the same layer and loses on DOM order. It
carries an explicit `z-index: 2`. Expect a third instance of this class of bug
as layers accumulate.

**Some things must be measured, not declared.** How much room the credit has
depends on the rail's width, which depends on item count *and* the theme's
thumbnail size *and* its gap — three sources, only two of which a theme knows.
`sizeCredit()` measures and sets `--credit-max` on load and resize. A constant
calibrated for five items put the credit underneath ten.

**Carry every demo flag across links, or none.** Carrying only `theme` meant
descending into a section silently dropped the content mode and both chrome
axes, and the trail then carried you back up to a gallery you had never been
in. In a product these become session or URL state; the lesson is that partial
propagation is worse than none because it fails silently.

**Blend modes cannot be switched by a custom property.** `--rail-duotone: 1`
is read by JS and turned into a class, so themes stay pure token blocks. Any
future token that gates a blend mode, `mix-blend-mode` or `isolation` needs
the same treatment.

**Motion needs travel to be believable.** Three entrance attempts failed
before this landed: a `rotateX` hinge reads as something being stood back
upright; a spin in place reads as chaos; an offset that scales with the index
makes the last frame the only thing moving. What works is a shared direction
released in sequence. Seven entrances are kept on file in `jimmy/` with a
travel-per-frame table, including the bad one as a counter-example.

**Headless Chrome does not advance CSS transitions with its virtual clock.**
Every animation in this repo was verified by inspecting computed transforms
and geometry, never by catching a frame. Screenshots prove layout; they cannot
prove motion. Also: it will not open a window narrower than 500px, which
silently off-centres anything rendered at a phone width.

---

## 6. If I were starting the platform tomorrow

1. **Fetch the manifest instead of inlining it.** Smallest change with the
   largest consequence — it is the line between a page and a product.
2. **Move derivative generation server-side** with the same three outputs, and
   keep the corner-tick test fixtures: they catch cropping regressions that
   are invisible against real photographs.
3. **Make `--rail-place` and `--plate-rest` tokens.** Where the row sits
   (corner vs centre) and how far the plate steps back are currently
   hard-coded per site. `jimmy/` and `loupe/` differ on exactly this, which is
   the usual sign a thing wants to be a token.
4. **Build adaptive chrome early**, because it is what stops a dozen themes
   feeling canned, and because retrofitting CORS onto a populated bucket is
   worse than setting it on day one.
5. **Do not add a build step.** The absence of one is why fifteen themes took
   an afternoon and why a customer's gallery is legible in view-source. It is
   a feature, and it will be the first thing a framework tries to take away.
