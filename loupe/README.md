# `loupe/`

Working folder for a gallery pattern extracted from `jimmy/`: one to three
photographs arriving full-bleed with motion, then up to ten thumbnails that
fly in, settle, and become the navigation for everything below them.

Named for the loupe held over a contact sheet — small frames, choose one,
magnify. That is the gesture the pattern is built on.

**Start at `themes.html`** — twelve themes as cards, each rendered in its own
tokens, with switches for the chrome axes, linking through to a full gallery. `index.html` is the entry page and
takes `?theme=<name>`; the tiles come in matching palettes, so the whole page
changes together.

| theme | ground | character |
| --- | --- | --- |
| boardwalk | dark, neutral | saturated, generous motion — the register `jimmy/` is in |
| safelight | dark, warm | the darkroom lamp; red all the way through, slow |
| cyanotype | dark, cool | one iron-blue band, austere, motion held right back |
| autochrome | light, warm | serif, prints in a mat, gentle |
| daguerre | light, cool | silver chrome, but the enlargement opens onto near-black |
| riso | paper white | thick keylines, spot colour, no shadow, snappy |

A colour-forward family, which exists because of a flaw in the first six:
their palettes lived almost entirely in the thumbnails and the type, so a
photographer's own work would replace most of the identity. These push the
same palettes into the room instead — ground, scrim, viewing field, mat and
keylines — and borrow their parent theme's tiles, so what differs is chrome
alone.

| theme | pushes | how |
| --- | --- | --- |
| midway | boardwalk | oxblood room, gold keylines, gold spine down the left, gold mat |
| blueprint | cyanotype | prussian-blue room with pale ink; an inset hairline all round, like a plate mark |
| duplex | riso | coloured stock instead of white, one spot ink in a band across the top, the keylines and the mat |

**Almost none of this needed new tokens.** `--ground`, `--scrim-rgb`,
`--lit-ground`, `--mount-bg` and `--thumb-border` always accepted saturated
colour; the first six simply chose near-black and near-white for all of them.
The single surface with nowhere to live was an edge, so `#edge` was added —
`--edge-width`, `--edge-color`, `--edge-inset`, taking any border-width, so
`14px 0 0 0` is a band across the top, `0 0 0 9px` a spine down the left, and
`1px` at `--edge-inset: 20px` a hairline frame. It sits *above* the
enlargement on purpose: a frame that vanished when you opened a photograph
would be a viewer, not a frame.

All three are matted. A saturated ground is only worth having if you can see
it, which is the same finding that decided the monochrome family.

And a monochrome family, where hue cannot do the differentiating, so value,
warmth, texture, type and the generosity of the mat have to:

| theme | ground | carried by |
| --- | --- | --- |
| gesso | warm white | the widest mat of the twelve, refined serif, hairlines |
| plaster | cool light grey | same value as gesso, opposite temperament — narrow mat, tight gaps |
| newsprint | grey paper | heavy condensed sans, thick rules, the highest grain of the twelve |
| graphite | mid grey | monospace, tight mat, small frames close together |
| slate | dark blue-grey | bleed, and the widest margins in the set |
| obsidian | true black | no border, no shadow, no grain, no mat — value and tracking alone |

**The light ones are matted and the dark ones bleed**, which follows from the
first look at the mat axis: on a near-black ground a mat reads as
letterboxing, while on a pale ground it reads as a wall. gesso and plaster
share a value range and differ only in warmth, mat and type — deliberately,
as a test of whether that is enough. The monochrome six also share one
neutral tile set, `tiles/mono/`: with the content held constant, what you are
comparing between them is chrome and nothing else.

Twelve spans the space rather than filling it — two families, both grounds,
motion from riso's 600ms settle to gesso's 1700ms. A thirteenth should earn
its place by reaching somewhere none of these do.

## Chrome that survives an upload

The filler tiles were carrying most of each theme's identity. Replace them
with a photographer's own work and five of the six looked much alike — a dark
field, a hairline rail, small type in a corner. Two axes exist to fix that,
both off by default so nothing above changed:

**Bleed or mat** — `--plate-base`, `--plate-inset` and `--plate-fit`.
Full-bleed means the photograph *is* the page and chrome has nowhere to live.
Matted insets it and `--ground` becomes a wall: a large, permanent surface no
upload can take away. A matted theme must also set `--drift-scale: 1`, since
the resting drift scales the image and on a mat that pushes it past its own
margin.

`--plate-inset` is unitless and read as vmin rather than being folded into a
single `calc()`, so a miniature can reproduce the same mat as a percentage of
its own box without the viewport being involved. That is what lets the cards
in `themes.html` show a matted theme *as matted* — an earlier version always
drew them full-bleed and quietly misrepresented four of the twelve.

**Duotone the rail** — `--rail-duotone`, `--duo-dark`, `--duo-light`. The
rail is remapped into two theme colours, shadows to one and highlights to the
other, so a stranger's photographs still arrive looking like the theme.
Enlargements are never touched: the work is shown as it is, and hover lifts a
thumbnail back to the real photograph. It is a real two-ended remap — grayscale,
screened over the dark colour, multiplied by the light one — not a hue-rotate
tint. Every theme declares what its duotone *would* be while leaving it off,
so the axis can be compared without inventing colours per test.

Blend modes cannot be switched by a custom property, so `loupe.js` turns
`--rail-duotone: 1` into a class and themes stay pure token blocks.

**Judge these against photographs, not tiles.** `?tiles=photographs` swaps in
the Moore light studies from `../jimmy/`, on both page types. A section shows
the six available frames rather than repeating five of them four times to
reach twenty — a grid of visible duplicates reads as a fault.

All four demo flags — `theme`, `tiles`, `mat`, `duo` — are carried across
internal links by `withTheme()` in the engine. Carrying only `theme` meant
descending into a section silently dropped the photographs and both chrome
axes, and the trail then carried you back up to a gallery you had never been
in. Duotone in particular is meaningless
against flat colour swatches — it remaps a luminance ramp, and a flat tile has
none. `themes.html` has switches for all three; they are independent axes and
combine freely, and each is reproduced on the cards rather than only appended
to the links. The duotone preview mirrors the engine's rule exactly — an
earlier version left that axis unpreviewed and the switch simply looked
broken.

**What the first look showed:** matting only pays when `--ground` is a
considered colour. On boardwalk's near-black it reads as letterboxing; on
autochrome's cream and riso's paper it reads as a wall and a page. Any theme
meant to be matted needs its ground designed, not defaulted.

Each theme file declares `:root, .t-<name>`, so loaded alone it styles a
whole gallery and loaded alongside others it still scopes to an element.
That is what lets `themes.html` show all twelve at once without duplicating a
single colour value — each card is a real 1200×675 page under a `scale(0.32)`,
so the miniatures' proportions are the gallery's proportions.

## Two entrances, and where the row sits

Both are worth keeping as template options. The engine implements the first;
`jimmy/` now demonstrates the second, and porting it back here is small.

**scatter** — what loupe does today. Each thumbnail is thrown from a point on
an arc near the middle of the screen and flies to its resting place, tilting
as it goes. Three tokens drive it, so a theme can dial it from a hurl to a
nudge without touching JavaScript:

```
--scatter-radius   how far out the arc sits          riso 130px … cyanotype 14px
--scatter-spread   the sweep, divided by item count  riso 160deg … graphite 50deg
--thumb-tilt       rotation, alternating in sign     riso 14deg … most 0deg
```

`settleRail()` measures each thumbnail's real resting rectangle and works
backwards to a start point, which is why it survives any layout — corner row,
centred row, or the phone's vertical column — without knowing about any of
them.

**drop** — what `jimmy/` uses now. The thumbnails fall a short distance
straight onto the photograph, left to right, with no arc and no rotation:
`translateY(-38px) scale(0.96)` to `none`, 1050ms, 130ms apart.

The choice is not decorative. A flight reads well when the thumbnails are
*travelling* — crossing the screen to a corner they had no reason to be in. A
fall reads better when they are landing where the eye already is. Scatter for
a corner rail, drop for a centred row.

**Where the row sits** is the other half of the same decision, and is
currently hard-coded per site rather than tokenised:

- **corner** — bottom right, small, navigation filed out of the way, the
  photograph holding the screen. Every loupe theme.
- **centre** — the middle of the screen at a size worth looking at, with the
  photograph dimmed behind it to a fraction of full strength and the credit
  and one odd frame holding the corners. `jimmy/`.

Centre wants a much dimmer plate — `jimmy/` rests its background at 0.26 —
because the row is now the subject and the photograph is the room. Making
this a token pair (`--rail-place`, `--plate-rest`) is the obvious next step
if a second gallery wants the centred arrangement.

## Where the imagery lives

`assets/config.js` is the only place that knows. A manifest's `base` is built
from `LOUPE_CONFIG.assets`, so moving the pictures is one line rather than an
edit in four files:

```js
var DEFAULT_ASSETS = '';                                    // local
var DEFAULT_ASSETS = 'https://…backblazeb2.com/loupe/';     // staging
```

`?assets=<url>` overrides it for a single request and is carried across
links, so local and bucket can be compared without editing anything.
`?assets=` (empty) forces local back on.

**Code in git, pixels in the bucket.** `tiles/` is git-ignored — 441 files
and about 21 MB of generated scaffolding has no business in a repo that is
deployed verbatim on every push. The engine, the twelve themes and the four
pages are small, change often, and belong in history.

To stage: build the tiles, upload them under a `loupe/` prefix beside the
`jshimron/` one already in `stabley-homepage`, then point `DEFAULT_ASSETS` at
it.

```sh
for t in boardwalk safelight cyanotype autochrome daguerre riso mono; do
  bash loupe/make-tiles.sh "$t" 8777
done

# S3-compatible endpoint, same bucket as jshimron/
aws s3 sync loupe/tiles/ s3://stabley-homepage/loupe/tiles/ \
  --endpoint-url https://s3.us-east-005.backblazeb2.com
```

The Moore photographs behind `?tiles=photographs` are deliberately *not*
routed through this. They are served from `/jimmy/` on the site itself and
stay there wherever the tiles go.

If the adaptive-chrome idea is ever built — sampling a photograph's corners
to place the rail — that reads pixels through a canvas and will need CORS
headers on the bucket. Cheaper to set when the prefix is created than to
diagnose later.

## How a theme works

One engine, three files, and a theme is a block of custom properties:

```
assets/loupe.css            the engine — no appearance decisions in it
assets/loupe.js             builds the page from a manifest
assets/theme-<name>.css     the tokens, and the only thing a theme is
themes.html                 the picker — every theme, rendered in its own tokens
index.html                  the entry page, plus its manifest as JSON
section.html                a section page, fade only
```

Every colour, size, duration, easing and distance in `loupe.css` is a
`var()`. The fallbacks are only there so a failed theme load is not an
invisible page; they are not a house style.

**Motion is a token like any other.** `loupe.js` reads durations and the
fly-in geometry back out of the same custom properties, so a theme governs
how the page moves as completely as how it looks. Compare boardwalk, which
throws the thumbnails in from 110px away with a 9° tilt, against cyanotype,
which brings them 14px with no rotation at all. Set `--scatter-radius: 0` and
`--plate-start-scale: 1` and the choreography disappears without a line of
JavaScript changing.

Three tokens turned out to carry more weight than expected, all of them
because of the light theme:

- `--scrim-rgb` — on a pale ground the shading behind the chrome has to
  lighten rather than darken. So do the number strip and every text shadow.
- `--grain-blend` — `overlay` grain on a light ground turns to mud;
  autochrome uses `multiply` at a third the opacity.
- `--mount-*` — a theme's chance to frame the work. Autochrome hangs the
  enlargement in a mat with a hairline; boardwalk and cyanotype put the
  photograph straight onto the dark.

The gallery itself is data — a `<script type="application/json">` block with
the title, credit, one to three intro plates, and up to ten items. An item
with `href` becomes a link rather than an enlargement, which is how a section
gets attached later without the engine knowing anything about depth.

**One CSS trap worth not re-treading.** The ground colour goes on `html`
alone and never on `body`. A section's backdrop is a negative-`z-index` child
of `body`, and the painting order puts such a child above the *root*
background but below `body`'s own background box — so setting the ground on
both hid the backdrop completely while every property inspected as correct:
element present, opacity 0.2, image loaded.

**A second stacking trap, on section pages.** The cells are
`position: relative`, so a fixed `#shade` with `z-index: auto` paints in the
same layer and loses on DOM order — the scrim vanishes behind the grid. It
carries an explicit `z-index: 2`, above the cells and below `#plate-text`'s
3. A pseudo-element on `#plate-text` looked like the tidier fix and did not
work; the real element did.

**One thing had to be measured rather than tokenised.** How much room the
credit has depends on how wide the rail is, which depends on the item count
*and* the theme's thumbnail size *and* its gap. Ten 78px thumbnails come to
897px; a constant calibrated for five puts the credit underneath them. So
`loupe.js` measures the rail and sets `--credit-max` from it, on load and on
resize.

## Two page types, one engine

`loupe.js` decides its mode from what is in the markup — `#stage` and `#rail`
means the entry page, `#grid` means a section. Tokens, the manifest, the
enlargement, the keyboard and deep links are shared; only the choreography is
conditional. A section page is not a second engine, it is this one with the
motion left out.

That is what keeps real page loads viable between levels. Nothing on a
section moves — cells fade in on a stagger and that is all — so arriving by
navigation costs nothing visually, and the shared stylesheet and script are
already cached by the time you get there.

The demo is currently wired to the shape worth judging: **five thumbnails on
the entry page, each a landing page for twenty frames.** All five rail
thumbnails carry `href`, so nothing on the entry page enlarges any more — it
is navigation only, which is what the pattern is for.

`section.html` takes `?s=1…5` and builds its twenty items in a script block.
That is mockup scaffolding, not part of the pattern: a real gallery has five
static section files. All five share one set of twenty tiles, shown 01–20 in
order.

**The opening plays once per tab.** Coming back up from a section must not
make you watch it again, so `sessionStorage` routes a returning visitor down
the same instant path `prefers-reduced-motion` uses — the resting plate and
the settled rail, no bursts, no fly-in. Clear the tab's session storage to
see the opening again.

At 1440×900 twenty frames come to seven per row, three rows, no scrolling.
At 1280×720 it is six per row and four rows, so it scrolls — which is fine,
and `--cell-size` is the knob if you would rather it did not. Scrolling is
what forced the section scrim below.

## Getting around from a section

Two things, because the trail alone turned out not to be enough.

**The trail is the way up.** A section's manifest carries `trail`, and the
engine renders it into the title line of the credit block — `loupe / section
one`, with everything but the last step a link. It goes there rather than
into new chrome because the bottom-left corner is where the eye already is.

**The rail is the way across.** A section's manifest also carries `rail`, the
same five top-level thumbnails in the same bottom-right corner they occupy on
the entry page, with `current: true` on the one you are in. Any section is
one click from any other, instead of up-then-down through the entry page. It
fades in place rather than flying — motion belongs to the entry page — and
the current thumbnail keeps its accent border and number so the rail reads as
position and not merely as links.

The `#shade` gradient gained a second lobe at the bottom right for the same
reason it has one at the bottom left: cells scroll underneath both corners.

## The shape being tested

| level | what it is | motion |
| --- | --- | --- |
| entry | 1–3 full-bleed plates, then the rail of up to 10 | the full choreography |
| section | a set of thumbnails behind one rail thumbnail | fade only |
| frame | one photograph, whole and uncropped | fade only |

Motion is confined to the entry. Everything below it fades, which is what
makes real page loads viable for the deeper levels rather than an in-page
router.

## The test images

Three palettes exist, in `tiles/<theme>/`, identical in tiles, labels and
geometry so nothing but the colour changes between them.

```
tile.html        renders one tile; all appearance comes from query parameters
make-tiles.sh    drives it over one theme: bash make-tiles.sh boardwalk
contact-sheet.html   every tile in every palette, on one page
tiles/<theme>/img/
  plate-1…3.jpg  1600²  the opening plates, darkest of the three levels
  full-01…10.jpg 1600²  enlargements for the rail
tiles/<theme>/thumbs/
  thumb-01…10.jpg 400²  the rail itself, ten hues 36° apart
tiles/<theme>/sub/
  thumbs/sub-01…20.jpg 400²  a section one level down
  img/sub-01…20.jpg  1600²   its enlargements
```

`bash make-tiles.sh <theme> <port> sub` regenerates only the section tiles,
skipping the thirteen plate and rail renders. The section count comes from
the length of the `SUB` array, so changing twenty to something else is one
`seq` in the script.

Every tile states its number, its role (`rail`, `section`, `enlargement`),
its level, and its true pixel size. A thumbnail and its enlargement share a
hue and a number, so a mis-wired link is obvious rather than plausible.

Lightness encodes depth — in boardwalk, plates 26%, level one 38%, level two
50%. The exact values differ per palette, but every palette keeps that order,
so a screenshot shows how deep it was taken without reading anything.

**The corner ticks are the point.** Each tile carries an L-bracket at two
opposite corners. This design turns on `cover` versus `contain`: backgrounds
are cropped deliberately, enlargements must never be. If a bracket is missing,
something is cropping that should not be — which is otherwise very hard to
see in an abstract photograph, and was the slowest class of mistake to catch
while building `jimmy/`.

## Regenerating

Serve the repo root, then run the script:

```sh
python3 -m http.server 8777        # from the repo root
bash loupe/make-tiles.sh boardwalk 8777
```

About a minute for one palette's 35 tiles. The palettes themselves are HSL
tables in the `case` statement at the top of the script — a new one is a new
branch plus a matching `assets/theme-<name>.css`. Headless Chrome will not open a window narrower
than 500px, so the 400px tiles are rendered at 800px and scaled down; asking
for 400 directly gets a 500px layout cropped to 400, which silently
off-centres everything. For the same reason the pixel label is passed in as a
parameter rather than measured — `innerHeight` has not settled at capture
time and reports a size the file never has.
